import { prisma } from '@/lib/db';

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export interface HeartsStatus {
  hearts: number;
  maxHearts: number;
  nextHeartInSeconds: number | null; // null if already at max
}

export function computeHearts(
  storedHearts: number,
  heartsUpdatedAt: Date | string | number,
  now: Date = new Date()
): HeartsStatus {
  const updatedTime = new Date(heartsUpdatedAt).getTime();
  const elapsed = Math.max(0, now.getTime() - updatedTime);
  const windows = Math.floor(elapsed / HEART_REFILL_MS);

  const currentHearts = Math.min(MAX_HEARTS, storedHearts + windows);

  if (currentHearts >= MAX_HEARTS) {
    return {
      hearts: MAX_HEARTS,
      maxHearts: MAX_HEARTS,
      nextHeartInSeconds: null,
    };
  }

  const remainder = elapsed % HEART_REFILL_MS;
  const msUntilNext = HEART_REFILL_MS - remainder;
  const nextHeartInSeconds = Math.max(1, Math.ceil(msUntilNext / 1000));

  return {
    hearts: currentHearts,
    maxHearts: MAX_HEARTS,
    nextHeartInSeconds,
  };
}

/**
 * Deducts 1 heart according to ARCHITECTURE.md:
 * "On a loss: materialize the current value, subtract 1, and set heartsUpdatedAt = now only if the user was previously at cap,
 * otherwise advance it by the whole windows consumed so partial progress carries over."
 */
export async function loseHeart(userId: string): Promise<{ hearts: number; success: boolean }> {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, hearts: true, heartsUpdatedAt: true },
    });
    if (!user) throw new Error('User not found');

    const now = new Date();
    const updatedTime = new Date(user.heartsUpdatedAt).getTime();
    const elapsed = Math.max(0, now.getTime() - updatedTime);
    const windows = Math.floor(elapsed / HEART_REFILL_MS);
    const materialized = Math.min(MAX_HEARTS, user.hearts + windows);

    if (materialized <= 0) {
      return { hearts: 0, success: false };
    }

    const wasAtCap = materialized >= MAX_HEARTS;
    const newHearts = materialized - 1;

    let newUpdatedAt: Date;
    if (wasAtCap) {
      newUpdatedAt = now;
    } else {
      // Advance by the whole windows consumed so partial progress carries over
      newUpdatedAt = new Date(updatedTime + windows * HEART_REFILL_MS);
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        hearts: newHearts,
        heartsUpdatedAt: newUpdatedAt,
      },
    });

    return { hearts: newHearts, success: true };
  });
}

/**
 * Watch Ad / refill all hearts to 5
 */
export async function refillAllHearts(userId: string): Promise<number> {
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      hearts: MAX_HEARTS,
      heartsUpdatedAt: now,
    },
  });
  return MAX_HEARTS;
}
