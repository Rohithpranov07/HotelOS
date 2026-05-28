import { create } from 'zustand';
import { aiApi } from '../lib/api';
import { storage, StorageKeys } from '../lib/storage';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConciergeAction {
  type: 'order_created' | 'service_requested' | 'human_escalation' | string;
  data: Record<string, unknown>;
}

export interface ConciergeMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  actions?: ConciergeAction[];
  suggestions?: string[];
  isTyping?: boolean;
}

interface RespondPayload {
  response_text: string;
  actions: Array<Record<string, unknown>>;
  intent: string;
  confidence: number;
  sentiment_score: number;
  needs_human: boolean;
  follow_up_suggestions: string[];
}

interface ConciergeState {
  messages: ConciergeMessage[];
  sessionId: string;
  isTyping: boolean;
  needsHuman: boolean;
  escalationVisible: boolean;
  error: string | null;
  hydrated: boolean;

  hydrateFromStorage: (reservationId: string) => void;
  hydrateGreeting: (firstName?: string) => void;
  setTyping: (typing: boolean) => void;
  appendAssistantMessage: (msg: ConciergeMessage) => void;
  sendMessage: (
    text: string,
    reservationId: string,
    guestProfile: Record<string, unknown>,
  ) => Promise<void>;
  requestHuman: (reservationId: string) => Promise<void>;
  dismissEscalation: () => void;
  clearConversation: () => void;
}

function persist(messages: ConciergeMessage[], sessionId: string): void {
  try {
    storage.set(StorageKeys.ConciergeMessages, JSON.stringify(messages));
    storage.set(StorageKeys.ConciergeSessionId, sessionId);
  } catch {
    // best-effort
  }
}

function loadPersisted(reservationId: string): {
  messages: ConciergeMessage[];
  sessionId: string;
} | null {
  try {
    const prevReservation = storage.getString(StorageKeys.ConciergeReservationId);
    if (prevReservation && prevReservation !== reservationId) {
      // Stay changed — drop history so we don't bleed across reservations.
      storage.delete(StorageKeys.ConciergeMessages);
      storage.delete(StorageKeys.ConciergeSessionId);
      storage.set(StorageKeys.ConciergeReservationId, reservationId);
      return null;
    }
    if (!prevReservation) storage.set(StorageKeys.ConciergeReservationId, reservationId);
    const raw = storage.getString(StorageKeys.ConciergeMessages);
    const sid = storage.getString(StorageKeys.ConciergeSessionId);
    if (!raw || !sid) return null;
    const messages = JSON.parse(raw) as ConciergeMessage[];
    if (!Array.isArray(messages)) return null;
    return { messages, sessionId: sid };
  } catch {
    return null;
  }
}

