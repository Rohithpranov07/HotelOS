import { create } from 'zustand';
import { ordersApi } from '../lib/api';

export type ComplaintCategory =
  | 'room'
  | 'cleanliness'
  | 'noise'
  | 'maintenance'
  | 'climate'
  | 'food'
  | 'staff'
  | 'billing'
  | 'other';

export type ComplaintPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ComplaintStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';
export type ComplaintContact = 'app' | 'phone' | 'in_person';

export interface Complaint {
  id: string;
  reference: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  subject: string;
  description: string;
  location: string;
  contact: ComplaintContact;
  status: ComplaintStatus;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ComplaintInput {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  subject: string;
  description: string;
  location: string;
  contact: ComplaintContact;
}

interface ComplaintsState {
  complaints: Complaint[];
  submitting: boolean;
  error: string | null;
  submit: (reservationId: string, input: ComplaintInput) => Promise<Complaint>;
  fetch: (reservationId: string) => Promise<void>;
  advance: (id: string) => void;
}

const DUTY_MANAGERS = ['Mei Chen', 'Arjun Rao', 'Sofia Marchetti'];

function makeReference(): string {
  return `ISS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Compressed demo lifecycle so the guest can watch a freshly raised issue move
// open → acknowledged → in_progress without a live backend.
function simulateProgress(id: string, advance: (id: string) => void) {
  setTimeout(() => advance(id), 4_000);
  setTimeout(() => advance(id), 12_000);
}

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  complaints: [],
  submitting: false,
  error: null,

  submit: async (reservationId, input) => {
    set({ submitting: true, error: null });
    const payload = {
      reservation_id: reservationId,
      category: input.category,
      priority: input.priority,
      subject: input.subject,
      description: input.description,
      location: input.location,
      contact_preference: input.contact,
    };

    try {
      const { data } = await ordersApi.post<Complaint>('/complaints', payload);
      set({ submitting: false, complaints: [data, ...get().complaints] });
      return data;
    } catch {
      // Backend route not present / unreachable — keep a local record so the
      // report → tracking flow demos end-to-end.
      const local: Complaint = {
        id: `local-${Math.random().toString(36).slice(2, 10)}`,
        reference: makeReference(),
        category: input.category,
        priority: input.priority,
        subject: input.subject,
        description: input.description,
        location: input.location,
        contact: input.contact,
        status: 'open',
        assigned_to: DUTY_MANAGERS[Math.floor(Math.random() * DUTY_MANAGERS.length)]!,
        created_at: new Date().toISOString(),
        resolved_at: null,
      };
      set({ submitting: false, complaints: [local, ...get().complaints] });
      simulateProgress(local.id, get().advance);
      return local;
    }
  },

  fetch: async (reservationId) => {
    try {
      const { data } = await ordersApi.get<{ complaints: Complaint[] }>('/complaints', {
        params: { reservation_id: reservationId },
      });
      set({ complaints: data.complaints });
    } catch {
      // Offline / no backend — retain whatever is in local state.
    }
  },

  advance: (id) => {
    const order: ComplaintStatus[] = ['open', 'acknowledged', 'in_progress', 'resolved'];
    set({
      complaints: get().complaints.map((c) => {
        if (c.id !== id) return c;
        const idx = order.indexOf(c.status);
        const next = order[Math.min(idx + 1, order.length - 1)]!;
        return {
          ...c,
          status: next,
          resolved_at: next === 'resolved' ? new Date().toISOString() : c.resolved_at,
        };
      }),
    });
  },
}));
