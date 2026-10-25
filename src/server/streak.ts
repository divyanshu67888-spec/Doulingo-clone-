import { localDate, getYesterdayLocalDate } from './time';

export interface DisplayStreak {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
}

/**
 * At read time, if lastLessonLocalDate is older than yesterday, the displayed current streak is 0.
 * Stored values are not rewritten on read, and longestStreak is never touched.
 */
export function evaluateReadStreak(
  storedCurrentStreak: number,
  storedLongestStreak: number,
  lastLessonLocalDate: string | null | undefined,
  userTz: string = 'UTC',
  now: Date = new Date()
): DisplayStreak {
  const today = localDate(userTz, now);
  const yesterday = getYesterdayLocalDate(userTz, now);

  if (!lastLessonLocalDate) {
    return {
      currentStreak: 0,
      longestStreak: storedLongestStreak || 0,
      isActiveToday: false,
    };
  }

  const isActiveToday = lastLessonLocalDate === today;

  if (lastLessonLocalDate === today || lastLessonLocalDate === yesterday) {
    return {
      currentStreak: storedCurrentStreak,
      longestStreak: Math.max(storedLongestStreak || 0, storedCurrentStreak),
      isActiveToday,
    };
  }

  // Older than yesterday -> streak broken (displays 0 at read time)
  return {
    currentStreak: 0,
    longestStreak: storedLongestStreak || 0,
    isActiveToday: false,
  };
}

/**
 * Calculates updated streak state when a lesson is completed on a local date.
 * If lastLessonLocalDate is yesterday, currentStreak += 1;
 * if today, no change;
 * otherwise set it to 1.
 * longestStreak = max(longestStreak, currentStreak).
 */
export function calculateCompletedLessonStreak(
  storedCurrentStreak: number,
  storedLongestStreak: number,
  lastLessonLocalDate: string | null | undefined,
  userTz: string = 'UTC',
  now: Date = new Date()
): { currentStreak: number; longestStreak: number; lastLessonLocalDate: string } {
  const today = localDate(userTz, now);
  const yesterday = getYesterdayLocalDate(userTz, now);

  let newCurrent: number;

  if (lastLessonLocalDate === today) {
    // Already did a lesson today
    newCurrent = storedCurrentStreak;
  } else if (lastLessonLocalDate === yesterday) {
    // Continuing streak
    newCurrent = storedCurrentStreak + 1;
  } else {
    // Started or restarted streak
    newCurrent = 1;
  }

  const newLongest = Math.max(storedLongestStreak || 0, newCurrent);

  return {
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastLessonLocalDate: today,
  };
}
