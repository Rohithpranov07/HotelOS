import type { Prisma } from '@prisma/client';

export function num(d: Prisma.Decimal | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === 'number') return d;
  return Number(d.toString());
}

export function isFnbType(type: string): boolean {
  return type === 'food' || type === 'beverage';
}
