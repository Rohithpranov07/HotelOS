import type { PrismaClient } from '@prisma/client';
import { calculateTier } from '../lib/loyalty.js';

export interface CreditParams {
  guestId: string;
  propertyId: string;
  reservationId?: string;
  points: number;
  type: 'earn' | 'bonus' | 'referral' | 'adjust';
  reason: string;
  referenceId?: string;
  expiresAt?: Date;
}

export interface RedeemParams {
  guestId: string;
  propertyId: string;
  reservationId: string;
  points: number;
  reason: string;
}

export interface RedeemResult {
  success: boolean;
  newBalance: number;
  rupeesValue: number;
  reason?: 'INSUFFICIENT_BALANCE';
}

export interface ExpireResult {
  guestsAffected: number;
  pointsExpired: number;
  transactions: number;
}

export class LedgerService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Credit points to a guest. Writes an immutable transaction row and
   * updates the denormalised balance on the guest. Tier is recalculated
   * from new lifetime points — never downgraded by an earn.
   *
   * When ``referenceId`` is provided we treat it as an idempotency key:
   * if a transaction with the same (guestId, type, referenceId) already
   * exists, this call is a no-op. This makes booking.checked_out re-
   * deliveries safe.
   */
  async creditPoints(params: CreditParams): Promise<{ credited: boolean; balanceAfter: number }> {
    if (params.points <= 0) {
      const guest = await this.prisma.guest.findUniqueOrThrow({
        where: { id: params.guestId },
        select: { loyaltyPoints: true },
      });
      return { credited: false, balanceAfter: guest.loyaltyPoints };
    }

    return this.prisma.$transaction(async (tx) => {
      if (params.referenceId) {
        const existing = await tx.loyaltyTransaction.findFirst({
          where: {
            guestId: params.guestId,
            type: params.type,
            referenceId: params.referenceId,
          },
          select: { balanceAfter: true },
        });
        if (existing) {
          return { credited: false, balanceAfter: existing.balanceAfter };
        }
      }

      const guest = await tx.guest.findUniqueOrThrow({ where: { id: params.guestId } });
      const newBalance = guest.loyaltyPoints + params.points;
      const newLifetime = guest.lifetimePoints + params.points;
      const newTier = calculateTier(newLifetime);

      await tx.loyaltyTransaction.create({
        data: {
          guestId: params.guestId,
          propertyId: params.propertyId,
          reservationId: params.reservationId,
          type: params.type,
          points: params.points,
          balanceAfter: newBalance,
          reason: params.reason,
          referenceId: params.referenceId,
          expiresAt: params.expiresAt,
        },
      });

      await tx.guest.update({
        where: { id: params.guestId },
        data: {
          loyaltyPoints: newBalance,
          lifetimePoints: newLifetime,
          loyaltyTier: newTier,
        },
      });
      return { credited: true, balanceAfter: newBalance };
    });
  }

  async redeemPoints(params: RedeemParams, minRedemption: number): Promise<RedeemResult> {
    if (params.points < minRedemption) {
      throw new Error(`Minimum redemption is ${minRedemption} points`);
    }

    return this.prisma.$transaction(async (tx) => {
      const guest = await tx.guest.findUniqueOrThrow({ where: { id: params.guestId } });
      if (guest.loyaltyPoints < params.points) {
        return {
          success: false,
          newBalance: guest.loyaltyPoints,
          rupeesValue: 0,
          reason: 'INSUFFICIENT_BALANCE' as const,
        };
      }

      const newBalance = guest.loyaltyPoints - params.points;
      await tx.loyaltyTransaction.create({
        data: {
          guestId: params.guestId,
          propertyId: params.propertyId,
          reservationId: params.reservationId,
          type: 'redeem',
          points: -params.points,
          balanceAfter: newBalance,
          reason: params.reason,
        },
      });
      await tx.guest.update({
        where: { id: params.guestId },
        data: { loyaltyPoints: newBalance },
      });
      // Lifetime points are NOT reduced on redeem — tier is sticky downward.
      return {
        success: true,
        newBalance,
        rupeesValue: params.points / 10,
      };
    });
  }

  /**
   * Expire all loyalty_transactions whose expiresAt <= now and isExpired = false.
   * Walks per-guest, aggregates expired points, writes a single negative
   * "expire" transaction per guest, then flags the originals as isExpired.
   */
  async runExpiry(now: Date = new Date()): Promise<ExpireResult> {
    const due = await this.prisma.loyaltyTransaction.findMany({
      where: {
        isExpired: false,
        expiresAt: { lte: now, not: null },
        points: { gt: 0 },
      },
      select: { id: true, guestId: true, propertyId: true, points: true },
    });

    if (due.length === 0) return { guestsAffected: 0, pointsExpired: 0, transactions: 0 };

    // Aggregate by guest.
    const byGuest = new Map<string, { propertyId: string; points: number; ids: string[] }>();
    for (const t of due) {
      const slot = byGuest.get(t.guestId);
      if (slot) {
        slot.points += t.points;
        slot.ids.push(t.id);
      } else {
        byGuest.set(t.guestId, { propertyId: t.propertyId, points: t.points, ids: [t.id] });
      }
    }

    let pointsExpired = 0;
    let txCount = 0;

    for (const [guestId, slot] of byGuest) {
      // Each guest's expiry happens in its own transaction so a single bad
      // row doesn't roll back the rest of the batch.
      await this.prisma.$transaction(async (tx) => {
        const guest = await tx.guest.findUniqueOrThrow({ where: { id: guestId } });
        const expireAmount = Math.min(slot.points, guest.loyaltyPoints);
        if (expireAmount <= 0) {
          await tx.loyaltyTransaction.updateMany({
            where: { id: { in: slot.ids } },
            data: { isExpired: true },
          });
          return;
        }
        const newBalance = guest.loyaltyPoints - expireAmount;
        await tx.loyaltyTransaction.create({
          data: {
            guestId,
            propertyId: slot.propertyId,
            type: 'expire',
            points: -expireAmount,
            balanceAfter: newBalance,
            reason: `Auto-expiry of ${slot.ids.length} earn batch${slot.ids.length > 1 ? 'es' : ''}`,
          },
        });
        await tx.guest.update({
          where: { id: guestId },
          data: { loyaltyPoints: newBalance },
        });
        await tx.loyaltyTransaction.updateMany({
          where: { id: { in: slot.ids } },
          data: { isExpired: true },
        });
        pointsExpired += expireAmount;
        txCount += 1;
      });
    }

    return { guestsAffected: byGuest.size, pointsExpired, transactions: txCount };
  }
}
