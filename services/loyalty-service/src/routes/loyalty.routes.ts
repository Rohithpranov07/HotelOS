import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import {
  TIER_BENEFITS,
  pointsToNextTier,
  pointsToValue,
} from '../lib/loyalty.js';
import { LedgerService } from '../services/ledger.service.js';
import { requireGuest } from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message, ...extra },
});

const RedeemSchema = z
  .object({
    reservation_id: z.string().uuid(),
    points: z.number().int().min(1),
    apply_to: z.enum(['folio', 'fnb_order']),
    order_id: z.string().uuid().optional(),
  })
  .refine((v) => v.apply_to !== 'fnb_order' || !!v.order_id, {
    message: 'order_id is required when apply_to is fnb_order',
    path: ['order_id'],
  });

const StatementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export async function loyaltyRoutes(app: FastifyInstance): Promise<void> {
  const ledger = new LedgerService(prisma);

  // ─── GET /summary ───────────────────────────────────────────────
  app.get('/summary', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const guest = await prisma.guest.findUnique({ where: { id: user.userId } });
    if (!guest) return reply.status(404).send(errBody('GUEST_NOT_FOUND', 'Guest not found'));

    const tierInfo = pointsToNextTier(guest.lifetimePoints);

    // Points expiring within 30 days (sum the next batch out).
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    const expiring = await prisma.loyaltyTransaction.aggregate({
      where: {
        guestId: guest.id,
        isExpired: false,
        points: { gt: 0 },
        expiresAt: { lte: horizon, not: null },
      },
      _sum: { points: true },
      _min: { expiresAt: true },
    });

    // "this stay earned" — sum positive earn/bonus on the active reservation.
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        guestId: guest.id,
        status: { in: ['confirmed', 'pre_checked_in', 'checked_in'] },
      },
      orderBy: { checkInDate: 'asc' },
      select: { id: true },
    });
    let thisStayEarned = 0;
    if (activeReservation) {
      const stayAgg = await prisma.loyaltyTransaction.aggregate({
        where: {
          guestId: guest.id,
          reservationId: activeReservation.id,
          type: { in: ['earn', 'bonus'] },
          points: { gt: 0 },
        },
        _sum: { points: true },
      });
      thisStayEarned = stayAgg._sum.points ?? 0;
    }

    return reply.send({
      current_points: guest.loyaltyPoints,
      lifetime_points: guest.lifetimePoints,
      tier: guest.loyaltyTier,
      next_tier: tierInfo.next,
      points_to_next_tier: tierInfo.pointsRemaining,
      tier_progress_pct: tierInfo.progressPct,
      points_expiring_soon:
        expiring._sum.points && expiring._sum.points > 0 && expiring._min.expiresAt
          ? {
              amount: expiring._sum.points,
              expiry_date: expiring._min.expiresAt.toISOString().slice(0, 10),
            }
          : null,
      this_stay_earned: thisStayEarned,
      redemption_value: pointsToValue(guest.loyaltyPoints),
      tier_benefits: TIER_BENEFITS[guest.loyaltyTier],
    });
  });

  // ─── GET /statement ─────────────────────────────────────────────
  app.get('/statement', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const parsed = StatementQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid query', { details: parsed.error.issues }));
    }
    const { page, per_page } = parsed.data;
    const skip = (page - 1) * per_page;

    const [rows, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { guestId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: per_page,
      }),
      prisma.loyaltyTransaction.count({ where: { guestId: user.userId } }),
    ]);

    return reply.send({
      data: rows.map((r) => ({
        id: r.id,
        type: r.type,
        points: r.points,
        balance_after: r.balanceAfter,
        reason: r.reason,
        created_at: r.createdAt.toISOString(),
      })),
      meta: { page, per_page, total },
    });
  });

  // ─── POST /redeem ───────────────────────────────────────────────
  app.post('/redeem', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const parsed = RedeemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid body', { details: parsed.error.issues }));
    }
    if (parsed.data.points < config.minRedemptionPoints) {
      return reply.status(400).send(
        errBody('MIN_REDEMPTION', `Minimum redemption is ${config.minRedemptionPoints} points`, {
          min: config.minRedemptionPoints,
        }),
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservation_id },
    });
    if (!reservation) {
      return reply.status(404).send(errBody('RESERVATION_NOT_FOUND', 'Not found'));
    }
    if (reservation.guestId !== user.userId) {
      return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
    }

    const rupeesValue = parsed.data.points / 10;

    // Pre-flight: when redeeming against an FnB order, validate the order
    // belongs to this reservation, is an F&B type, and has enough open value
    // to cover the redemption. Doing this before debiting points avoids
    // having to refund on failure.
    let fnbOrder: { id: string; totalAmount: unknown } | null = null;
    if (parsed.data.apply_to === 'fnb_order') {
      const order = await prisma.order.findUnique({
        where: { id: parsed.data.order_id! },
        select: { id: true, reservationId: true, type: true, status: true, totalAmount: true },
      });
      if (!order || order.reservationId !== reservation.id) {
        return reply.status(404).send(errBody('ORDER_NOT_FOUND', 'Order not found on reservation'));
      }
      if (order.type !== 'food' && order.type !== 'beverage') {
        return reply.status(400).send(errBody('NOT_FNB_ORDER', 'Order is not an F&B order'));
      }
      if (order.status === 'cancelled') {
        return reply.status(400).send(errBody('ORDER_CANCELLED', 'Order is cancelled'));
      }
      if (Number(order.totalAmount) < rupeesValue) {
        return reply.status(400).send(
          errBody('REDEMPTION_EXCEEDS_ORDER', 'Redemption value exceeds order total', {
            order_total: Number(order.totalAmount),
            redemption_value: rupeesValue,
          }),
        );
      }
      fnbOrder = { id: order.id, totalAmount: order.totalAmount };
    }

    const result = await ledger.redeemPoints(
      {
        guestId: user.userId,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        points: parsed.data.points,
        reason:
          parsed.data.apply_to === 'fnb_order'
            ? `Redemption against FnB order ${fnbOrder!.id}`
            : 'Redemption against folio',
      },
      config.minRedemptionPoints,
    );

    if (!result.success) {
      return reply
        .status(400)
        .send(errBody('INSUFFICIENT_BALANCE', 'Not enough points', { balance: result.newBalance }));
    }

    // Apply the discount. Folio redemption reduces the reservation total
    // directly; FnB redemption also reduces the specific order's total and
    // the reservation's F&B subtotal so the invoice line items reconcile.
    // paidAmount is never touched — a redemption discounts the bill, it
    // doesn't pay it.
    if (parsed.data.apply_to === 'fnb_order' && fnbOrder) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: fnbOrder.id },
          data: { totalAmount: { decrement: result.rupeesValue } },
        }),
        prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            totalFnbAmount: { decrement: result.rupeesValue },
            totalAmount: { decrement: result.rupeesValue },
          },
        }),
      ]);
    } else {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { totalAmount: { decrement: result.rupeesValue } },
      });
    }

    return reply.send({
      success: true,
      points_redeemed: parsed.data.points,
      new_balance: result.newBalance,
      rupees_value: result.rupeesValue,
      applied_to: parsed.data.apply_to,
      order_id: parsed.data.apply_to === 'fnb_order' ? fnbOrder!.id : undefined,
    });
  });
}
