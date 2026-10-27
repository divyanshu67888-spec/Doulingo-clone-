import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { localDate } from '@/server/time';
import { computeLevel } from '@/server/levels';
import { computeLeague } from '@/server/leagues';
import { evaluateReadStreak } from '@/server/streak';
import { computeHearts } from '@/server/hearts';
import { getUserNotifications } from '@/server/notifications';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      progress: {
        where: { language: 'es' },
        include: { unit: true },
        orderBy: { unit: { orderIndex: 'asc' } },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const now = new Date();
  const today = localDate(user.timeZone, now);

  const dailyActivity = await prisma.dailyActivity.findUnique({
    where: { userId_localDate: { userId, localDate: today } },
  });
  const todayXp = dailyActivity?.xp ?? 0;

  const levelInfo = computeLevel(user.totalXp);
  const leagueInfo = computeLeague(user.totalXp);
  const streakInfo = evaluateReadStreak(
    user.currentStreak,
    user.longestStreak,
    user.lastLessonLocalDate,
    user.timeZone,
    now
  );
  const heartsInfo = computeHearts(user.hearts, user.heartsUpdatedAt, now);
  const { unreadCount } = await getUserNotifications(userId);

  const completedCount = user.progress.filter((p) => p.status === 'completed').length;
  const unlockedCount = user.progress.length;

  // Next lesson node to continue: first unlocked but not completed, or fallback to first
  const currentIncomplete = user.progress.find((p) => p.status !== 'completed');
  const continueUnitId = currentIncomplete?.unitId || user.progress[0]?.unitId || '';

  return NextResponse.json({
    displayName: user.displayName,
    photoUrl: user.photoUrl,
    language: user.language,
    timeZone: user.timeZone,
    dailyGoal: user.dailyGoal,
    totalSeconds: user.totalSeconds,
    totalXp: user.totalXp,
    todayXp,
    level: levelInfo,
    league: leagueInfo,
    streak: streakInfo,
    hearts: heartsInfo,
    progress: user.progress.map((p) => ({
      id: p.id,
      unitId: p.unitId,
      unitKey: p.unit.key,
      title: p.unit.title,
      description: p.unit.description,
      orderIndex: p.unit.orderIndex,
      status: p.status === 'completed' ? 'completed' : 'unlocked',
      crowns: p.crowns,
      xpEarned: p.xpEarned,
      xpReward: p.unit.xpReward,
      exerciseCount: p.unit.exerciseCount,
    })),
    completedCount,
    unlockedCount,
    totalUnitsCount: user.progress.length,
    continueUnitId,
    unreadNotifications: unreadCount,
    settings: user.settings,
  });
}
