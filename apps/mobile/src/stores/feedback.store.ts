import { create } from 'zustand';
import { bookingApi } from '../lib/api';
import { bridgeNegativeFeedback } from '../lib/orderBridge';

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface CategoryRatings {
  food: number;
  housekeeping: number;
  frontDesk: number;
  concierge: number;
}

export interface FeedbackPayload {
  reservationId: string;
  overall: Mood;
  categories: CategoryRatings;
  comment?: string;
  voiceNoteUri?: string;
}

export interface FeedbackResult {
  pointsEarned: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  recommendation: 'google_review' | 'manager_contact' | 'none';
}

interface FeedbackState {
  submitting: boolean;
  lastResult: FeedbackResult | null;
  submit: (payload: FeedbackPayload) => Promise<FeedbackResult>;
  reset: () => void;
}

function inferSentiment(overall: Mood, categories: CategoryRatings): FeedbackResult['sentiment'] {
  const avgCat =
    (categories.food + categories.housekeeping + categories.frontDesk + categories.concierge) / 4;
  const blended = overall + (avgCat - 3) * 0.4;
  if (blended >= 4) return 'positive';
  if (blended <= 2) return 'negative';
  return 'neutral';
}

function recommendationFor(overall: Mood): FeedbackResult['recommendation'] {
  if (overall >= 4) return 'google_review';
  if (overall <= 2) return 'manager_contact';
  return 'none';
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  submitting: false,
  lastResult: null,

  submit: async (payload) => {
    set({ submitting: true });
    try {
      const { data } = await bookingApi.post<{
        points_earned?: number;
        sentiment?: FeedbackResult['sentiment'];
        recommendation?: FeedbackResult['recommendation'];
      }>('/feedback', {
        reservation_id: payload.reservationId,
        overall_score: payload.overall,
        ratings: {
          food: payload.categories.food,
          housekeeping: payload.categories.housekeeping,
          front_desk: payload.categories.frontDesk,
          concierge: payload.categories.concierge,
        },
        comment: payload.comment ?? null,
        voice_note_url: payload.voiceNoteUri ?? null,
      });
      const result: FeedbackResult = {
        pointsEarned: data.points_earned ?? 100,
        sentiment: data.sentiment ?? inferSentiment(payload.overall, payload.categories),
        recommendation: data.recommendation ?? recommendationFor(payload.overall),
      };
      set({ submitting: false, lastResult: result });
      if (result.sentiment === 'negative') {
        try {
          bridgeNegativeFeedback({
            reservationId: payload.reservationId,
            overallScore: payload.overall,
            comment: payload.comment,
          });
        } catch {
          // bridge is best-effort
        }
      }
      return result;
    } catch {
      // Backend not reachable — derive locally so the demo flow completes.
      const result: FeedbackResult = {
        pointsEarned: 100,
        sentiment: inferSentiment(payload.overall, payload.categories),
        recommendation: recommendationFor(payload.overall),
      };
      set({ submitting: false, lastResult: result });
      if (result.sentiment === 'negative') {
        try {
          bridgeNegativeFeedback({
            reservationId: payload.reservationId,
            overallScore: payload.overall,
            comment: payload.comment,
          });
        } catch {
          // bridge is best-effort
        }
      }
      return result;
    }
  },

  reset: () => set({ submitting: false, lastResult: null }),
}));
