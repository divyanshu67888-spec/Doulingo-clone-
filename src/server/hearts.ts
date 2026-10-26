import { prisma } from '@/lib/db';

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export interface HeartsStatus {
  hearts: number;
  maxHearts: number;
  nextHeartInSeconds: number | null; // null if already at max
  isUnlimited?: boolean;
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
      isUnlimited: true,
    };
  }

  const remainder = elapsed % HEART_REFILL_MS;
  const msUntilNext = HEART_REFILL_MS - remainder;
  const nextHeartInSeconds = Math.max(1, Math.ceil(msUntilNext / 1000));

  return {
    hearts: currentHearts,
    maxHearts: MAX_HEARTS,
    nextHeartInSeconds,
    isUnlimited: true,
  };
}

/**
 * Deducts 1 heart - in unlimited mode, hearts never deplete so users can practice freely.
 */
export async function loseHeart(_userId: string): Promise<{ hearts: number; success: boolean }> {
  // Unlimited hearts lifeline mode: user never loses hearts
  return { hearts: MAX_HEARTS, success: true };
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
