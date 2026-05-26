import { describe, it, expect } from 'vitest';
import { MockKeyProvider } from '../providers/mock.provider.js';

describe('MockKeyProvider', () => {
  it('provisionKey returns a BLE token and matching validity window', async () => {
    const provider = new MockKeyProvider(0);
    const validFrom = new Date('2026-06-01T15:00:00Z');
    const validUntil = new Date('2026-06-03T12:00:00Z');
    const result = await provider.provisionKey({
      reservationId: 'r1',
      roomNumber: '301',
      lockDeviceId: 'LOCK-301',
      validFrom,
      validUntil,
      guestName: 'Ada Lovelace',
    });
    expect(result.keyToken).toMatch(/^MOCK_BLE_[0-9A-F]{32}$/);
    expect(result.providerKeyId).toMatch(/^mock-key-[0-9a-f]{16}$/);
    expect(result.lockType).toBe('mock');
    expect(result.lockDeviceId).toBe('LOCK-301');
    expect(result.validFrom).toBe(validFrom);
    expect(result.validUntil).toBe(validUntil);
  });

  it('falls back to MOCK_LOCK_<room> when lockDeviceId is empty', async () => {
    const provider = new MockKeyProvider(0);
    const result = await provider.provisionKey({
      reservationId: 'r2',
      roomNumber: '101',
      lockDeviceId: '',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 86_400_000),
      guestName: 'Test Guest',
    });
    expect(result.lockDeviceId).toBe('MOCK_LOCK_101');
  });

  it('revokeKey records the revoked provider key id', async () => {
    const provider = new MockKeyProvider(0);
    await provider.revokeKey('mock-key-abcdef0123456789');
    expect(provider.revokedKeys.has('mock-key-abcdef0123456789')).toBe(true);
  });

  it('produces unique tokens across calls', async () => {
    const provider = new MockKeyProvider(0);
    const params = {
      reservationId: 'r1',
      roomNumber: '301',
      lockDeviceId: 'L',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 1000),
      guestName: 'X',
    };
    const a = await provider.provisionKey(params);
    const b = await provider.provisionKey(params);
    expect(a.keyToken).not.toBe(b.keyToken);
    expect(a.providerKeyId).not.toBe(b.providerKeyId);
  });
});
