import type { LoyaltyTier } from '@prisma/client';

export const TIER_THRESHOLDS = {
  silver: 1000,
  gold: 5000,
  platinum: 15000,
} as const;

export const TIER_EARN_MULTIPLIERS: Record<LoyaltyTier, number> = {
  bronze: 1.0,
  silver: 1.2,
  gold: 1.5,
  platinum: 2.0,
};

export const TIER_BENEFITS: Record<LoyaltyTier, string[]> = {
  bronze: ['Welcome drink', 'Loyalty newsletter'],
  silver: ['1.2x points', 'Late checkout (1 hour)', 'Welcome amenity'],
  gold: ['1.5x points', 'Late checkout (3 hours)', 'Room upgrade (subject to availability)', 'Free breakfast'],
  platinum: [
    '2x points',
    'Guaranteed late checkout (4pm)',
    'Suite upgrade (subject to availability)',
    'Free breakfast',
    'Complimentary spa credit',
  ],
};

const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export function calculateTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export function nextTierOf(tier: LoyaltyTier): LoyaltyTier | null {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx < 0 || idx === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1]!;
}

export function pointsToNextTier(lifetimePoints: number): {
  next: LoyaltyTier | null;
  pointsRemaining: number;
  progressPct: number;
} {
  const current = calculateTier(lifetimePoints);
  const next = nextTierOf(current);
  if (!next) return { next: null, pointsRemaining: 0, progressPct: 100 };
  // ``next`` is whatever's above the current tier — never bronze, so this
  // cast is safe and lets us index TIER_THRESHOLDS without an `any` widening.
  const target = TIER_THRESHOLDS[next as Exclude<LoyaltyTier, 'bronze'>];
  const floor =
    current === 'bronze'
      ? 0
      : current === 'silver'
        ? TIER_THRESHOLDS.silver
        : TIER_THRESHOLDS.gold;
  const remaining = Math.max(0, target - lifetimePoints);
  const span = target - floor;
  const progress = span <= 0 ? 100 : Math.max(0, Math.min(100, ((lifetimePoints - floor) / span) * 100));
  return { next, pointsRemaining: remaining, progressPct: Math.round(progress) };
}

export type EarnCategory = 'room' | 'fnb' | 'other';

/**
 * Earn formula:
 *   base = floor(spend / 100 * propertyEarnRate)
 *   final = floor(base × tierMultiplier × categoryMultiplier)
 *
 * F&B earns 2× to encourage in-stay spend. Room and other are 1×.
 */
export function calculatePointsToEarn(params: {
  spendAmount: number;
  earnRate: number;
  tier: LoyaltyTier;
  category: EarnCategory;
}): number {
  if (params.spendAmount <= 0) return 0;
  const basePoints = Math.floor((params.spendAmount / 100) * params.earnRate);
  const tierMultiplier = TIER_EARN_MULTIPLIERS[params.tier];
  const categoryMultiplier = params.category === 'fnb' ? 2 : 1;
  return Math.floor(basePoints * tierMultiplier * categoryMultiplier);
}

/** 10 points = ₹1 — keep symmetric with valueToPoints. */
export function pointsToValue(points: number): number {
  return points / 10;
}

export function valueToPoints(rupees: number): number {
  return Math.floor(rupees * 10);
}