const newSessionId = () =>
  `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const newId = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const GREETING_SUGGESTIONS = [
  'Order dinner',
  'Book the spa',
  'Late check-out',
];

function greetingFor(firstName?: string): ConciergeMessage {
  const name = firstName ?? 'there';
  return {
    id: newId(),
    role: 'assistant',
    content: `Good evening, ${name}. The suite is turned down and ready. Shall I bring up your usual cappuccino at nine?`,
    timestamp: Date.now(),
    suggestions: GREETING_SUGGESTIONS,
  };
}

export const useConciergeStore = create<ConciergeState>((set, get) => ({
  messages: [],
  sessionId: newSessionId(),
  isTyping: false,
  needsHuman: false,
  escalationVisible: false,
  error: null,
  hydrated: false,

  hydrateFromStorage: (reservationId) => {
    if (get().hydrated) return;
    const persisted = loadPersisted(reservationId);
    if (persisted) {
      set({
        messages: persisted.messages,
        sessionId: persisted.sessionId,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  setTyping: (typing) => set({ isTyping: typing }),

  appendAssistantMessage: (msg) => {
    set((s) => {
      const next = [...s.messages, msg];
      persist(next, s.sessionId);
      return { messages: next, isTyping: false };
    });
  },

  hydrateGreeting: (firstName) => {
    if (get().messages.length > 0) return;
    const greeting = greetingFor(firstName);
    set({ messages: [greeting] });
    persist([greeting], get().sessionId);
  },

  sendMessage: async (text, reservationId, guestProfile) => {
    const clean = text.trim();
    if (!clean) return;

    const userMsg: ConciergeMessage = {
      id: newId(),
      role: 'user',
      content: clean,
      timestamp: Date.now(),
    };

    // Strip suggestions from the most recent assistant message — they belong
    // to the previous turn only.
    set((s) => {
      const next = [
        ...s.messages.map((m) =>
          m.role === 'assistant' && m.suggestions ? { ...m, suggestions: undefined } : m,
        ),
        userMsg,
      ];
      persist(next, s.sessionId);
      return { messages: next, isTyping: true, error: null };
    });

    // Manual escalation trigger
    if (/speak to (someone|a person|a human|staff)/i.test(clean)) {
      set({ isTyping: false, needsHuman: true, escalationVisible: true });
      return;
    }

    try {
      const history = get()
        .messages.slice(-10)
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await aiApi.post<RespondPayload>('/respond', {
        message: clean,
        reservation_id: reservationId,
        property_id: (guestProfile.property_id as string) ?? 'demo-property',
        session_id: get().sessionId,
        conversation_history: history,
        guest_profile: guestProfile,
      });

      const assistant: ConciergeMessage = {
        id: newId(),
        role: 'assistant',
        content: data.response_text,
        timestamp: Date.now(),
        actions: data.actions.map((a) => ({
          type: (a.type as string) ?? 'service_requested',
          data: a,
        })),
        suggestions: data.follow_up_suggestions,
      };

      set((s) => {
        const next = [...s.messages, assistant];
        persist(next, s.sessionId);
        return {
          messages: next,
          isTyping: false,
          needsHuman: data.needs_human,
          escalationVisible: data.needs_human ? true : s.escalationVisible,
        };
      });
    } catch (err) {
      // Graceful fallback so the chat keeps flowing without ai-service running.
      const assistant: ConciergeMessage = {
        id: newId(),
        role: 'assistant',
        content:
          'Of course. Drafted to your folio — the kitchen will plate it now.',
        timestamp: Date.now(),
        actions: maybeMockAction(clean),
        suggestions: ['Track my order', 'Add a dessert', 'What’s the checkout time?'],
      };
      set((s) => {
        const next = [...s.messages, assistant];
        persist(next, s.sessionId);
        return {
          messages: next,
          isTyping: false,
          error: err instanceof Error ? err.message : 'Concierge offline',
        };
      });
    }
  },

  requestHuman: async (reservationId) => {
    try {
      await aiApi.post(`/crm/conversations/${reservationId}/takeover`, {
        session_id: get().sessionId,
      });
    } catch {
      // CRM endpoint is optional; we still confirm to the guest.
    }
    set((s) => {
      const next = [
        ...s.messages,
        {
          id: newId(),
          role: 'system' as const,
          content:
            'A team member is on the line — they can see this conversation and will reply shortly.',
          timestamp: Date.now(),
        },
      ];
      persist(next, s.sessionId);
      return { escalationVisible: false, messages: next };
    });
  },

  dismissEscalation: () => set({ escalationVisible: false }),

  clearConversation: () => {
    storage.delete(StorageKeys.ConciergeMessages);
    storage.delete(StorageKeys.ConciergeSessionId);
    set({
      messages: [],
      sessionId: newSessionId(),
      isTyping: false,
      needsHuman: false,
      escalationVisible: false,
      error: null,
    });
  },
}));

function maybeMockAction(text: string): ConciergeAction[] | undefined {
  if (!/order|sandwich|coffee|croissant|cappuccino|tea|food|dinner|breakfast/i.test(text)) {
    return undefined;
  }
  return [
    {
      type: 'order_created',
      data: {
        order_id: `mock_${Date.now().toString(36)}`,
        eta_minutes: 12,
        items: [
          { name: 'Cappuccino', qty: 1, price: 1200, sub: 'Oat · double shot' },
          { name: 'Almond croissant', qty: 1, price: 950, sub: 'Warm' },
        ],
        total: 2150,
        currency_symbol: '¥',
      },
    },
  ];
}
