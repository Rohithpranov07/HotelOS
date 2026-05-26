import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('ioredis', async () => {
  const mod = await import('ioredis-mock');
  return { Redis: mod.default };
});

import { redis } from '../lib/redis.js';
import { KeyService } from '../services/key.service.js';
import { MockKeyProvider } from '../providers/mock.provider.js';

// Mirrors the worker's switch logic. We intentionally test the dispatch
// behavior (provision on checked_in, revoke on checked_out, skip when no key
// needed) without spinning up a real BullMQ Worker.
async function dispatchJob(
  service: KeyService,
  name: string,
  data: { reservationId: string; mobileKeyNeeded?: boolean },
): Promise<string> {
  switch (name) {
    case 'booking.checked_in':
      if (data.mobileKeyNeeded === false) return 'skipped';
      await service.provisionKeyForReservation(data.reservationId);
      return 'provisioned';
    case 'booking.checked_out':
      await service.revokeKey(data.reservationId);
      return 'revoked';
    default:
      return 'ignored';
  }
}

function makePrisma() {
  const row = {
    id: 'res-1',
    guestId: 'g-1',
    status: 'checked_in' as const,
    checkInDate: new Date('2026-06-01'),
    checkOutDate: new Date('2026-06-03'),
    mobileKeyId: null as string | null,
    room: { id: 'rm-1', roomNumber: '301', lockDeviceId: 'L1' },
    guest: { fullName: 'Test' },
  };
  return {
    row,
    client: {
      reservation: {
        findUnique: async () => row,
        update: async ({ data }: { data: { mobileKeyId: string | null } }) => {
          row.mobileKeyId = data.mobileKeyId;
          return row;
        },
      },
      notificationLog: { create: async () => ({}) },
    },
  };
}

beforeEach(async () => {
  await redis.flushall();
});

describe('booking-events worker dispatch', () => {
  it('booking.checked_in provisions a key', async () => {
    const { client } = makePrisma();
    const provider = new MockKeyProvider(0);
    const service = new KeyService(client as never, provider);
    const result = await dispatchJob(service, 'booking.checked_in', { reservationId: 'res-1' });
    expect(result).toBe('provisioned');
    expect(await redis.exists('key:res-1')).toBe(1);
  });

  it('booking.checked_out revokes the key', async () => {
    const { client, row } = makePrisma();
    const provider = new MockKeyProvider(0);
    const service = new KeyService(client as never, provider);

    await dispatchJob(service, 'booking.checked_in', { reservationId: 'res-1' });
    expect(row.mobileKeyId).not.toBeNull();

    const result = await dispatchJob(service, 'booking.checked_out', { reservationId: 'res-1' });
    expect(result).toBe('revoked');
    expect(await redis.exists('key:res-1')).toBe(0);
    expect(row.mobileKeyId).toBeNull();
  });

  it('booking.checked_in skips provisioning when mobileKeyNeeded is false', async () => {
    const { client } = makePrisma();
    const provider = new MockKeyProvider(0);
    const spy = vi.spyOn(provider, 'provisionKey');
    const service = new KeyService(client as never, provider);
    const result = await dispatchJob(service, 'booking.checked_in', {
      reservationId: 'res-1',
      mobileKeyNeeded: false,
    });
    expect(result).toBe('skipped');
    expect(spy).not.toHaveBeenCalled();
  });
});
