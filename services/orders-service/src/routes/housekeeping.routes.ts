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

// Static service catalog. `imageKey` is resolved to a local bundled asset
// on the mobile side via a fixed map, so the API stays serializable.
const SERVICE_CATALOG = {
  featured: {
    id: 'hk-makeup',
    name: 'Make up the room',
    desc: 'A full tidy, fresh towels and a reset of the bath — sent as a priority.',
    icon: 'sparkles-outline',
    eta_minutes: 30,
    price: 0,
    type: 'housekeeping' as const,
    image_key: 'maidcare',
  },
  now: [
    { id: 'hk-turndown', name: 'Turndown service', desc: 'Evening turndown with the lights set low.', icon: 'moon-outline', eta_minutes: 25, price: 0, type: 'housekeeping' as const },
    { id: 'hk-linen', name: 'Fresh linens', desc: 'A full bed change with crisp, pressed sheets.', icon: 'bed-outline', eta_minutes: 35, price: 0, type: 'housekeeping' as const },
    { id: 'hk-refresh', name: 'Quick refresh', desc: 'A light tidy and a reset of the bath.', icon: 'color-wand-outline', eta_minutes: 20, price: 0, type: 'housekeeping' as const },
  ],
  comforts: [
    { id: 'am-towels', name: 'Extra towels', desc: 'Bath & hand towels.', icon: 'browsers-outline', eta_minutes: 15, price: 0, type: 'amenity' as const, image_key: 'towels' },
    { id: 'am-bedding', name: 'Pillows & blankets', desc: 'Additional bedding.', icon: 'bed-outline', eta_minutes: 15, price: 0, type: 'amenity' as const, image_key: 'bedding' },
    { id: 'am-toiletry', name: 'Toiletry kit', desc: 'A forgotten essential.', icon: 'cut-outline', eta_minutes: 15, price: 0, type: 'amenity' as const, image_key: 'toiletry' },
    { id: 'am-hangers', name: 'Hangers', desc: 'A set of wooden hangers.', icon: 'shirt-outline', eta_minutes: 15, price: 0, type: 'amenity' as const, image_key: 'hangers' },
    { id: 'am-adapter', name: 'Travel adapter', desc: 'USB-C, Lightning, universal.', icon: 'battery-charging-outline', eta_minutes: 15, price: 0, type: 'amenity' as const, image_key: 'adapter' },
    { id: 'am-water', name: 'Still & sparkling', desc: 'Two bottles, chilled.', icon: 'wine-outline', eta_minutes: 15, price: 0, type: 'amenity' as const, image_key: 'bar' },
  ],
  spa_featured: {
    id: 'spa-signature',
    name: 'Signature ritual',
    desc: 'A 90-minute full-body treatment — warm oil, hot stone therapy and a deep-tissue finish. A complete reset.',
    icon: 'flower-outline',
    eta_minutes: 90,
    price: 4800,
    type: 'spa' as const,
    image_key: 'spa',
  },
  spa: [
    { id: 'spa-massage', name: 'Deep tissue massage', desc: 'Full tension release and muscle reset.', icon: 'body-outline', eta_minutes: 60, price: 3200, type: 'spa' as const },
    { id: 'spa-facial', name: 'Luminous facial', desc: 'Brightening, hydration and a glow finish.', icon: 'sparkles-outline', eta_minutes: 50, price: 2800, type: 'spa' as const },
    { id: 'spa-steam', name: 'Steam & soak', desc: 'Private steam room, cedar-scented.', icon: 'cloud-outline', eta_minutes: 30, price: 1200, type: 'spa' as const },
    { id: 'spa-couple', name: "Couple's ritual", desc: 'Side-by-side 90-minute treatment.', icon: 'heart-outline', eta_minutes: 90, price: 8400, type: 'spa' as const },
    { id: 'spa-yoga', name: 'Private yoga session', desc: 'In-suite or on the terrace at your pace.', icon: 'leaf-outline', eta_minutes: 60, price: 1600, type: 'spa' as const },
  ],
  recreation: [
    { id: 'rec-bonfire', name: 'Bonfire in the garden', desc: 'Lit at dusk · blankets & chai', icon: 'flame-outline', eta_minutes: 60, price: 2500, type: 'recreation' as const, image_key: 'bonfire' },
    { id: 'rec-gym', name: 'Fitness centre', desc: 'Open daily · 06:00 — 22:00', icon: 'barbell-outline', eta_minutes: 0, price: 0, type: 'recreation' as const, image_key: 'gym' },
    { id: 'rec-kids', name: "Kids' play area", desc: 'Supervised · ages 3–12', icon: 'happy-outline', eta_minutes: 0, price: 0, type: 'recreation' as const, image_key: 'kidsplay' },
    { id: 'rec-golf', name: 'Mini golf course', desc: 'On the lawn · clubs provided', icon: 'golf-outline', eta_minutes: 20, price: 800, type: 'recreation' as const, image_key: 'golf' },
    { id: 'rec-garden', name: 'Garden lawn', desc: 'Sundowners & quiet hours', icon: 'leaf-outline', eta_minutes: 0, price: 0, type: 'recreation' as const, image_key: 'garden' },
    { id: 'rec-indoor', name: 'Indoor games room', desc: 'Carrom · TT · chess · board games', icon: 'game-controller-outline', eta_minutes: 0, price: 0, type: 'recreation' as const, image_key: 'indoorgames' },
  ],
};

export async function housekeepingRoutes(app: FastifyInstance): Promise<void> {
  // ─── GET /services ─ housekeeping + comforts + spa + recreation catalog ─
  app.get('/services', async () => SERVICE_CATALOG);

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
