export interface LevelInfo {
  level: number;
  progress: number; // 0 to 1
  xpInLevel: number;
  xpForNextLevel: number;
  isMaxLevel: boolean;
}

export function computeLevel(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, totalXp);
  const calculated = Math.floor(safeXp / 100) + 1;
  const level = Math.min(20, calculated);
  const isMaxLevel = level >= 20;

  if (isMaxLevel) {
    return {
      level: 20,
      progress: 1,
      xpInLevel: 100,
      xpForNextLevel: 0,
      isMaxLevel: true,
    };
  }

  const xpInLevel = safeXp % 100;
  const progress = xpInLevel / 100;

  return {
    level,
    progress,
    xpInLevel,
    xpForNextLevel: 100 - xpInLevel,
    isMaxLevel: false,
  };
}
