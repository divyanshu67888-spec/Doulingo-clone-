import { describe, it, expect } from 'vitest';
import { computeLevel } from '../src/server/levels';
import { computeLeague } from '../src/server/leagues';

describe('Levels Math', () => {
  it('0 XP is Level 1 with 0 progress', () => {
    const res = computeLevel(0);
    expect(res.level).toBe(1);
    expect(res.progress).toBe(0);
    expect(res.xpInLevel).toBe(0);
    expect(res.xpForNextLevel).toBe(100);
    expect(res.isMaxLevel).toBe(false);
  });

  it('99 XP is Level 1 with 0.99 progress', () => {
    const res = computeLevel(99);
    expect(res.level).toBe(1);
    expect(res.progress).toBe(0.99);
    expect(res.xpForNextLevel).toBe(1);
  });

  it('100 XP is Level 2', () => {
    const res = computeLevel(100);
    expect(res.level).toBe(2);
    expect(res.progress).toBe(0);
  });

  it('1900+ XP caps at Level 20 (Max Level)', () => {
    const res1 = computeLevel(1900);
    expect(res1.level).toBe(20);
    expect(res1.isMaxLevel).toBe(true);

    const res2 = computeLevel(5000);
    expect(res2.level).toBe(20);
    expect(res2.isMaxLevel).toBe(true);
    expect(res2.xpForNextLevel).toBe(0);
  });
});

describe('Leagues Math and Thresholds', () => {
  it('0 XP starts in Bronze with 500 XP to Silver', () => {
    const res = computeLeague(0);
    expect(res.tier).toBe('Bronze');
    expect(res.nextTier).toBe('Silver');
    expect(res.xpToNext).toBe(500);
    expect(res.note).toBe('500 XP to reach Silver');
    expect(res.isTopLeague).toBe(false);
  });

  it('500 XP crosses into Silver', () => {
    const res = computeLeague(500);
    expect(res.tier).toBe('Silver');
    expect(res.nextTier).toBe('Gold');
    expect(res.xpToNext).toBe(1000);
  });

  it('1500 XP is Gold', () => {
    const res = computeLeague(1500);
    expect(res.tier).toBe('Gold');
    expect(res.nextTier).toBe('Sapphire');
    expect(res.xpToNext).toBe(2000);
  });

  it('3500 XP is Sapphire', () => {
    const res = computeLeague(3500);
    expect(res.tier).toBe('Sapphire');
    expect(res.nextTier).toBe('Ruby');
    expect(res.xpToNext).toBe(3500);
  });

  it('7000+ XP is Ruby (top league)', () => {
    const res = computeLeague(7000);
    expect(res.tier).toBe('Ruby');
    expect(res.nextTier).toBeNull();
    expect(res.isTopLeague).toBe(true);
    expect(res.note).toBe("You're in the top league.");
  });
});
