export const SLA_MINUTES: Record<string, number> = {
  food: 30,
  beverage: 25,
  laundry: 15,
  laundry_pickup: 15,
  laundry_delivery: 240,
  housekeeping: 30,
  amenity: 20,
  maintenance: 120,
  spa: 15,
};

export function slaMinutesFor(orderType: string): number {
  return SLA_MINUTES[orderType] ?? 30;
}

export function calculateSlaDeadline(orderType: string, acceptedAt: Date): Date {
  return new Date(acceptedAt.getTime() + slaMinutesFor(orderType) * 60 * 1000);
}

export function getSlaStatus(
  slaDeadline: Date | null,
  warningLeadMinutes = 10,
): 'ok' | 'warning' | 'breached' {
  if (!slaDeadline) return 'ok';
  const minutesRemaining = (slaDeadline.getTime() - Date.now()) / 60_000;
  if (minutesRemaining < 0) return 'breached';
  if (minutesRemaining < warningLeadMinutes) return 'warning';
  return 'ok';
}
