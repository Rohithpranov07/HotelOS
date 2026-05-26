import type { Prisma } from '@prisma/client';

export function num(d: Prisma.Decimal | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === 'number') return d;
  return Number(d.toString());
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function isFnbType(type: string): boolean {
  return type === 'food' || type === 'beverage';
}

export function isAmenityType(type: string): boolean {
  return type === 'amenity';
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  amount: number;
  date: string;
}
