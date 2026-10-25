export type Difficulty = 'normal' | 'medium' | 'hard';

export function getDifficultyCrown(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'normal':
      return 1;
    case 'medium':
      return 2;
    case 'hard':
      return 3;
    default:
      return 1;
  }
}

export function isDifficultyUnlocked(difficulty: Difficulty, currentCrowns: number): boolean {
  if (difficulty === 'normal') return true;
  if (difficulty === 'medium') return currentCrowns >= 1;
  if (difficulty === 'hard') return currentCrowns >= 2;
  return false;
}
