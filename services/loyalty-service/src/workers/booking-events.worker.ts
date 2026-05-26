import { Worker, type Job } from 'bullmq';
import { workerConnection } from '../lib/queue.js';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { LedgerService } from '../services/ledger.service.js';
import { calculatePointsToEarn } from '../lib/loyalty.js';

export interface BookingEventJobData {
  reservationId: string;
  guestId?: string;
  propertyId?: string;
  totalAmount?: number;
}

async function handleCheckedOut(
  ledger: LedgerService,
  data: BookingEventJobData,
): Promise<{ totalCredited: number }> {
  // Pull the canonical totals from the database — the BullMQ event only
  // ships totalAmount, but we need fnb and other breakdowns to apply the 2×
  // F&B multiplier, and we want to be the source of truth for the math.
  const reservation = await prisma.reservation.findUnique({
    where: { id: data.reservationId },
    include: { guest: { include: { property: true } } },
  });
  if (!reservation) {
    return { totalCredited: 0 };
  }

  const guest = reservation.guest;
  const earnRate = Number(guest.property.loyaltyEarnRate);
  const tier = guest.loyaltyTier;

  const totalAmount = Number(reservation.totalAmount);
  const fnbAmount = Number(reservation.totalFnbAmount);
  const otherAmount = Number(reservation.totalOtherAmount);
  const roomAmount = Math.max(0, totalAmount - fnbAmount - otherAmount);

  const roomPoints = calculatePointsToEarn({
    spendAmount: roomAmount,
    earnRate,
    tier,
    category: 'room',
  });
  const fnbPoints = calculatePointsToEarn({
    spendAmount: fnbAmount,
    earnRate,
    tier,
    category: 'fnb',
  });
  const otherPoints = calculatePointsToEarn({
    spendAmount: otherAmount,
    earnRate,
    tier,
    category: 'other',
  });
  const totalPoints = roomPoints + fnbPoints + otherPoints;

  let credited = 0;
  if (totalPoints > 0) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + guest.property.pointsExpiryDays);

    const r = await ledger.creditPoints({
      guestId: reservation.guestId,
      propertyId: reservation.propertyId,
      reservationId: reservation.id,
      points: totalPoints,
      type: 'earn',
      reason: `Stay earnings — room: ${roomPoints} pts, F&B: ${fnbPoints} pts, other: ${otherPoints} pts`,
      // referenceId makes earn idempotent on a re-delivered event.
      referenceId: reservation.id,
      expiresAt,
    });
    if (r.credited) credited += totalPoints;
  }

  // App check-in bonus — once per reservation.
  const bonusReferenceId = `${reservation.id}:checkin-bonus`;
  const bonus = await ledger.creditPoints({
    guestId: reservation.guestId,
    propertyId: reservation.propertyId,
    reservationId: reservation.id,
    points: config.appCheckinBonus,
    type: 'bonus',
    reason: 'App check-in bonus',
    referenceId: bonusReferenceId,
  });
  if (bonus.credited) credited += config.appCheckinBonus;

  return { totalCredited: credited };
}

export function startBookingEventsWorker(): Worker<BookingEventJobData> {
  const ledger = new LedgerService(prisma);
  return new Worker<BookingEventJobData>(
    'booking-events',
    async (job: Job<BookingEventJobData>) => {
      if (job.name !== 'booking.checked_out') return { ignored: job.name };
      return handleCheckedOut(ledger, job.data);
    },
    { connection: workerConnection, concurrency: 4 },
  );
}
