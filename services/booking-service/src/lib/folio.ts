import type { Prisma } from '@prisma/client';

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export type FolioLineItem = {
  id: string;
  description: string;
  type: 'room' | 'food' | 'laundry' | 'amenity' | 'other';
  amount: number;
  date: string;
  order_id?: string;
};

export function num(d: Prisma.Decimal | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === 'number') return d;
  return Number(d.toString());
}
