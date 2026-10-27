import { prisma } from '@/lib/db';
import { calculateCompletedLessonStreak } from './streak';
import { awardXp } from './xp';
import { getDifficultyCrown, Difficulty } from './crowns';
import { localDate } from './time';

export async function initializeUserProgress(userId: string, language: string = 'es') {
  const units = await prisma.unit.findMany({
    where: { language },
    orderBy: { orderIndex: 'asc' },
  });

  for (const unit of units) {
    const existing = await prisma.lessonProgress.findUnique({
      where: {
        userId_language_unitId: {
          userId,
          language,
          unitId: unit.id,
        },
      },
    });

    if (!existing) {
      await prisma.lessonProgress.create({
        data: {
          userId,
          language,
          unitId: unit.id,
          status: 'unlocked',
          crowns: 0,
          xpEarned: 0,
        },
      });
    } else if (existing.status === 'locked') {
      await prisma.lessonProgress.update({
        where: { id: existing.id },
        data: { status: 'unlocked' },
      });
    }
  }
}

export interface CompleteLessonResult {
  success: boolean;
  xpAwarded: number;
  newTotalXp: number;
  newDailyXp: number;
  currentStreak: number;
  longestStreak: number;
  crownsEarned: number;
  isPerfect: boolean;
  leveledUp: boolean;
  newLevel: number;
  unitTitle: string;
}

export async function completeLesson(sessionId: string, instant: Date = new Date()): Promise<CompleteLessonResult> {
  const session = await prisma.lessonSession.findUnique({
    where: { id: sessionId },
    include: {
      unit: true,
      user: true,
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Idempotency: if already completed, return cached result
  if (session.status === 'completed') {
    const today = localDate(session.user.timeZone, instant);
    const daily = await prisma.dailyActivity.findUnique({
      where: { userId_localDate: { userId: session.userId, localDate: today } },
    });
    return {
      success: true,
      xpAwarded: session.xpSoFar,
      newTotalXp: session.user.totalXp,
      newDailyXp: daily?.xp ?? 0,
      currentStreak: session.user.currentStreak,
      longestStreak: session.user.longestStreak,
      crownsEarned: 0,
      isPerfect: session.wrongCount === 0,
      leveledUp: false,
      newLevel: Math.min(20, Math.floor(session.user.totalXp / 100) + 1),
      unitTitle: session.unit.title,
    };
  }

  // Server-side verification: Every exercise must be present in correctIds
  const exercises: Array<{ id: string }> = JSON.parse(session.exercises);
  const correctIds: string[] = JSON.parse(session.correctIds || '[]');

  const allAnsweredCorrectly = exercises.every((ex) => correctIds.includes(ex.id));
  if (!allAnsweredCorrectly) {
    throw new Error('Lesson completion failed: Not all exercises have been answered correctly.');
  }

  const userId = session.userId;
  const unitId = session.unitId;
  const language = session.unit.language;
  const difficulty = (session.difficulty as Difficulty) || 'normal';
  const difficultyCrown = getDifficultyCrown(difficulty);
  const isPerfect = session.wrongCount === 0;

  // Determine XP reward: 20 XP for first completion, 10 XP for replay
  const currentProgress = await prisma.lessonProgress.findUnique({
    where: {
      userId_language_unitId: {
        userId,
        language,
        unitId,
      },
    },
  });

  const isFirstCompletion = currentProgress?.status !== 'completed';
  const xpAwarded = isFirstCompletion ? 20 : 10;

  return await prisma.$transaction(async (tx) => {
    // 1. Mark session completed
    await tx.lessonSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        xpSoFar: xpAwarded,
        completedAt: instant,
      },
    });

    // 2. Update current unit LessonProgress (one single row update)
    const newCrowns = Math.max(currentProgress?.crowns ?? 0, difficultyCrown);
    await tx.lessonProgress.update({
      where: {
        userId_language_unitId: {
          userId,
          language,
          unitId,
        },
      },
      data: {
        status: 'completed',
        crowns: newCrowns,
        completedAt: instant,
      },
    });

    // 3. Unlock NEXT unit if it was locked (one single row update)
    const nextUnit = await tx.unit.findFirst({
      where: {
        language,
        orderIndex: session.unit.orderIndex + 1,
      },
    });

    if (nextUnit) {
      const nextProgress = await tx.lessonProgress.findUnique({
        where: {
          userId_language_unitId: {
            userId,
            language,
            unitId: nextUnit.id,
          },
        },
      });

      if (nextProgress && nextProgress.status === 'locked') {
        await tx.lessonProgress.update({
          where: {
            userId_language_unitId: {
              userId,
              language,
              unitId: nextUnit.id,
            },
          },
          data: {
            status: 'unlocked',
          },
        });
      }
    }

    // 4. Update streak
    const streakResult = calculateCompletedLessonStreak(
      session.user.currentStreak,
      session.user.longestStreak,
      session.user.lastLessonLocalDate,
      session.user.timeZone,
      instant
    );

    // 5. Update user stats (streak and time spent)
    await tx.user.update({
      where: { id: userId },
      data: {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastLessonLocalDate: streakResult.lastLessonLocalDate,
        totalSeconds: { increment: session.secondsActive },
      },
    });

    // 6. Update DailyActivity seconds
    const today = localDate(session.user.timeZone, instant);
    await tx.dailyActivity.upsert({
      where: { userId_localDate: { userId, localDate: today } },
      update: { seconds: { increment: session.secondsActive } },
      create: {
        userId,
        localDate: today,
        xp: 0,
        seconds: session.secondsActive,
      },
    });

    // 7. Authoritative XP award path
    const xpResult = await awardXp(userId, unitId, xpAwarded, instant, tx);

    return {
      success: true,
      xpAwarded,
      newTotalXp: xpResult.newTotalXp,
      newDailyXp: xpResult.newDailyXp,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      crownsEarned: newCrowns,
      isPerfect,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      unitTitle: session.unit.title,
    };
  });
}
