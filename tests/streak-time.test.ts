import { describe, it, expect } from 'vitest';
import { calculateCompletedLessonStreak, evaluateReadStreak } from '../src/server/streak';
import { localDate, getYesterdayLocalDate, localHour } from '../src/server/time';

describe('Timezone and Local Date Handling', () => {
  it('correctly derives local date across midnight boundaries for different timezones', () => {
    // 2026-06-15 at 02:00:00 UTC
    // In Tokyo (UTC+9), it is already 2026-06-15 at 11:00
    // In New York (EDT, UTC-4), it is still 2026-06-14 at 22:00
    const instant = new Date('2026-06-15T02:00:00Z');

    expect(localDate('UTC', instant)).toBe('2026-06-15');
    expect(localDate('Asia/Tokyo', instant)).toBe('2026-06-15');
    expect(localDate('America/New_York', instant)).toBe('2026-06-14');
  });

  it('correctly calculates local hour for 6 PM reminder trigger', () => {
    const eveningInNy = new Date('2026-06-14T22:30:00Z'); // 18:30 (6:30 PM) in America/New_York
    expect(localHour('America/New_York', eveningInNy)).toBe(18);
  });
});

describe('Streak Calculation and Evaluation', () => {
  const mockNow = new Date('2026-06-15T10:00:00Z');
  const userTz = 'UTC';
  const today = '2026-06-15';
  const yesterday = '2026-06-14';

  it('increments streak if previous lesson was yesterday', () => {
    const res = calculateCompletedLessonStreak(3, 5, yesterday, userTz, mockNow);
    expect(res.currentStreak).toBe(4);
    expect(res.longestStreak).toBe(5);
    expect(res.lastLessonLocalDate).toBe(today);
  });

  it('does not double-increment streak if multiple lessons are completed today', () => {
    const res = calculateCompletedLessonStreak(4, 5, today, userTz, mockNow);
    expect(res.currentStreak).toBe(4);
    expect(res.longestStreak).toBe(5);
    expect(res.lastLessonLocalDate).toBe(today);
  });

  it('resets streak to 1 if a day was skipped, but longest streak never decreases', () => {
    const skippedDate = '2026-06-10'; // 5 days ago
    const res = calculateCompletedLessonStreak(10, 10, skippedDate, userTz, mockNow);
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(10); // longest streak preserved!
    expect(res.lastLessonLocalDate).toBe(today);
  });

  it('evaluates read streak to 0 if older than yesterday without rewriting stored longest', () => {
    const skippedDate = '2026-06-10';
    const read = evaluateReadStreak(10, 15, skippedDate, userTz, mockNow);
    expect(read.currentStreak).toBe(0);
    expect(read.longestStreak).toBe(15);
    expect(read.isActiveToday).toBe(false);
  });

  it('evaluates read streak as active if lesson completed today', () => {
    const read = evaluateReadStreak(5, 5, today, userTz, mockNow);
    expect(read.currentStreak).toBe(5);
    expect(read.isActiveToday).toBe(true);
  });
});
