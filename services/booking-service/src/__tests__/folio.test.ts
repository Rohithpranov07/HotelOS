import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { nightsBetween, num } from '../lib/folio.js';

describe('nightsBetween', () => {
  it('returns the number of nights between two dates', () => {
    expect(nightsBetween(new Date('2026-06-01'), new Date('2026-06-04'))).toBe(3);
  });

  it('clamps to a minimum of 1 night for same-day stays', () => {
    expect(nightsBetween(new Date('2026-06-01'), new Date('2026-06-01'))).toBe(1);
  });
});

describe('num', () => {
  it('converts Prisma.Decimal to a JS number', () => {
    expect(num(new Prisma.Decimal('123.45'))).toBe(123.45);
  });

  it('returns 0 for null/undefined', () => {
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
  });

  it('passes through plain numbers', () => {
    expect(num(42)).toBe(42);
  });
});
