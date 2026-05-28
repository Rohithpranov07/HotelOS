import { create } from 'zustand';
import { loyaltyApi } from '../lib/api';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardPoints: number;
  icon: 'restaurant' | 'phone-portrait' | 'sparkles' | 'star' | 'gift';
}

export interface LoyaltySummary {
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  tierProgressPct: number;
  pointsExpiringSoon: { amount: number; expiryDate: string } | null;
  thisStayEarned: number;
  redemptionValue: number;
  tierBenefits: string[];
  challenges: LoyaltyChallenge[];
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjust';
  points: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

interface LoyaltyState {
  summary: LoyaltySummary | null;
  statement: LoyaltyTransaction[];
  statementPage: number;
  statementHasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  fetchSummary: () => Promise<void>;
  fetchStatement: (opts?: { reset?: boolean }) => Promise<void>;
}

const DEFAULT_CHALLENGES: LoyaltyChallenge[] = [
  {
    id: 'foodie',
    title: 'Foodie',
    description: 'Order 5 in-suite meals',
    progress: 3,
    target: 5,
    rewardPoints: 200,
    icon: 'restaurant',
  },
  {
    id: 'app-login',
    title: 'App regular',
    description: 'Open the app on 3 days of your stay',
    progress: 3,
    target: 3,
    rewardPoints: 50,
    icon: 'phone-portrait',
  },
  {
    id: 'spa-session',
    title: 'Wellness',
    description: 'Book a spa or wellness service',
    progress: 0,
    target: 1,
    rewardPoints: 150,
    icon: 'sparkles',
  },
  {
    id: 'review',
    title: 'Storyteller',
    description: 'Leave a review after checkout',
    progress: 0,
    target: 1,
    rewardPoints: 100,
    icon: 'star',
  },
];

function demoSummary(): LoyaltySummary {
  return {
    currentPoints: 4820,
    lifetimePoints: 18420,
    tier: 'GOLD',
    nextTier: 'PLATINUM',
    pointsToNextTier: 2600,
    tierProgressPct: 0.82,
    pointsExpiringSoon: { amount: 500, expiryDate: '2026-07-31' },
    thisStayEarned: 148,
    redemptionValue: 482,
    tierBenefits: [
      'Late checkout request',
      'Priority room service',
      'Room upgrade request',
      'Welcome amenity',
    ],
    challenges: DEFAULT_CHALLENGES,
  };
}

function demoStatement(page: number, perPage = 10): LoyaltyTransaction[] {
  const seed = [
    { type: 'earn' as const, points: 148, reason: 'Stay earnings · Hôtel Octave', daysAgo: 2 },
    { type: 'redeem' as const, points: -500, reason: 'Redeemed at F&B', daysAgo: 3 },
    { type: 'bonus' as const, points: 100, reason: 'Review bonus', daysAgo: 28 },
    { type: 'earn' as const, points: 320, reason: 'Stay earnings · Kyoto', daysAgo: 62 },
    { type: 'earn' as const, points: 240, reason: 'Spa booking', daysAgo: 90 },
    { type: 'expire' as const, points: -120, reason: 'Points expiry', daysAgo: 120 },
    { type: 'earn' as const, points: 410, reason: 'Stay earnings · Mumbai', daysAgo: 160 },
    { type: 'bonus' as const, points: 200, reason: 'Anniversary bonus', daysAgo: 210 },
  ];
  let balance = 4820;
  const rows: LoyaltyTransaction[] = seed.map((s, i) => {
    balance -= s.points;
    return {
      id: `local-${page}-${i}`,
      type: s.type,
      points: s.points,
      balanceAfter: balance + s.points,
      reason: s.reason,
      createdAt: new Date(Date.now() - s.daysAgo * 86_400_000).toISOString(),
    };
  });
  const start = (page - 1) * perPage;
  return rows.slice(start, start + perPage);
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  summary: null,
  statement: [],
  statementPage: 0,
  statementHasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await loyaltyApi.get<Record<string, unknown>>('/loyalty/summary');
      const summary: LoyaltySummary = {
        currentPoints: Number(data.current_points ?? 0),
        lifetimePoints: Number(data.lifetime_points ?? 0),
        tier: ((data.tier as string) ?? 'BRONZE').toUpperCase() as LoyaltyTier,
        nextTier:
          data.next_tier
            ? ((data.next_tier as string).toUpperCase() as LoyaltyTier)
            : null,
        pointsToNextTier: Number(data.points_to_next_tier ?? 0),
        tierProgressPct: Math.max(0, Math.min(1, Number(data.tier_progress_pct ?? 0))),
        pointsExpiringSoon:
          data.points_expiring_soon && typeof data.points_expiring_soon === 'object'
            ? {
                amount: Number(
                  (data.points_expiring_soon as Record<string, unknown>).amount ?? 0,
                ),
                expiryDate: String(
                  (data.points_expiring_soon as Record<string, unknown>).expiry_date ?? '',
                ),
              }
            : null,
        thisStayEarned: Number(data.this_stay_earned ?? 0),
        redemptionValue: Number(data.redemption_value ?? 0),
        tierBenefits: Array.isArray(data.tier_benefits)
          ? (data.tier_benefits as string[])
          : [],
        challenges: Array.isArray(data.challenges)
          ? (data.challenges as LoyaltyChallenge[])
          : DEFAULT_CHALLENGES,
      };
      set({ summary, isLoading: false });
    } catch {
      set({ summary: demoSummary(), isLoading: false });
    }
  },

  fetchStatement: async (opts) => {
    const reset = opts?.reset ?? false;
    const current = get();
    if (current.isLoadingMore) return;
    if (!reset && !current.statementHasMore) return;
    const nextPage = reset ? 1 : current.statementPage + 1;
    set({
      isLoadingMore: true,
      statement: reset ? [] : current.statement,
      statementPage: reset ? 0 : current.statementPage,
    });
    try {
      const { data } = await loyaltyApi.get<{
        data: Array<Record<string, unknown>>;
        meta: { page: number; per_page: number; total: number };
      }>('/loyalty/statement', { params: { page: nextPage, per_page: 10 } });
      const rows: LoyaltyTransaction[] = data.data.map((r) => ({
        id: String(r.id),
        type: String(r.type) as LoyaltyTransaction['type'],
        points: Number(r.points),
        balanceAfter: Number(r.balance_after ?? 0),
        reason: String(r.reason ?? ''),
        createdAt: String(r.created_at),
      }));
      const fetched = reset ? rows : [...current.statement, ...rows];
      const hasMore = fetched.length < data.meta.total;
      set({
        statement: fetched,
        statementPage: nextPage,
        statementHasMore: hasMore,
        isLoadingMore: false,
      });
    } catch {
      const rows = demoStatement(nextPage);
      const fetched = reset ? rows : [...current.statement, ...rows];
      set({
        statement: fetched,
        statementPage: nextPage,
        statementHasMore: rows.length === 10,
        isLoadingMore: false,
      });
    }
  },
}));
