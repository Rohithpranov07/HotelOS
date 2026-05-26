import type { PrismaClient } from '@prisma/client';
import { config } from '../config.js';
import { generateInvoicePdf, type InvoiceData } from '../lib/invoice.js';
import { num, nightsBetween, isFnbType, type InvoiceLineItem } from '../lib/folio.js';
import { uploadInvoice, type UploadResult } from '../lib/s3.js';

function invoiceNumber(reservationId: string, generatedAt: Date): string {
  const yyyymmdd = generatedAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${yyyymmdd}-${reservationId.slice(0, 8).toUpperCase()}`;
}

/**
 * Assemble the InvoiceData payload for a reservation: room nights × rate +
 * each completed order, with subtotals split into room / fnb / other.
 */
export async function buildInvoiceData(
  prisma: PrismaClient,
  reservationId: string,
): Promise<InvoiceData | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      room: true,
      orders: true,
    },
  });
  if (!reservation) return null;

  const generatedAt = new Date();
  const nights = nightsBetween(reservation.checkInDate, reservation.checkOutDate);
  const roomRate = num(reservation.roomRate);
  const roomSubtotal = roomRate * nights;

  const lineItems: InvoiceLineItem[] = [
    {
      description: `Room charge — ${nights} night${nights > 1 ? 's' : ''}`,
      quantity: nights,
      amount: roomSubtotal,
      date: reservation.checkInDate.toISOString().slice(0, 10),
    },
  ];

  let fnb = 0;
  let other = 0;
  for (const o of reservation.orders) {
    if (o.status !== 'completed') continue;
    const amt = num(o.totalAmount);
    if (isFnbType(o.type)) fnb += amt;
    else other += amt;
    lineItems.push({
      description: `${o.type} order`,
      quantity: 1,
      amount: amt,
      date: o.createdAt.toISOString().slice(0, 10),
    });
  }

  const totalAmount = roomSubtotal + fnb + other;
  const paidAmount = num(reservation.paidAmount);

  return {
    invoiceNumber: invoiceNumber(reservation.id, generatedAt),
    hotelName: config.hotel.name,
    hotelAddress: config.hotel.address,
    guestName: reservation.guest.fullName,
    guestEmail: reservation.guest.email,
    roomNumber: reservation.room?.roomNumber ?? 'N/A',
    checkIn: reservation.checkInDate.toISOString().slice(0, 10),
    checkOut: reservation.checkOutDate.toISOString().slice(0, 10),
    lineItems,
    subtotals: { room: roomSubtotal, fnb, other },
    totalAmount,
    paidAmount,
    balanceDue: Math.max(0, totalAmount - paidAmount),
    generatedAt: generatedAt.toISOString(),
  };
}

export async function renderAndUploadInvoice(
  prisma: PrismaClient,
  reservationId: string,
): Promise<{ data: InvoiceData; pdf: Buffer; upload: UploadResult } | null> {
  const data = await buildInvoiceData(prisma, reservationId);
  if (!data) return null;
  const pdf = await generateInvoicePdf(data);
  const upload = await uploadInvoice(reservationId, pdf);
  return { data, pdf, upload };
}
