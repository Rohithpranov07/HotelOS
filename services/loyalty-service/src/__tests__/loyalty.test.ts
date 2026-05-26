import { describe, it, expect } from 'vitest';
import {
  calculateTier,
  calculatePointsToEarn,
  nextTierOf,
  pointsToNextTier,
  pointsToValue,
  valueToPoints,
} from '../lib/loyalty.js';

describe('calculateTier', () => {
  it('returns bronze below the silver threshold', () => {
    expect(calculateTier(0)).toBe('bronze');
    expect(calculateTier(999)).toBe('bronze');
  });
  it('returns silver at 1000', () => {
    expect(calculateTier(1000)).toBe('silver');
  });
  it('returns gold at 5000', () => {
    expect(calculateTier(5000)).toBe('gold');
  });
  it('returns platinum at 15000+', () => {
    expect(calculateTier(15000)).toBe('platinum');
    expect(calculateTier(1_000_000)).toBe('platinum');
  });
});

describe('calculatePointsToEarn', () => {
  // Acceptance: ₹10,000 bill, earnRate=1, bronze, room → at least 100 points.
  it('credits 100 points for ₹10,000 room spend at bronze', () => {
    const pts = calculatePointsToEarn({
      spendAmount: 10_000,
      earnRate: 1,
      tier: 'bronze',
      category: 'room',
    });
    expect(pts).toBe(100);
  });

  it('credits 200 points for ₹10,000 F&B spend at bronze (2× F&B)', () => {
    const pts = calculatePointsToEarn({
      spendAmount: 10_000,
      earnRate: 1,
      tier: 'bronze',
      category: 'fnb',
    });
    expect(pts).toBe(200);
  });

  // Acceptance: gold earns 1.5× vs bronze on the same spend.
  it('gold tier earns 1.5× of bronze on identical room spend', () => {
    const bronze = calculatePointsToEarn({
      spendAmount: 10_000,
      earnRate: 1,
      tier: 'bronze',
      category: 'room',
    });
    const gold = calculatePointsToEarn({
      spendAmount: 10_000,
      earnRate: 1,
      tier: 'gold',
      category: 'room',
    });
    expect(gold).toBe(Math.floor(bronze * 1.5));
  });

  it('platinum earns 2×', () => {
    const platinum = calculatePointsToEarn({
      spendAmount: 10_000,
      earnRate: 1,
      tier: 'platinum',
      category: 'room',
    });
    expect(platinum).toBe(200);
  });

  it('respects the property earn rate', () => {
    const pts = calculatePointsToEarn({
      spendAmount: 10_000,
      earnRate: 2,
      tier: 'bronze',
      category: 'room',
    });
    expect(pts).toBe(200);
  });

  it('returns 0 for non-positive spend', () => {
    expect(
      calculatePointsToEarn({ spendAmount: 0, earnRate: 1, tier: 'bronze', category: 'room' }),
    ).toBe(0);
    expect(
      calculatePointsToEarn({ spendAmount: -100, earnRate: 1, tier: 'bronze', category: 'room' }),
    ).toBe(0);
  });
});

describe('nextTierOf', () => {
  it('walks the tier ladder', () => {
    expect(nextTierOf('bronze')).toBe('silver');
    expect(nextTierOf('silver')).toBe('gold');
    expect(nextTierOf('gold')).toBe('platinum');
    expect(nextTierOf('platinum')).toBeNull();
  });
});

describe('pointsToNextTier', () => {
  it('reports remaining + progress for a bronze member', () => {
    const r = pointsToNextTier(500);
    expect(r.next).toBe('silver');
    expect(r.pointsRemaining).toBe(500);
    expect(r.progressPct).toBe(50);
  });
  it('reports 100% progress at platinum', () => {
    const r = pointsToNextTier(20_000);
    expect(r.next).toBeNull();
    expect(r.progressPct).toBe(100);
  });
  it('progress is bounded between 0 and 100', () => {
    const r = pointsToNextTier(1_500);
    expect(r.next).toBe('gold');
    expect(r.progressPct).toBeGreaterThanOrEqual(0);
    expect(r.progressPct).toBeLessThanOrEqual(100);
  });
});

describe('pointsToValue / valueToPoints', () => {
  it('uses the 10pts = ₹1 rate', () => {
    expect(pointsToValue(1000)).toBe(100);
    expect(valueToPoints(50)).toBe(500);
  });
});
