import type { PrismaClient } from '@prisma/client';
import { config } from '../config.js';
import {
  cacheKey,
  deleteCachedKey,
  getCachedKey,
  type CachedKey,
} from '../lib/redis.js';
import type { IKeyProvider } from '../providers/key-provider.interface.js';

export type KeyView =
  | (CachedKey & { kind: 'active' })
  | { kind: 'pending_activation'; activatesAt: string }
  | { kind: 'revoked' }
  | { kind: 'not_applicable' };

function computeValidUntil(checkOutDate: Date, expiryHour: number): Date {
  const d = new Date(checkOutDate);
  d.setHours(expiryHour, 0, 0, 0);
  return d;
}

export class KeyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provider: IKeyProvider,
  ) {}

  /**
   * Provision (or re-provision) a key for a reservation. Idempotent — if a key
   * already exists in Redis we short-circuit instead of double-charging the API.
   */
  async provisionKeyForReservation(reservationId: string): Promise<CachedKey> {
    const existing = await getCachedKey(reservationId);
    if (existing) return existing;

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true, guest: true },
    });
    if (!reservation) throw new Error(`Reservation ${reservationId} not found`);
    if (!reservation.room) throw new Error(`Reservation ${reservationId} has no room assigned`);

    const validFrom = new Date(reservation.checkInDate);
    const validUntil = computeValidUntil(reservation.checkOutDate, config.keyExpiryHour);

    const result = await this.provider.provisionKey({
      reservationId,
      roomNumber: reservation.room.roomNumber,
      lockDeviceId: reservation.room.lockDeviceId ?? reservation.room.roomNumber,
      validFrom,
      validUntil,
      guestName: reservation.guest.fullName,
    });

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { mobileKeyId: result.providerKeyId },
    });

    const cached: CachedKey = {
      status: 'active',
      keyToken: result.keyToken,
      roomNumber: reservation.room.roomNumber,
      lockDeviceId: result.lockDeviceId,
      lockType: result.lockType,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      providerKeyId: result.providerKeyId,
    };

    const ttlSeconds = Math.max(60, Math.floor((validUntil.getTime() - Date.now()) / 1000));
    await cacheKey(reservationId, cached, ttlSeconds);
    await this.logKeyEvent(reservationId, 'provisioned', result.providerKeyId);
    return cached;
  }

  async revokeKey(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) return;
    if (!reservation.mobileKeyId) {
      // Still clear any cache and audit the request.
      await deleteCachedKey(reservationId);
      return;
    }

    await this.provider.revokeKey(reservation.mobileKeyId);
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { mobileKeyId: null },
    });
    await deleteCachedKey(reservationId);
    await this.logKeyEvent(reservationId, 'revoked', reservation.mobileKeyId);
  }

  /**
   * Resolve a key for a guest's reservation. Implements the recovery flow:
   * if no cached key exists but the reservation is checked_in, provision one.
   */
  async getKeyView(reservationId: string): Promise<KeyView> {
    const cached = await getCachedKey(reservationId);
    if (cached) return { ...cached, kind: 'active' };

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) return { kind: 'not_applicable' };

    if (
      reservation.status === 'checked_out' ||
      reservation.status === 'cancelled' ||
      reservation.status === 'no_show'
    ) {
      return { kind: 'revoked' };
    }

    if (reservation.status === 'checked_in') {
      // Recovery: cache miss but reservation is active. Re-provision.
      try {
        const fresh = await this.provisionKeyForReservation(reservationId);
        return { ...fresh, kind: 'active' };
      } catch {
        return { kind: 'not_applicable' };
      }
    }

    return {
      kind: 'pending_activation',
      activatesAt: new Date(reservation.checkInDate).toISOString(),
    };
  }

  private async logKeyEvent(
    reservationId: string,
    action: 'provisioned' | 'revoked',
    providerKeyId: string,
  ): Promise<void> {
    await this.prisma.notificationLog.create({
      data: {
        recipientId: reservationId,
        type: 'key_event',
        channel: 'ble',
        payload: { action, providerKeyId, timestamp: new Date().toISOString() },
        status: 'sent',
      },
    });
  }
}
