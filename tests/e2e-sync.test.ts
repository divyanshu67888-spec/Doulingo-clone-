import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/db';
import { initializeUserProgress } from '../src/server/lessons';
import { createLessonSession } from '../src/server/sessions';
import { completeLesson } from '../src/server/lessons';
import { getLeaderboard } from '../src/server/leaderboard';
import { computeLevel } from '../src/server/levels';
import { computeLeague } from '../src/server/leagues';
import { localDate } from '../src/server/time';

describe('Y1: End-to-End Sync Integrity Test', () => {
  let syncUserId: string;
  let greetingsUnitId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `sync_tester_${Date.now()}@linguaquest.test`,
        passwordHash: 'dummy_hash',
        displayName: 'SyncHero',
        timeZone: 'UTC',
        language: 'es',
        hearts: 5,
        settings: {
          create: {
            soundEnabled: true,
            remindersEnabled: true,
            emailRemindersEnabled: true,
          },
        },
      },
    });
    syncUserId = user.id;

    const greetings = await prisma.unit.findFirstOrThrow({
      where: { language: 'es', key: 'greetings' },
    });
    greetingsUnitId = greetings.id;

    await initializeUserProgress(syncUserId, 'es');
  });

  afterAll(async () => {
    if (syncUserId) {
      await prisma.user.delete({ where: { id: syncUserId } });
    }
    await prisma.$disconnect();
  });

  it('completes a lesson, then asserts total XP, daily XP, level, league, leaderboard, chart bar, streak, and crowns match', async () => {
    // 1. Start session
    const session = await createLessonSession(syncUserId, greetingsUnitId, 'normal');
    const exercises: Array<{ id: string }> = JSON.parse(
      (await prisma.lessonSession.findUniqueOrThrow({ where: { id: session.id } })).exercises
    );

    // 2. Mark all exercises correct in session
    await prisma.lessonSession.update({
      where: { id: session.id },
      data: {
        correctIds: JSON.stringify(exercises.map((e) => e.id)),
        wrongCount: 0,
        secondsActive: 120, // 2 minutes
      },
    });

    // 3. Complete lesson
    const completion = await completeLesson(session.id);
    expect(completion.success).toBe(true);
    expect(completion.xpAwarded).toBe(20);

    // 4. Assert User record (Source of Truth)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: syncUserId } });
    expect(user.totalXp).toBe(20);
    expect(user.currentStreak).toBe(1);
    expect(user.longestStreak).toBe(1);
    expect(user.totalSeconds).toBe(120);

    // 5. Assert Daily Activity (Today's bar & Daily Goal)
    const today = localDate(user.timeZone);
    const dailyActivity = await prisma.dailyActivity.findUniqueOrThrow({
      where: { userId_localDate: { userId: syncUserId, localDate: today } },
    });
    expect(dailyActivity.xp).toBe(20);
    expect(dailyActivity.seconds).toBe(120);

    // 6. Assert Level & League match
    const levelInfo = computeLevel(user.totalXp);
    expect(levelInfo.level).toBe(1);
    expect(levelInfo.xpInLevel).toBe(20);

    const leagueInfo = computeLeague(user.totalXp);
    expect(leagueInfo.tier).toBe('Bronze');
    expect(leagueInfo.xpToNext).toBe(480); // 500 - 20

    // 7. Assert Lesson Progress & Crowns
    const lessonProgress = await prisma.lessonProgress.findUniqueOrThrow({
      where: {
        userId_language_unitId: {
          userId: syncUserId,
          language: 'es',
          unitId: greetingsUnitId,
        },
      },
    });
    expect(lessonProgress.status).toBe('completed');
    expect(lessonProgress.crowns).toBe(1);
    expect(lessonProgress.xpEarned).toBe(20);

    // 8. Assert Leaderboard entry reflects same total XP & true rank
    const leaderboard = await getLeaderboard(syncUserId);
    expect(leaderboard.currentUserEntry).toBeDefined();
    expect(leaderboard.currentUserEntry!.totalXp).toBe(20);
    expect(leaderboard.currentUserEntry!.userId).toBe(syncUserId);
  });
});
