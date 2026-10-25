import { describe, it, expect } from 'vitest';
import { computeHearts, MAX_HEARTS, HEART_REFILL_MS } from '../src/server/hearts';

describe('Hearts Math and Regeneration', () => {
  it('caps hearts at 5 when full', () => {
    const now = new Date();
    const result = computeHearts(5, now, now);
    expect(result.hearts).toBe(5);
    expect(result.nextHeartInSeconds).toBeNull();
  });

  it('caps at 5 even after days of elapsed time', () => {
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = computeHearts(1, past, new Date());
    expect(result.hearts).toBe(5);
    expect(result.nextHeartInSeconds).toBeNull();
  });

  it('correctly regenerates 1 heart every 30 minutes', () => {
    const past = new Date('2026-01-01T12:00:00Z');
    // 35 minutes later -> +1 heart, 25 minutes left until next
    const now = new Date('2026-01-01T12:35:00Z');
    const result = computeHearts(2, past, now);

    expect(result.hearts).toBe(3);
    // 25 minutes in seconds = 1500
    expect(result.nextHeartInSeconds).toBe(25 * 60);
  });

  it('correctly calculates remainder seconds when below max', () => {
    const past = new Date('2026-01-01T12:00:00Z');
    // 10 minutes later (600s elapsed) -> 20 minutes (1200s) left
    const now = new Date('2026-01-01T12:10:00Z');
    const result = computeHearts(4, past, now);

    expect(result.hearts).toBe(4);
    expect(result.nextHeartInSeconds).toBe(20 * 60);
  });
});
