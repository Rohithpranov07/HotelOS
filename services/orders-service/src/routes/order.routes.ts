import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma, type OrderStatus, type OrderType } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { num, isFnbType } from '../lib/folio.js';
import { canTransition } from '../lib/state-machine.js';
import { findAssignee } from '../lib/assignment.js';
import {
  scheduleSlaWarning,
  scheduleSlaBreach,
  emitOrderEvent,
} from '../lib/queue.js';
import { slaMinutesFor, calculateSlaDeadline } from '../lib/sla.js';
import {
  emitNewTask,
  emitOrderUpdate,
} from '../lib/socket.js';
import { config } from '../config.js';
import {
  requireAuth,
  requireGuest,
  requireStaff,
} from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message, ...extra },
});

const ORDER_TYPES = [
  'food',
  'beverage',
  'laundry',
  'housekeeping',
  'amenity',
  'maintenance',
] as const;

const OrderItemSchema = z.object({
  menu_item_id: z.string().uuid().optional(),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  notes: z.string().max(500).optional(),
});

const CreateOrderSchema = z.object({
  reservation_id: z.string().uuid(),
  type: z.enum(ORDER_TYPES),
  items: z.array(OrderItemSchema).min(1),
  scheduled_for: z.string().datetime().nullable().optional(),
  payment_method: z.enum(['folio', 'razorpay', 'loyalty_points']).default('folio'),
  notes: z.string().max(1000).optional(),
});

const StatusUpdateSchema = z.object({
  status: z.enum(['accepted', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().max(1000).optional(),
  completion_photo_url: z.string().url().optional(),
});

const RateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});

type OrderRow = Prisma.OrderGetPayload<{
  include: { assignedStaff: { select: { id: true; fullName: true; role: true } } };
}>;

function reconstructStatusHistory(o: OrderRow): Array<{ status: string; at: string }> {
  const history: Array<{ status: string; at: string }> = [
    { status: 'pending', at: o.createdAt.toISOString() },
  ];
  if (o.acceptedAt) history.push({ status: 'accepted', at: o.acceptedAt.toISOString() });
  if (o.status === 'in_progress' || o.status === 'completed' || o.status === 'cancelled') {
    // We don't persist in_progress timestamps separately; updatedAt is the best signal
    // when the current status is in_progress, otherwise use completedAt/now as a bound.
    if (o.status === 'in_progress') {
      history.push({ status: 'in_progress', at: o.updatedAt.toISOString() });
    } else if (o.completedAt) {
      // Insert in_progress between accepted and completed using updatedAt only if it
      // sits between the two — otherwise it's collapsed and we just record the terminal.
      if (o.acceptedAt && o.updatedAt > o.acceptedAt && o.updatedAt < o.completedAt) {
        history.push({ status: 'in_progress', at: o.updatedAt.toISOString() });
      }
      history.push({ status: o.status, at: o.completedAt.toISOString() });
    } else if (o.status === 'cancelled') {
      history.push({ status: 'cancelled', at: o.updatedAt.toISOString() });
    }
  }
  return history;
}

