import { describe, it, expect } from 'vitest';
import { SLA_MINUTES, slaMinutesFor, calculateSlaDeadline, getSlaStatus } from '../lib/sla.js';

describe('SLA configuration', () => {
  it('exposes per-order-type SLA minutes', () => {
    expect(SLA_MINUTES.food).toBe(30);
    expect(SLA_MINUTES.beverage).toBe(25);
    expect(SLA_MINUTES.housekeeping).toBe(30);
  });

  it('slaMinutesFor falls back to 30 for unknown types', () => {
    expect(slaMinutesFor('unknown')).toBe(30);
  });
});

describe('calculateSlaDeadline', () => {
  it('adds the type-specific minutes to acceptedAt', () => {
    const acceptedAt = new Date('2026-06-01T10:00:00Z');
    const deadline = calculateSlaDeadline('food', acceptedAt);
    expect(deadline.toISOString()).toBe('2026-06-01T10:30:00.000Z');
  });
});

describe('getSlaStatus', () => {
  it('returns "ok" when far from the deadline', () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000);
    expect(getSlaStatus(deadline)).toBe('ok');
  });
  it('returns "warning" within the warning window', () => {
    const deadline = new Date(Date.now() + 5 * 60 * 1000);
    expect(getSlaStatus(deadline)).toBe('warning');
  });
  it('returns "breached" past the deadline', () => {
    const deadline = new Date(Date.now() - 60 * 1000);
    expect(getSlaStatus(deadline)).toBe('breached');
  });
  it('returns "ok" when deadline is null', () => {
    expect(getSlaStatus(null)).toBe('ok');
  });
});
