/**
 * Dedicated date and time helper for LinguaQuest.
 * Hard rule 6: "Today" is the user's local date from their stored IANA time zone.
 * Writes and reads use the same helper function, localDate(userTz, instant).
 * Never mix UTC and local dates.
 */

export function localDate(tz: string = 'UTC', instant: Date | number = new Date()): string {
  const date = typeof instant === 'number' ? new Date(instant) : instant;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Returns YYYY-MM-DD
  } catch {
    // Fallback if tz is invalid
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }
}

export function localHour(tz: string = 'UTC', instant: Date | number = new Date()): number {
  const date = typeof instant === 'number' ? new Date(instant) : instant;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

/**
 * Returns previous day's local date in YYYY-MM-DD format
 */
export function getYesterdayLocalDate(tz: string = 'UTC', instant: Date | number = new Date()): string {
  const date = typeof instant === 'number' ? new Date(instant) : new Date(instant.getTime());
  date.setDate(date.getDate() - 1);
  return localDate(tz, date);
}

/**
 * Returns the last 7 local dates ending with today in ascending order
 */
export function getLast7LocalDates(tz: string = 'UTC', instant: Date | number = new Date()): string[] {
  const dates: string[] = [];
  const base = typeof instant === 'number' ? new Date(instant) : new Date(instant.getTime());
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() - i);
    dates.push(localDate(tz, d));
  }
  return dates;
}

export function getWeekdayLabel(localDateStr: string): string {
  const [year, month, day] = localDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date);
}
