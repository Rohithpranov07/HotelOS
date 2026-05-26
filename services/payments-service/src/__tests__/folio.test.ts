import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { num, nightsBetween, isFnbType } from '../lib/folio.js';

describe('folio helpers', () => {
  it('num converts Prisma.Decimal', () => {
    expect(num(new Prisma.Decimal('123.45'))).toBe(123.45);
  });
  it('num handles null/undefined', () => {
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
  });
  it('nightsBetween counts day boundaries', () => {
    expect(nightsBetween(new Date('2026-06-01'), new Date('2026-06-04'))).toBe(3);
  });
  it('nightsBetween clamps to at least 1', () => {
    expect(nightsBetween(new Date('2026-06-01'), new Date('2026-06-01'))).toBe(1);
  });
  it('isFnbType groups food and beverage together', () => {
    expect(isFnbType('food')).toBe(true);
    expect(isFnbType('beverage')).toBe(true);
    expect(isFnbType('laundry')).toBe(false);
  });
});