function toDto(o: OrderRow) {
  return {
    id: o.id,
    reservation_id: o.reservationId,
    guest_id: o.guestId,
    property_id: o.propertyId,
    type: o.type,
    status: o.status,
    items: o.items,
    total_amount: num(o.totalAmount),
    scheduled_for: o.scheduledFor?.toISOString() ?? null,
    sla_deadline: o.slaDeadline?.toISOString() ?? null,
    accepted_at: o.acceptedAt?.toISOString() ?? null,
    completed_at: o.completedAt?.toISOString() ?? null,
    guest_rating: o.guestRating,
    guest_feedback: o.guestFeedback,
    notes: o.notes,
    source: o.source,
    created_at: o.createdAt.toISOString(),
    assigned_staff: o.assignedStaff
      ? { id: o.assignedStaff.id, fullName: o.assignedStaff.fullName, role: o.assignedStaff.role }
      : null,
    status_history: reconstructStatusHistory(o),
  };
}

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // ─── POST / ─ guest places an order ─────────────────────────────
  app.post('/', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const parsed = CreateOrderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }
    const data = parsed.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservation_id },
    });
    if (!reservation) return reply.status(404).send(errBody('RESERVATION_NOT_FOUND', 'Not found'));
    if (reservation.guestId !== user.userId) {
      return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
    }
    if (reservation.status !== 'checked_in') {
      return reply
        .status(409)
        .send(errBody('NOT_CHECKED_IN', 'Orders require a checked-in reservation'));
    }

    const total = data.items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
    const assigneeId = await findAssignee(reservation.propertyId, data.type as OrderType);

    const order = await prisma.order.create({
      data: {
        reservationId: reservation.id,
        guestId: reservation.guestId,
        propertyId: reservation.propertyId,
        assignedStaffId: assigneeId,
        type: data.type as OrderType,
        status: 'pending',
        items: data.items as unknown as Prisma.InputJsonValue,
        totalAmount: new Prisma.Decimal(total),
        scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : null,
        notes: data.notes ?? null,
        source: 'app',
      },
      include: { assignedStaff: { select: { id: true, fullName: true, role: true } } },
    });

    // Realtime: notify property staff room of the new task.
    // TODO(notifications-service): also send FCM push to assigned staff.
    emitNewTask(app.io, reservation.propertyId, {
      orderId: order.id,
      type: order.type,
      reservationId: order.reservationId,
      assignedStaffId: assigneeId,
      createdAt: order.createdAt.toISOString(),
    });

    await emitOrderEvent({
      type: 'order.created',
      orderId: order.id,
      reservationId: order.reservationId,
      propertyId: order.propertyId,
    });

    const slaMinutes = slaMinutesFor(order.type);
    return reply.status(201).send({
      ...toDto(order),
      estimated_delivery_minutes: slaMinutes,
    });
  });

  // ─── GET /active ─ guest's open orders ──────────────────────────
  app.get('/active', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const orders = await prisma.order.findMany({
      where: {
        guestId: user.userId,
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: { assignedStaff: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ orders: orders.map(toDto) });
  });

  // ─── GET /:id ───────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const order = await prisma.order.findUnique({
        where: { id: request.params.id },
        include: { assignedStaff: { select: { id: true, fullName: true, role: true } } },
      });
      if (!order) return reply.status(404).send(errBody('NOT_FOUND', 'Order not found'));
      if (user.userType === 'guest' && order.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your order'));
      }
      if (user.userType === 'staff' && user.propertyId && order.propertyId !== user.propertyId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Cross-property access denied'));
      }
      return reply.send(toDto(order));
    },
  );

  // ─── PATCH /:id/status ─ staff state transitions ────────────────
  app.patch<{ Params: { id: string } }>(
    '/:id/status',
    { preHandler: requireStaff },
    async (request, reply) => {
      const parsed = StatusUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
      }
      const next = parsed.data.status as OrderStatus;

      const order = await prisma.order.findUnique({ where: { id: request.params.id } });
      if (!order) return reply.status(404).send(errBody('NOT_FOUND', 'Order not found'));
      if (!canTransition(order.status, next)) {
        return reply
          .status(409)
          .send(errBody('INVALID_TRANSITION', `Cannot move from ${order.status} to ${next}`));
      }
      if (next === 'completed' && order.type === 'housekeeping' && !parsed.data.completion_photo_url) {
        return reply
          .status(400)
          .send(errBody('PHOTO_REQUIRED', 'Housekeeping completion requires a photo'));
      }

      const now = new Date();
      const updateData: Prisma.OrderUpdateInput = { status: next };
      if (parsed.data.notes) updateData.notes = parsed.data.notes;

      if (next === 'accepted') {
        const deadline = calculateSlaDeadline(order.type, now);
        updateData.acceptedAt = now;
        updateData.slaDeadline = deadline;
      }
      if (next === 'completed') updateData.completedAt = now;

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: updateData,
        include: { assignedStaff: { select: { id: true, fullName: true, role: true } } },
      });

      if (next === 'accepted' && updated.slaDeadline) {
        const slaMs = updated.slaDeadline.getTime() - now.getTime();
        const warnMs = slaMs - config.slaWarningLeadMinutes * 60 * 1000;
        await scheduleSlaWarning(
          { orderId: updated.id, reservationId: updated.reservationId, propertyId: updated.propertyId },
          warnMs,
        );
        await scheduleSlaBreach(
          { orderId: updated.id, reservationId: updated.reservationId, propertyId: updated.propertyId },
          slaMs,
        );
      }

      if (next === 'completed') {
        const amt = num(updated.totalAmount);
        await prisma.reservation.update({
          where: { id: updated.reservationId },
          data: isFnbType(updated.type)
            ? {
                totalFnbAmount: { increment: new Prisma.Decimal(amt) },
                totalAmount: { increment: new Prisma.Decimal(amt) },
              }
            : {
                totalOtherAmount: { increment: new Prisma.Decimal(amt) },
                totalAmount: { increment: new Prisma.Decimal(amt) },
              },
        });
        await emitOrderEvent({
          type: 'order.completed',
          orderId: updated.id,
          reservationId: updated.reservationId,
          guestId: updated.guestId,
          propertyId: updated.propertyId,
          totalAmount: amt,
          orderType: updated.type,
        });
      }

      emitOrderUpdate(app.io, updated.reservationId, {
        orderId: updated.id,
        status: updated.status,
        acceptedAt: updated.acceptedAt?.toISOString() ?? null,
        completedAt: updated.completedAt?.toISOString() ?? null,
        slaDeadline: updated.slaDeadline?.toISOString() ?? null,
      });

      return reply.send(toDto(updated));
    },
  );

  // ─── PATCH /:id/rate ─ guest rates a completed order ────────────
  app.patch<{ Params: { id: string } }>(
    '/:id/rate',
    { preHandler: requireGuest },
    async (request, reply) => {
      const user = request.user!;
      const parsed = RateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
      }
      const order = await prisma.order.findUnique({ where: { id: request.params.id } });
      if (!order) return reply.status(404).send(errBody('NOT_FOUND', 'Order not found'));
      if (order.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your order'));
      }
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          guestRating: parsed.data.rating,
          guestFeedback: parsed.data.feedback ?? null,
        },
        include: { assignedStaff: { select: { id: true, fullName: true, role: true } } },
      });
      return reply.send(toDto(updated));
    },
  );
}
