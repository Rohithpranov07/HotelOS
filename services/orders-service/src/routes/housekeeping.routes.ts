import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma.js';
import { findAssignee } from '../lib/assignment.js';
import { requireGuest } from '../middleware/auth.middleware.js';
import { emitDndChange, emitNewTask } from '../lib/socket.js';

const errBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message, ...extra },
});

const ScheduleSchema = z.object({
  reservation_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dnd_until: z.string().datetime().optional(),
  special_instructions: z.string().max(500).optional(),
});

const DndSchema = z.object({
  reservation_id: z.string().uuid(),
  enabled: z.boolean(),
  until: z.string().datetime().optional(),
});

export async function housekeepingRoutes(app: FastifyInstance): Promise<void> {
  // ─── POST /schedule ─ guest books a housekeeping slot ───────────
  app.post('/schedule', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const parsed = ScheduleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservation_id },
    });
    if (!reservation) return reply.status(404).send(errBody('RESERVATION_NOT_FOUND', 'Not found'));
    if (reservation.guestId !== user.userId) {
      return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
    }

    const scheduledFor = new Date(`${parsed.data.date}T${parsed.data.time_slot}:00`);
    const assigneeId = await findAssignee(reservation.propertyId, 'housekeeping');

    const order = await prisma.order.create({
      data: {
        reservationId: reservation.id,
        guestId: reservation.guestId,
        propertyId: reservation.propertyId,
        assignedStaffId: assigneeId,
        type: 'housekeeping',
        status: 'pending',
        items: [] as unknown as Prisma.InputJsonValue,
        totalAmount: new Prisma.Decimal(0),
        scheduledFor,
        notes: parsed.data.special_instructions ?? null,
        source: 'app',
      },
    });

    if (parsed.data.dnd_until) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { isDnd: true },
      });
    }

    emitNewTask(app.io, reservation.propertyId, {
      orderId: order.id,
      type: 'housekeeping',
      reservationId: order.reservationId,
      assignedStaffId: assigneeId,
      scheduledFor: order.scheduledFor?.toISOString() ?? null,
    });

    return reply.status(201).send({
      order_id: order.id,
      scheduled_for: order.scheduledFor?.toISOString(),
      assigned_staff_id: assigneeId,
    });
  });

  // ─── PATCH /dnd ─ guest toggles do-not-disturb ──────────────────
  app.patch('/dnd', { preHandler: requireGuest }, async (request, reply) => {
    const user = request.user!;
    const parsed = DndSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
    }
    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservation_id },
    });
    if (!reservation) return reply.status(404).send(errBody('RESERVATION_NOT_FOUND', 'Not found'));
    if (reservation.guestId !== user.userId) {
      return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { isDnd: parsed.data.enabled },
    });

    emitDndChange(app.io, reservation.propertyId, {
      reservationId: updated.id,
      roomId: updated.roomId,
      isDnd: updated.isDnd,
      until: parsed.data.until ?? null,
    });

    return reply.send({ success: true, is_dnd: updated.isDnd, until: parsed.data.until ?? null });
  });
}
