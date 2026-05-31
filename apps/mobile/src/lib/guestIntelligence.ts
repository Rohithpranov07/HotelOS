// Derived signals for the staff guest-intelligence screen:
// sentiment score from feedback, upsell flags from preferences + tier, and a
// repeat-guest recognition prompt. Pure logic — UI screens own presentation.

import type { GuestProfileFull } from '../stores/staff.store';

export interface SentimentScore {
  score: number; // 0–100
  label: 'Glowing' | 'Positive' | 'Neutral' | 'Mixed' | 'At risk';
  tint: 'positive' | 'neutral' | 'negative';
  sampleSize: number;
}

export function computeSentimentScore(profile: GuestProfileFull): SentimentScore {
  const ratings = profile.recentFeedback.map((f) => f.rating);
  if (ratings.length === 0) {
    return { score: 70, label: 'Neutral', tint: 'neutral', sampleSize: 0 };
  }
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  // 1–5 stars → 0–100 score, gently shaped so 4★+ feels great and 2★ feels bad.
  const score = Math.round(Math.min(100, Math.max(0, (avg - 1) * 25)));
  let label: SentimentScore['label'];
  let tint: SentimentScore['tint'];
  if (score >= 90) {
    label = 'Glowing';
    tint = 'positive';
  } else if (score >= 70) {
    label = 'Positive';
    tint = 'positive';
  } else if (score >= 55) {
    label = 'Neutral';
    tint = 'neutral';
  } else if (score >= 40) {
    label = 'Mixed';
    tint = 'neutral';
  } else {
    label = 'At risk';
    tint = 'negative';
  }
  return { score, label, tint, sampleSize: ratings.length };
}

export interface UpsellFlag {
  id: string;
  title: string;
  body: string;
  cta: string;
  weight: 'high' | 'medium' | 'low';
}

const TIER_ORDER: Record<GuestProfileFull['loyaltyTier'], number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

export function computeUpsellFlags(profile: GuestProfileFull): UpsellFlag[] {
  const flags: UpsellFlag[] = [];

  // Tier-progression hook
  if (profile.loyaltyTier === 'GOLD') {
    flags.push({
      id: 'upsell-platinum',
      title: 'Within reach of Platinum',
      body: 'Two more stays this year unlocks Platinum — flag the perk during checkout to lock loyalty.',
      cta: 'Mention Platinum upgrade path',
      weight: 'high',
    });
  } else if (profile.loyaltyTier === 'SILVER') {
    flags.push({
      id: 'upsell-gold',
      title: 'On track for Gold',
      body: 'Suggest the dining add-on; one signed bill closes the Gold qualifier.',
      cta: 'Offer dining add-on',
      weight: 'medium',
    });
  }

  // Suite upgrade for high-tier on standard rooms
  if (TIER_ORDER[profile.loyaltyTier] >= TIER_ORDER.GOLD && profile.currentStay) {
    flags.push({
      id: 'upsell-suite',
      title: 'Complimentary suite upgrade opportunity',
      body: `Room ${profile.currentStay.roomNumber} on a standard rate — a courtesy suite upgrade pays for itself in 1 incremental F&B order.`,
      cta: 'Flag suite upgrade',
      weight: 'high',
    });
  }

  // Preference-driven cross-sell
  if (profile.preferences.dietary?.includes('vegetarian')) {
    flags.push({
      id: 'upsell-tasting',
      title: 'Vegetarian chef\'s table fit',
      body: 'Specialty restaurant is running the seasonal vegetarian tasting tonight — perfect match for stated dietary preference.',
      cta: 'Pitch chef\'s table',
      weight: 'medium',
    });
  }

  if (profile.preferences.floor === 'high' || profile.preferences.pillowFirmness) {
    flags.push({
      id: 'upsell-spa',
      title: 'Spa preference signal',
      body: 'Guest leans into ambience preferences (room, pillow). Spa signature ritual fits the pattern — average attach ₹4.2k.',
      cta: 'Drop spa menu',
      weight: 'low',
    });
  }

  return flags.sort((a, b) => weight(b.weight) - weight(a.weight));
}

function weight(w: UpsellFlag['weight']): number {
  return w === 'high' ? 3 : w === 'medium' ? 2 : 1;
}

export interface RepeatGuestPrompt {
  isRepeat: boolean;
  badge: string;
  message: string;
}

export function computeRepeatGuestPrompt(profile: GuestProfileFull): RepeatGuestPrompt {
  const stays = profile.totalStays;
  if (stays <= 1) {
    return {
      isRepeat: false,
      badge: 'First stay',
      message: 'New to the property — set the tone with a personalised arrival note.',
    };
  }
  if (stays < 5) {
    return {
      isRepeat: true,
      badge: `${stays}× returning`,
      message: 'Acknowledge by name on arrival and reference their previous stay.',
    };
  }
  if (stays < 10) {
    return {
      isRepeat: true,
      badge: `${stays}× loyal`,
      message: 'Welcome back personally. Worth a hand-written note in the room.',
    };
  }
  return {
    isRepeat: true,
    badge: `${stays}× VIP`,
    message: `Career-long regular. Engage the duty manager for a touch-base — they are part of the house.`,
  };
}
