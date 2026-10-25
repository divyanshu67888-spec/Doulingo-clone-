import { prisma } from '@/lib/db';
import { localDate } from './time';
import { computeLevel } from './levels';

export interface AwardXpResult {
  newTotalXp: number;
  newDailyXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function awardXp(
  userId: string,
  unitId: string,
  amount: number,
  instant: Date = new Date(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  externalTx?: any
): Promise<AwardXpResult> {
  const runner = async (tx: typeof prisma) => {
    // 1. Fetch user
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, totalXp: true, timeZone: true, language: true },
    });

    if (amount <= 0) {
      const today = localDate(user.timeZone, instant);
      const daily = await tx.dailyActivity.findUnique({
        where: { userId_localDate: { userId, localDate: today } },
      });
      const lvl = computeLevel(user.totalXp).level;
      return {
        newTotalXp: user.totalXp,
        newDailyXp: daily?.xp ?? 0,
        oldLevel: lvl,
        newLevel: lvl,
        leveledUp: false,
      };
    }

    const oldTotalXp = user.totalXp;
    const newTotalXp = oldTotalXp + amount;
    const oldLevel = computeLevel(oldTotalXp).level;
    const newLevel = computeLevel(newTotalXp).level;
    const leveledUp = newLevel > oldLevel;

    // 2. Update User.totalXp
    await tx.user.update({
      where: { id: userId },
      data: { totalXp: newTotalXp },
    });

    // 3. Upsert DailyActivity
    const today = localDate(user.timeZone, instant);
    const daily = await tx.dailyActivity.upsert({
      where: { userId_localDate: { userId, localDate: today } },
      update: { xp: { increment: amount } },
      create: {
        userId,
        localDate: today,
        xp: amount,
        seconds: 0,
      },
    });

    // 4. Update LessonProgress for that specific unit/lesson
    await tx.lessonProgress.updateMany({
      where: {
        userId,
        language: user.language,
        unitId,
      },
      data: {
        xpEarned: { increment: amount },
      },
    });

    // 5. Level-up notification if threshold crossed
    if (leveledUp) {
      for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        const dedupeKey = `level:${lvl}`;
        const existing = await tx.notification.findUnique({
          where: { userId_dedupeKey: { userId, dedupeKey } },
        });

        if (!existing) {
          await tx.notification.create({
            data: {
              userId,
              type: 'level_up',
              message: `Congratulations! You reached Level ${lvl}! 🎉`,
              dedupeKey,
            },
          });
        }
      }
    }

    return {
      newTotalXp,
      newDailyXp: daily.xp,
      oldLevel,
      newLevel,
      leveledUp,
    };
  };

  if (externalTx) {
    return await runner(externalTx);
  }

  return await prisma.$transaction(async (tx) => {
    return await runner(tx as unknown as typeof prisma);
  });
}
