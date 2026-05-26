import { describe, it, expect, beforeEach, vi } from 'vitest';

// Replace ioredis with the in-memory mock so we can assert Redis state.
vi.mock('ioredis', async () => {
  const mod = await import('ioredis-mock');
  return { Redis: mod.default };
});

import { redis, KEY_PREFIX } from '../lib/redis.js';
import { KeyService } from '../services/key.service.js';
import { MockKeyProvider } from '../providers/mock.provider.js';

type ReservationRow = {
  id: string;
  guestId: string;
  status: 'confirmed' | 'pre_checked_in' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  checkInDate: Date;
  checkOutDate: Date;
  mobileKeyId: string | null;
  room: { id: string; roomNumber: string; lockDeviceId: string | null } | null;
  guest: { fullName: string };
};

function makePrisma(reservations: Map<string, ReservationRow>) {
  const notifLog: unknown[] = [];
  return {
    reservation: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        reservations.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Partial<ReservationRow> }) => {
        const r = reservations.get(where.id);
        if (!r) throw new Error('not found');
        Object.assign(r, data);
        return r;
      },
    },
    notificationLog: {
      create: async ({ data }: { data: unknown }) => {
        notifLog.push(data);
        return data;
      },
    },
    _notifLog: notifLog,
  };
}

const baseReservation = (): ReservationRow => ({
  id: '11111111-1111-1111-1111-111111111111',
  guestId: '22222222-2222-2222-2222-222222222222',
  status: 'checked_in',
  checkInDate: new Date('2026-06-01T00:00:00Z'),
  checkOutDate: new Date('2026-06-03T00:00:00Z'),
  mobileKeyId: null,
  room: { id: 'room-1', roomNumber: '301', lockDeviceId: 'LOCK-301' },
  guest: { fullName: 'Ada Lovelace' },
});

beforeEach(async () => {
  await redis.flushall();
});

describe('KeyService.provisionKeyForReservation', () => {
  it('caches the key in Redis under key:<reservationId>', async () => {
    const reservations = new Map<string, ReservationRow>([['r-1', { ...baseReservation(), id: 'r-1' }]]);
    const prisma = makePrisma(reservations);
    const service = new KeyService(prisma as never, new MockKeyProvider(0));

    const cached = await service.provisionKeyForReservation('r-1');
    expect(cached.status).toBe('active');
    expect(cached.keyToken).toMatch(/^MOCK_BLE_/);

    const raw = await redis.get(KEY_PREFIX + 'r-1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.keyToken).toBe(cached.keyToken);
    expect(parsed.providerKeyId).toBe(cached.providerKeyId);
  });

  it('writes the providerKeyId back to reservation.mobileKeyId', async () => {
    const row = { ...baseReservation(), id: 'r-2' };
    const reservations = new Map<string, ReservationRow>([['r-2', row]]);
    const service = new KeyService(makePrisma(reservations) as never, new MockKeyProvider(0));
    const cached = await service.provisionKeyForReservation('r-2');
    expect(row.mobileKeyId).toBe(cached.providerKeyId);
  });

  it('is idempotent — second call returns the cached entry without calling the provider', async () => {
    const reservations = new Map<string, ReservationRow>([['r-3', { ...baseReservation(), id: 'r-3' }]]);
    const provider = new MockKeyProvider(0);
    const spy = vi.spyOn(provider, 'provisionKey');
    const service = new KeyService(makePrisma(reservations) as never, provider);

    const first = await service.provisionKeyForReservation('r-3');
    const second = await service.provisionKeyForReservation('r-3');
    expect(second.keyToken).toBe(first.keyToken);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('KeyService.revokeKey', () => {
  it('deletes the cached key and clears mobileKeyId', async () => {
    const row = { ...baseReservation(), id: 'r-4' };
    const reservations = new Map<string, ReservationRow>([['r-4', row]]);
    const provider = new MockKeyProvider(0);
    const service = new KeyService(makePrisma(reservations) as never, provider);

    await service.provisionKeyForReservation('r-4');
    expect(await redis.exists(KEY_PREFIX + 'r-4')).toBe(1);

    await service.revokeKey('r-4');
    expect(await redis.exists(KEY_PREFIX + 'r-4')).toBe(0);
    expect(row.mobileKeyId).toBeNull();
    expect(provider.revokedKeys.size).toBe(1);
  });

  it('is a no-op when reservation has no mobileKeyId', async () => {
    const row = { ...baseReservation(), id: 'r-5', mobileKeyId: null };
    const reservations = new Map<string, ReservationRow>([['r-5', row]]);
    const provider = new MockKeyProvider(0);
    const service = new KeyService(makePrisma(reservations) as never, provider);
    await service.revokeKey('r-5');
    expect(provider.revokedKeys.size).toBe(0);
  });
});

describe('KeyService.getKeyView', () => {
  it('returns active when a cached key exists', async () => {
    const reservations = new Map<string, ReservationRow>([['r-6', { ...baseReservation(), id: 'r-6' }]]);
    const service = new KeyService(makePrisma(reservations) as never, new MockKeyProvider(0));
    await service.provisionKeyForReservation('r-6');
    const view = await service.getKeyView('r-6');
    expect(view.kind).toBe('active');
  });

  it('returns pending_activation before check-in', async () => {
    const row = { ...baseReservation(), id: 'r-7', status: 'confirmed' as const };
    const service = new KeyService(
      makePrisma(new Map<string, ReservationRow>([['r-7', row]])) as never,
      new MockKeyProvider(0),
    );
    const view = await service.getKeyView('r-7');
    expect(view.kind).toBe('pending_activation');
  });

  it('returns revoked after check-out', async () => {
    const row = { ...baseReservation(), id: 'r-8', status: 'checked_out' as const };
    const service = new KeyService(
      makePrisma(new Map<string, ReservationRow>([['r-8', row]])) as never,
      new MockKeyProvider(0),
    );
    const view = await service.getKeyView('r-8');
    expect(view.kind).toBe('revoked');
  });

  it('recovery flow: re-provisions when reservation is checked_in but cache is cold', async () => {
    const row = { ...baseReservation(), id: 'r-9' };
    const provider = new MockKeyProvider(0);
    const spy = vi.spyOn(provider, 'provisionKey');
    const service = new KeyService(
      makePrisma(new Map<string, ReservationRow>([['r-9', row]])) as never,
      provider,
    );
    // No cache, but checked_in → must provision.
    const view = await service.getKeyView('r-9');
    expect(view.kind).toBe('active');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
