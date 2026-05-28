import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma, type ReservationStatus } from '@prisma/client';
import {
  PreCheckinRequestSchema,
  CheckoutRequestSchema,
} from '@hotel-os/types';

import { prisma } from '../lib/prisma.js';
import { emitBookingEvent } from '../lib/queue.js';
import { num, nightsBetween, type FolioLineItem } from '../lib/folio.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const errBody = (code: string, message: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message, ...extra },
});

const ACTIVE_STATUSES: ReservationStatus[] = ['confirmed', 'pre_checked_in', 'checked_in'];

type MobileKeyStatus = 'not_applicable' | 'pending_activation' | 'active' | 'revoked';

function deriveMobileKeyStatus(
  status: ReservationStatus,
  mobileKeyId: string | null | undefined,
): MobileKeyStatus {
  if (status === 'checked_out' || status === 'cancelled' || status === 'no_show') {
    return 'revoked';
  }
  if (status === 'checked_in') return mobileKeyId ? 'active' : 'pending_activation';
  if (status === 'pre_checked_in') return 'pending_activation';
  return 'not_applicable';
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toReservationDto(r: Prisma.ReservationGetPayload<{ include: { room: true } }>) {
  const totalAmount = num(r.totalAmount);
  const paidAmount = num(r.paidAmount);
  return {
    id: r.id,
    pmsBookingRef: r.pmsBookingRef,
    status: r.status,
    room: r.room
      ? {
          id: r.room.id,
          roomNumber: r.room.roomNumber,
          roomType: r.room.roomType,
          floor: r.room.floor,
          amenities: r.room.amenities,
        }
      : null,
    checkInDate: r.checkInDate.toISOString().slice(0, 10),
    checkOutDate: r.checkOutDate.toISOString().slice(0, 10),
    adults: r.adults,
    children: r.children,
    ratePlan: r.ratePlan,
    roomRate: num(r.roomRate),
    totalRoomAmount: num(r.totalRoomAmount),
    totalFnbAmount: num(r.totalFnbAmount),
    totalOtherAmount: num(r.totalOtherAmount),
    totalAmount,
    paidAmount,
    balanceDue: Math.max(0, totalAmount - paidAmount),
    mobileKeyStatus: deriveMobileKeyStatus(r.status, r.mobileKeyId),
    isDnd: r.isDnd,
    specialRequests: r.specialRequests,
  };
}

const CreateReservationSchema = z.object({
  guestId: z.string().uuid(),
  propertyId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  roomRate: z.number().nonnegative().optional(),
  ratePlan: z.string().optional(),
  specialRequests: z.string().optional(),
  source: z.string().default('direct'),
});

export async function reservationRoutes(app: FastifyInstance): Promise<void> {
  // ─── GET /active (guest) ───────────────────────────────────────
  app.get('/active', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user!;
    if (user.userType !== 'guest') {
      return reply.status(403).send(errBody('FORBIDDEN', 'Guest token required'));
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        guestId: user.userId,
        status: { in: ACTIVE_STATUSES },
        checkOutDate: { gte: new Date(todayISODate()) },
      },
      include: { room: true },
      orderBy: { checkInDate: 'asc' },
    });

    if (!reservation) return reply.send(null);
    return reply.send(toReservationDto(reservation));
  });

  // ─── GET /:id ──────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
        include: { room: true },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (user.userType === 'guest' && reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }
      return reply.send(toReservationDto(reservation));
    },
  );

  // ─── POST /:id/pre-checkin ─────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/:id/pre-checkin',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      if (user.userType !== 'guest') {
        return reply.status(403).send(errBody('FORBIDDEN', 'Guest token required'));
      }
      const parsed = PreCheckinRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
        include: { room: true },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }
      if (reservation.status !== 'confirmed' && reservation.status !== 'pre_checked_in') {
        return reply
          .status(409)
          .send(errBody('INVALID_STATE', `Cannot pre-checkin from status ${reservation.status}`));
      }

      const updated = await prisma.$transaction(async (tx) => {
        const r = await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'pre_checked_in',
            specialRequests: parsed.data.preferences.special_notes ?? reservation.specialRequests,
          },
          include: { room: true },
        });
        // Merge new preferences into the guest record so they persist across stays.
        const guest = await tx.guest.findUnique({
          where: { id: reservation.guestId },
          select: { preferences: true },
        });
        const existing =
          guest && typeof guest.preferences === 'object' && guest.preferences !== null
            ? (guest.preferences as Record<string, unknown>)
            : {};
        const merged: Record<string, unknown> = { ...existing };
        const p = parsed.data.preferences;
        if (p.room_temp_celsius !== undefined) merged.room_temp_celsius = p.room_temp_celsius;
        if (p.pillow_type !== undefined) merged.pillow_type = p.pillow_type;
        if (p.floor_preference !== undefined) merged.floor_preference = p.floor_preference;
        if (p.special_notes !== undefined) merged.special_notes = p.special_notes;
        merged.early_checkin_request = p.early_checkin_request;
        await tx.guest.update({
          where: { id: reservation.guestId },
          data: { preferences: merged as Prisma.InputJsonValue },
        });
        return r;
      });

      await emitBookingEvent({
        type: 'booking.pre_checked_in',
        reservationId: updated.id,
        guestId: updated.guestId,
        propertyId: updated.propertyId,
      });

      return reply.send({
        success: true,
        checkin_confirmed: true,
        mobile_key_status: 'pending_activation' as const,
        room_assigned: updated.room
          ? { id: updated.room.id, roomNumber: updated.room.roomNumber }
          : null,
      });
    },
  );

  // ─── POST /:id/checkin (staff) ─────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/:id/checkin',
    { preHandler: requireRole('front_desk', 'manager', 'admin') },
    async (request, reply) => {
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (reservation.status === 'checked_in') {
        return reply.status(409).send(errBody('ALREADY_CHECKED_IN', 'Already checked in'));
      }
      if (reservation.status === 'checked_out' || reservation.status === 'cancelled') {
        return reply
          .status(409)
          .send(errBody('INVALID_STATE', `Cannot check in from status ${reservation.status}`));
      }

      const updated = await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'checked_in', actualCheckIn: new Date() },
      });

      await emitBookingEvent({
        type: 'booking.checked_in',
        reservationId: updated.id,
        guestId: updated.guestId,
        propertyId: updated.propertyId,
        roomId: updated.roomId,
        mobileKeyNeeded: Boolean(updated.roomId),
      });

      return reply.send({ success: true, checked_in_at: updated.actualCheckIn?.toISOString() });
    },
  );

  // ─── POST /:id/checkout ────────────────────────────────────────
  app.post<{ Params: { id: string } }>(
    '/:id/checkout',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const parsed = CheckoutRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
      }
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
        include: { property: true },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (user.userType === 'guest' && reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }
      if (reservation.status === 'checked_out') {
        return reply.status(409).send(errBody('ALREADY_CHECKED_OUT', 'Already checked out'));
      }
      if (reservation.status === 'cancelled') {
        return reply.status(409).send(errBody('INVALID_STATE', 'Reservation is cancelled'));
      }

      const totalAmount = num(reservation.totalAmount);
      const paidAmount = num(reservation.paidAmount);
      const balanceDue = Math.max(0, totalAmount - paidAmount);

      // TODO(T-09 payments-service): verify the payment with the provider before
      // marking paidAmount. Currently we only require the id to be present for
      // razorpay and trust it settled.
      if (parsed.data.payment_method === 'razorpay' && balanceDue > 0 && !parsed.data.razorpay_payment_id) {
        return reply
          .status(400)
          .send(errBody('PAYMENT_REQUIRED', 'razorpay_payment_id is required for razorpay checkout'));
      }

      const updated = await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'checked_out',
          actualCheckOut: new Date(),
          paidAmount: new Prisma.Decimal(totalAmount + parsed.data.tip_amount),
        },
      });

      const earnRate = num(reservation.property.loyaltyEarnRate);
      const pointsEarned = Math.floor((totalAmount / 100) * earnRate);

      await emitBookingEvent({
        type: 'booking.checked_out',
        reservationId: updated.id,
        guestId: updated.guestId,
        propertyId: updated.propertyId,
        totalAmount,
      });

      return reply.send({
        success: true,
        checked_out_at: updated.actualCheckOut?.toISOString(),
        total_amount: totalAmount,
        tip_amount: parsed.data.tip_amount,
        loyalty_points_earned: pointsEarned,
        invoice_url: null,
      });
    },
  );

  // ─── PATCH /:id/dnd (guest) ────────────────────────────────────
  app.patch<{ Params: { id: string }; Body: unknown }>(
    '/:id/dnd',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const parsed = z.object({ enabled: z.boolean() }).safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
      }
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (user.userType === 'guest' && reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }
      const updated = await prisma.reservation.update({
        where: { id: reservation.id },
        data: { isDnd: parsed.data.enabled },
        include: { room: true },
      });
      return reply.send(toReservationDto(updated));
    },
  );

  // ─── GET /:id/folio ────────────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    '/:id/folio',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user!;
      const reservation = await prisma.reservation.findUnique({
        where: { id: request.params.id },
        include: { guest: true, room: true, orders: true },
      });
      if (!reservation) return reply.status(404).send(errBody('NOT_FOUND', 'Reservation not found'));
      if (user.userType === 'guest' && reservation.guestId !== user.userId) {
        return reply.status(403).send(errBody('FORBIDDEN', 'Not your reservation'));
      }

      const nights = nightsBetween(reservation.checkInDate, reservation.checkOutDate);
      const roomRate = num(reservation.roomRate);
      const roomSubtotal = roomRate * nights;

      const lineItems: FolioLineItem[] = [
        {
          id: `room-${reservation.id}`,
          description: `Room charge — ${nights} night${nights > 1 ? 's' : ''}`,
          type: 'room',
          amount: roomSubtotal,
          date: reservation.checkInDate.toISOString().slice(0, 10),
        },
      ];

      let fnb = 0;
      let other = 0;
      for (const o of reservation.orders) {
        if (o.status !== 'completed') continue;
        const amt = num(o.totalAmount);
        const isFnb = o.type === 'food' || o.type === 'beverage';
        const isLaundry = o.type === 'laundry';
        const isAmenity = o.type === 'amenity';
        const folioType: FolioLineItem['type'] = isFnb
          ? 'food'
          : isLaundry
            ? 'laundry'
            : isAmenity
              ? 'amenity'
              : 'other';
        if (isFnb) fnb += amt;
        else other += amt;
        lineItems.push({
          id: o.id,
          description: `${o.type} order`,
          type: folioType,
          amount: amt,
          date: o.createdAt.toISOString().slice(0, 10),
          order_id: o.id,
        });
      }

      const total = roomSubtotal + fnb + other;
      const paid = num(reservation.paidAmount);

      return reply.send({
        reservation_id: reservation.id,
        guest_name: reservation.guest.fullName,
        room_number: reservation.room?.roomNumber ?? null,
        check_in: reservation.checkInDate.toISOString().slice(0, 10),
        check_out: reservation.checkOutDate.toISOString().slice(0, 10),
        line_items: lineItems,
        subtotals: { room: roomSubtotal, fnb, other },
        total_amount: total,
        paid_amount: paid,
        balance_due: Math.max(0, total - paid),
      });
    },
  );

  // ─── POST / (staff create) ─────────────────────────────────────
  app.post(
    '/',
    { preHandler: requireRole('front_desk', 'manager', 'admin') },
    async (request, reply) => {
      const parsed = CreateReservationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'Invalid request body', { details: parsed.error.issues }));
      }
      const d = parsed.data;
      if (new Date(d.checkOutDate) <= new Date(d.checkInDate)) {
        return reply
          .status(400)
          .send(errBody('VALIDATION_ERROR', 'checkOutDate must be after checkInDate'));
      }

      const created = await prisma.reservation.create({
        data: {
          guestId: d.guestId,
          propertyId: d.propertyId,
          roomId: d.roomId ?? null,
          status: 'confirmed',
          checkInDate: new Date(d.checkInDate),
          checkOutDate: new Date(d.checkOutDate),
          adults: d.adults,
          children: d.children,
          ratePlan: d.ratePlan ?? null,
          roomRate: d.roomRate !== undefined ? new Prisma.Decimal(d.roomRate) : null,
          specialRequests: d.specialRequests ?? null,
          source: d.source,
        },
        include: { room: true },
      });

      await emitBookingEvent({
        type: 'booking.confirmed',
        reservationId: created.id,
        guestId: created.guestId,
        propertyId: created.propertyId,
      });

      return reply.status(201).send(toReservationDto(created));
    },
  );
}
