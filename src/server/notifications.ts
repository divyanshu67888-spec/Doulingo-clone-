import { prisma } from '@/lib/db';
import { localDate, localHour } from './time';

export async function checkAndCreateStreakReminder(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  if (!user || !user.settings?.remindersEnabled) {
    return;
  }

  const now = new Date();
  const currentHour = localHour(user.timeZone, now);

  // Streak reminder once per day if past 6 PM (18:00) local time and no lesson completed today
  if (currentHour >= 18) {
    const today = localDate(user.timeZone, now);
    if (user.lastLessonLocalDate !== today) {
      const dedupeKey = `streak:${today}`;
      const existing = await prisma.notification.findUnique({
        where: { userId_dedupeKey: { userId, dedupeKey } },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'streak_reminder',
            message: `Keep your streak alive! Practice today before midnight! 🔥`,
            dedupeKey,
          },
        });
      }
    }
  }
}

export async function getUserNotifications(userId: string) {
  // Trigger automatic check
  await checkAndCreateStreakReminder(userId);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  });

  return {
    notifications,
    unreadCount,
  };
}

export async function markNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
}
