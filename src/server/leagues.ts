import { LeagueTier, LEAGUE_THRESHOLDS, LEAGUE_ORDER } from '@/lib/tokens';

export interface LeagueInfo {
  tier: LeagueTier;
  nextTier: LeagueTier | null;
  xpToNext: number;
  progress: number; // 0 to 1
  note: string;
  isTopLeague: boolean;
}

export function computeLeague(totalXp: number): LeagueInfo {
  const safeXp = Math.max(0, totalXp);

  let currentTier: LeagueTier = 'Bronze';
  for (const tier of LEAGUE_ORDER) {
    if (safeXp >= LEAGUE_THRESHOLDS[tier]) {
      currentTier = tier;
    }
  }

  const currentIndex = LEAGUE_ORDER.indexOf(currentTier);
  const nextTier = currentIndex < LEAGUE_ORDER.length - 1 ? LEAGUE_ORDER[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      tier: 'Ruby',
      nextTier: null,
      xpToNext: 0,
      progress: 1,
      note: "You're in the top league.",
      isTopLeague: true,
    };
  }

  const currentThreshold = LEAGUE_THRESHOLDS[currentTier];
  const nextThreshold = LEAGUE_THRESHOLDS[nextTier];
  const xpToNext = Math.max(0, nextThreshold - safeXp);
  const tierSpan = nextThreshold - currentThreshold;
  const progress = Math.min(1, Math.max(0, (safeXp - currentThreshold) / tierSpan));

  return {
    tier: currentTier,
    nextTier,
    xpToNext,
    progress,
    note: `${xpToNext} XP to reach ${nextTier}`,
    isTopLeague: false,
  };
}
