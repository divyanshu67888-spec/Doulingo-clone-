import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLast7LocalDates, getWeekdayLabel, localDate } from '@/server/time';

export function niceCeil(val: number): number {
  if (val <= 0) return 50;
  if (val <= 10) return 10;
  if (val <= 25) return 25;
  if (val <= 50) return 50;
  if (val <= 100) return 100;
  if (val <= 150) return 150;
  if (val <= 200) return 200;
  if (val <= 300) return 300;
  return Math.ceil(val / 100) * 100;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timeZone: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const now = new Date();
  const last7Dates = getLast7LocalDates(user.timeZone, now);
  const todayStr = localDate(user.timeZone, now);

  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId,
      localDate: { in: last7Dates },
    },
  });

  const activityMap = new Map(activities.map((a) => [a.localDate, a.xp]));

  const days = last7Dates.map((d) => {
    const xp = activityMap.get(d) || 0;
    const isToday = d === todayStr;
    const weekday = getWeekdayLabel(d);
    return {
      localDate: d,
      weekday,
      xp,
      isToday,
    };
  });

  const maxXp = Math.max(...days.map((d) => d.xp), 0);
  const axisMax = niceCeil(maxXp);
  const totalWeeklyXp = days.reduce((acc, d) => acc + d.xp, 0);

  return NextResponse.json({
    days,
    axisMax,
    maxXp,
    totalWeeklyXp,
    isEmpty: maxXp === 0,
  });
}
