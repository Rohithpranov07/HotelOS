import { create } from 'zustand';
import { aiApi } from '../lib/api';
import { storage, StorageKeys, CONCIERGE_STORE_VERSION } from '../lib/storage';

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

function clearConciergeStorage(): void {
  storage.delete(StorageKeys.ConciergeMessages);
  storage.delete(StorageKeys.ConciergeSessionId);
  storage.delete(StorageKeys.ConciergeReservationId);
  storage.delete(StorageKeys.ConciergeVersion);
}

function persist(messages: ConciergeMessage[], sessionId: string): void {
  try {
    storage.set(StorageKeys.ConciergeMessages, JSON.stringify(messages));
    storage.set(StorageKeys.ConciergeSessionId, sessionId);
    storage.set(StorageKeys.ConciergeVersion, CONCIERGE_STORE_VERSION);
  } catch {
    // best-effort
  }
}

function loadPersisted(reservationId: string): {
  messages: ConciergeMessage[];
  sessionId: string;
} | null {
  try {
    // Discard anything written by an older version of the store.
    const storedVersion = storage.getString(StorageKeys.ConciergeVersion);
    if (storedVersion !== CONCIERGE_STORE_VERSION) {
      clearConciergeStorage();
      return null;
    }
    const prevReservation = storage.getString(StorageKeys.ConciergeReservationId);
    if (prevReservation && prevReservation !== reservationId) {
      // Reservation changed — don't bleed history across stays.
      clearConciergeStorage();
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

function greetingFor(firstName?: string): ConciergeMessage {
  const name = firstName ?? 'there';
  const h = new Date().getHours();
  let greeting: string;
  let suggestions: string[];

  if (h >= 5 && h < 11) {
    greeting = `Good morning, ${name}. Breakfast is being served at the Orchard Restaurant, or I can arrange in-room service. The mist over the valley is beautiful right now — worth a look from your balcony.`;
    suggestions = ['Arrange in-room breakfast', "What's on the breakfast menu?", "Book Coaker's Walk at sunrise"];
  } else if (h >= 11 && h < 17) {
    greeting = `Good afternoon, ${name}. The garden is quiet and the sun is out — a good time for the lake or Bryant Park. Shall I arrange a cab, or is there something I can bring to the room?`;
    suggestions = ['Order lunch to the room', 'Arrange a cab to the lake', 'Late check-out request'];
  } else if (h >= 17 && h < 21) {
    greeting = `Good evening, ${name}. The Oasis Bar is open, and the bonfire on the lawn will be lit shortly. The kitchen at Orchard Restaurant is ready — shall I arrange dinner?`;
    suggestions = ['Order dinner to the room', "What's at the Oasis Bar?", 'Reserve a table at Orchard'];
  } else {
    greeting = `Still up, ${name}? The 24-hour coffee shop is open if you need something warm. The hotel is quiet — the hills are yours tonight.`;
    suggestions = ['Order a late-night snack', 'Fresh towels please', 'What time is checkout?'];
  }

  return {
    id: newId(),
    role: 'assistant',
    content: greeting,
    timestamp: Date.now(),
    suggestions,
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
    } catch {
      // ai-service unreachable — answer locally using the rule-based engine.
      const { text: fbText, actions: fbActions, suggestions: fbSuggestions } =
        localRespond(clean, guestProfile);
      const assistant: ConciergeMessage = {
        id: newId(),
        role: 'assistant',
        content: fbText,
        timestamp: Date.now(),
        actions: fbActions,
        suggestions: fbSuggestions,
      };
      set((s) => {
        const next = [...s.messages, assistant];
        persist(next, s.sessionId);
        return { messages: next, isTyping: false, error: null };
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
    clearConciergeStorage();
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

// ─── LOCAL RULE-BASED ENGINE ─────────────────────────────────────────────────
// Mirrors apps/ai-service/services/llm.py so the concierge works fully offline.

const MENU: Record<string, { price: number; eta: number; note: string }> = {
  'masala chai':        { price: 80,  eta: 15, note: 'SMess style' },
  'filter coffee':      { price: 160, eta: 15, note: 'South Indian style' },
  'fresh lime soda':    { price: 90,  eta: 10, note: '' },
  'south indian thali': { price: 350, eta: 35, note: 'SMess style, banana leaf' },
  'continental breakfast': { price: 420, eta: 30, note: 'Orchard Restaurant' },
  'grilled sandwich':   { price: 220, eta: 20, note: 'Grilled, with chutney' },
  'veg sandwich':       { price: 220, eta: 20, note: 'Grilled, with chutney' },
  'chocolate cake':     { price: 250, eta: 15, note: 'Homemade — 24hr Coffee Shop' },
  'cappuccino':         { price: 160, eta: 15, note: '' },
  'ice cream':          { price: 180, eta: 10, note: '2 scoops — 24hr Coffee Shop' },
  'sandwich':           { price: 220, eta: 20, note: 'Grilled, with chutney' },
  'breakfast':          { price: 420, eta: 30, note: 'Continental — Orchard Restaurant' },
  'thali':              { price: 350, eta: 35, note: 'SMess style, banana leaf' },
  'dinner':             { price: 350, eta: 35, note: 'Orchard Restaurant' },
  'lunch':              { price: 350, eta: 35, note: 'Orchard Restaurant' },
  'coffee':             { price: 160, eta: 15, note: 'South Indian style' },
  'pasta':              { price: 320, eta: 25, note: 'Orchard Restaurant' },
  'beer':               { price: 320, eta: 10, note: 'Pint — Oasis Bar' },
  'wine':               { price: 480, eta: 10, note: 'House wine, glass — Oasis Bar' },
  'cake':               { price: 250, eta: 15, note: 'Homemade — 24hr Coffee Shop' },
  'snack':              { price: 180, eta: 20, note: 'HKI Tea Kadai' },
  'chai':               { price: 80,  eta: 15, note: 'SMess style' },
  'tea':                { price: 80,  eta: 15, note: '' },
};

const NEARBY: Record<string, [string, string]> = {
  'lake':         ['Kodaikanal Lake', '6 min drive'],
  'kodaikanal lake': ['Kodaikanal Lake', '6 min drive'],
  'coaker':       ["Coaker's Walk", '10 min drive'],
  "coaker's walk": ["Coaker's Walk", '10 min drive'],
  'coakers walk': ["Coaker's Walk", '10 min drive'],
  'bryant park':  ['Bryant Park', '8 min drive'],
  'pillar rocks': ['Pillar Rocks', '20 min drive'],
  'silver cascade': ['Silver Cascade Falls', '12 min drive'],
  'falls':        ['Silver Cascade Falls', '12 min drive'],
  'berijam':      ['Berijam Lake', '45 min drive'],
  'bazaar':       ['Tibetan & Coronation Bazaar', '8 min drive'],
  'market':       ['Tibetan & Coronation Bazaar', '8 min drive'],
};

function guestName(gp: Record<string, unknown>): string {
  return (gp.first_name as string) || (gp.full_name as string)?.split(' ')[0] || 'there';
}

function findMenuItem(msg: string): [string, { price: number; eta: number; note: string }] | null {
  const m = msg.toLowerCase();
  for (const key of Object.keys(MENU).sort((a, b) => b.length - a.length)) {
    if (m.includes(key)) return [key, MENU[key]];
  }
  return null;
}

function serviceAction(service: string, notes: string): ConciergeAction {
  return { type: 'service_requested', data: { service, notes } };
}

function localRespond(
  msg: string,
  gp: Record<string, unknown>,
): { text: string; actions: ConciergeAction[]; suggestions: string[] } {
  const m = msg.toLowerCase();
  const name = guestName(gp);

  // ORDER
  if (/\b(order|bring|send|get me|i want|i'?d like|can i (get|have))\b/.test(m)) {
    const hit = findMenuItem(msg);
    if (hit) {
      const [key, item] = hit;
      const note = item.note ? ` — ${item.note}` : '';
      return {
        text: `Coming right up, ${name}. ${key.replace(/\b\w/g, (c) => c.toUpperCase())}${note} will be with you in about ${item.eta} minutes. ₹${item.price} added to your folio.`,
        actions: [{
          type: 'order_created',
          data: {
            order_id: `local_${Date.now().toString(36)}`,
            items: [{ name: key.replace(/\b\w/g, (c) => c.toUpperCase()), qty: 1, price: item.price, sub: item.note }],
            total: item.price,
            currency_symbol: '₹',
            eta_minutes: item.eta,
          },
        }],
        suggestions: ['Track my order', 'Add another item', 'What else is available?'],
      };
    }
    return {
      text: `What would you like, ${name}? I can arrange beverages, meals from Orchard Restaurant, or anything from our 24-hour coffee shop.`,
      actions: [],
      suggestions: ['Masala chai', 'Filter coffee', 'Veg sandwich'],
    };
  }

  // TRANSPORT
  if (/\b(cab|taxi|car|drop|pickup|transport|airport|drive|ride)\b/.test(m)) {
    let dest = 'your destination';
    for (const [key, [place, time]] of Object.entries(NEARBY)) {
      if (m.includes(key)) { dest = `${place} (${time})`; break; }
    }
    if (m.includes('madurai')) dest = 'Madurai Airport (approx. 3 hr)';
    else if (m.includes('coimbatore')) dest = 'Coimbatore Airport (approx. 3.5 hr)';
    return {
      text: `I'll arrange a cab to ${dest}, ${name}. Our driver will be at the lobby — reception will confirm timing. You can also call +91 9944945190.`,
      actions: [serviceAction('Transport', `Cab to ${dest}`)],
      suggestions: ['Track my cab', 'What time should I leave?', 'Late check-out request'],
    };
  }

  // HOUSEKEEPING
  if (/\b(towels?|pillows?|blankets?|housekeeping|toiletries|iron|laundry|clean)\b/.test(m)) {
    const item = /towel/.test(m) ? 'extra towels' : /pillow|blanket/.test(m) ? 'extra pillows/blanket' : /iron|laundry/.test(m) ? 'laundry/ironing' : 'housekeeping';
    return {
      text: `I've sent a request for ${item}, ${name}. Someone will be with you shortly.`,
      actions: [serviceAction('Housekeeping', item)],
      suggestions: ['Fresh towels please', 'Room cleaning', 'What time is checkout?'],
    };
  }

  // POLICY
  if (/\b(checkout|check.?out|late check|early check.?in)\b/.test(m)) {
    if (/late/.test(m)) {
      return {
        text: `Late check-out is available until 2:00 PM subject to availability, ${name}. Standard check-out is 11:00 AM. I'll flag this for the front desk.`,
        actions: [serviceAction('Late Check-out', 'Guest requested late check-out')],
        suggestions: ['Confirm late check-out', 'Order breakfast', 'Arrange airport cab'],
      };
    }
    return {
      text: `Check-in at Kodai International is from 2:00 PM and check-out by 11:00 AM, ${name}. Early check-in or late check-out can be arranged on request.`,
      actions: [],
      suggestions: ['Request late check-out', 'Arrange a cab', 'Order lunch'],
    };
  }

  // DINING INFO
  if (/\b(restaurant|dining|menu|bar|oasis|smess|orchard|coffee shop|tea kadai|breakfast|hours|open)\b/.test(m)) {
    if (/oasis|bar/.test(m)) {
      return {
        text: `The Oasis Bar is open 5:00 PM – 11:00 PM, ${name}. Cocktails, fine wines, small bites. Beer ₹320/pint, house wine ₹480/glass.`,
        actions: [],
        suggestions: ['Order dinner to the room', 'Reserve a table', 'Bonfire on the lawn tonight'],
      };
    }
    if (/smess/.test(m)) {
      return {
        text: `SMess is our South Indian feast on banana leaves — 25+ varieties, mud-pot firewood cooking. Lunch 12–3:30 PM, dinner 7–10 PM. ₹350 per head.`,
        actions: [],
        suggestions: ['Book SMess for dinner', 'Order thali to the room', "What's at Orchard?"],
      };
    }
    return {
      text: `Dining at Kodai International, ${name}: Orchard Restaurant (multi-cuisine, 7 AM–10:30 PM), SMess (South Indian feast, lunch & dinner), HKI Tea Kadai (7 AM–8 PM), 24hr Coffee Shop (always open), Oasis Bar (5–11 PM).`,
      actions: [],
      suggestions: ['Order dinner to the room', "What's at the Oasis Bar?", 'Book SMess tonight'],
    };
  }

  // NEARBY
  if (/\b(nearby|lake|park|coaker|pillar|falls|berijam|bazaar|market|visit|explore|attraction)\b/.test(m)) {
    for (const [key, [place, time]] of Object.entries(NEARBY)) {
      if (m.includes(key)) {
        return {
          text: `${place} is a ${time} from the hotel, ${name}. Shall I arrange a cab?`,
          actions: [serviceAction('Transport', `Cab enquiry to ${place}`)],
          suggestions: [`Cab to ${place}`, 'What else is nearby?', 'Late check-out request'],
        };
      }
    }
    return {
      text: `From Kodai International, ${name}: Kodaikanal Lake (6 min), Bryant Park (8 min), Coaker's Walk (10 min), Silver Cascade Falls (12 min), Pillar Rocks (20 min), Berijam Lake (45 min — permit needed). Shall I arrange a cab?`,
      actions: [],
      suggestions: ["Cab to Coaker's Walk", 'Cab to Kodaikanal Lake', 'Arrange a cab to the falls'],
    };
  }

  // ACTIVITY / BONFIRE
  if (/\b(bonfire|fire|lawn|evening activity)\b/.test(m)) {
    return {
      text: `The bonfire on the lawn is lit every evening around 7:00 PM, ${name}. The Oasis Bar opens at 5 PM if you'd like a drink beforehand. No reservation needed.`,
      actions: [serviceAction('Activity', 'Bonfire — guest notified')],
      suggestions: ["What's at the Oasis Bar?", 'Order dinner to the room', 'Late check-out request'],
    };
  }

  // WIFI
  if (/\b(wifi|wi-fi|internet|password|network)\b/.test(m)) {
    return {
      text: `High-speed WiFi is complimentary throughout the property, ${name}. The network name and password are in your welcome folder. If you need them, call reception at +91 9944945190.`,
      actions: [],
      suggestions: ['Order a coffee', 'What time is checkout?', 'Order dinner to the room'],
    };
  }

  // ROOM INFO
  if (/\b(room|suite|executive|deluxe|family room|rate|upgrade|price)\b/.test(m)) {
    return {
      text: `We have 5 room types, ${name}: Executive (₹5,000+), Deluxe Double with valley view (₹6,250+), Family Room for 4 (₹7,150+), Jr. Suite with soaking bathtub (₹8,300+), and Suite with jacuzzi & panoramic views (₹10,000+). Call +91 9944945190 for upgrades.`,
      actions: [],
      suggestions: ['Tell me about the Suite', 'Late check-out request', 'Order dinner'],
    };
  }

  // ESCALATION
  if (/\b(speak|staff|manager|reception|front desk|call|phone|human|person)\b/.test(m)) {
    return {
      text: `I'll connect you with a team member now, ${name}. You can also reach reception directly at +91 9944945190 — available 24 hours.`,
      actions: [{ type: 'human_escalation', data: { reason: 'Guest requested assistance' } }],
      suggestions: ['Call +91 9944945190', 'Order dinner to the room', 'Late check-out request'],
    };
  }

  // DEFAULT
  return {
    text: `Happy to help, ${name}. Ask me about dining, room service, nearby attractions, transport, housekeeping, or hotel policies. Reception is at +91 9944945190 round the clock.`,
    actions: [],
    suggestions: ['Order dinner to the room', "Cab to Coaker's Walk", 'What time is checkout?'],
  };
}
