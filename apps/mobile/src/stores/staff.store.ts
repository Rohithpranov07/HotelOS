import { create } from 'zustand';
import { aiApi, ordersApi } from '../lib/api';

export type TaskType = 'food' | 'beverage' | 'housekeeping' | 'laundry' | 'maintenance' | 'concierge';
export type TaskStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TaskItem {
  name: string;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

export interface StaffTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  guest: {
    id: string;
    name: string;
    roomNumber: string;
    loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    phone?: string;
  };
  description: string;
  items?: TaskItem[];
  totalAmount?: number;
  notes?: string | null;
  createdAt: string;
  slaDeadline: string | null;
  assignedToMe: boolean;
  assignedStaffId?: string | null;
  reservationId: string;
  propertyId?: string;
  completionPhotoUrl?: string | null;
}

export interface GuestProfileFull {
  id: string;
  fullName: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalStays: number;
  lifetimeValue: number;
  phone?: string;
  email?: string;
  preferences: {
    dietary?: string[];
    roomTemperature?: number;
    pillowFirmness?: string;
    newspaper?: string;
    floor?: string;
  };
  recentFeedback: Array<{ rating: number; comment: string; date: string }>;
  currentStay: {
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    balanceDue: number;
  } | null;
  activeOrders: Array<{ id: string; description: string; status: string }>;
}

export interface GuestBrief {
  guestId: string;
  brief: string;
  generatedAt: number;
}

interface StaffState {
  tasks: StaffTask[];
  guestProfiles: Record<string, GuestProfileFull>;
  briefs: Record<string, GuestBrief>;
  isLoading: boolean;
  error: string | null;
  filter: { type?: TaskType | 'all'; mine?: boolean };

  fetchTasks: () => Promise<void>;
  setFilter: (f: Partial<{ type?: TaskType | 'all'; mine?: boolean }>) => void;
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    opts?: { notes?: string; completionPhotoUrl?: string },
  ) => Promise<void>;
  fetchGuestProfile: (guestId: string) => Promise<GuestProfileFull | null>;
  fetchGuestBrief: (guestId: string) => Promise<string>;
  applyTaskEvent: (event:
    | { kind: 'new'; task: StaffTask }
    | { kind: 'sla_warning'; taskId: string }
    | { kind: 'sla_breach'; taskId: string }
    | { kind: 'status'; taskId: string; status: TaskStatus }
  ) => void;
}

const TIERS: Array<StaffTask['guest']['loyaltyTier']> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

function priorityForTier(t: StaffTask['guest']['loyaltyTier']): StaffTask['priority'] {
  if (t === 'PLATINUM' || t === 'GOLD') return 'high';
  if (t === 'SILVER') return 'medium';
  return 'low';
}

function demoSeed(): StaffTask[] {
  const now = Date.now();
  const min = 60_000;
  const mk = (
    id: string,
    type: TaskType,
    description: string,
    minsAgo: number,
    slaMins: number,
    guest: StaffTask['guest'],
    extras: Partial<StaffTask> = {},
  ): StaffTask => ({
    id,
    type,
    status: 'pending',
    priority: priorityForTier(guest.loyaltyTier),
    guest,
    description,
    createdAt: new Date(now - minsAgo * min).toISOString(),
    slaDeadline: new Date(now + slaMins * min).toISOString(),
    assignedToMe: false,
    reservationId: `demo-res-${id}`,
    ...extras,
  });
  return [
    mk(
      'demo-task-1',
      'food',
      'Club Sandwich + 2 × Coke',
      4,
      26,
      {
        id: 'demo-guest-1',
        name: 'Priya Mehta',
        roomNumber: '412',
        loyaltyTier: 'GOLD',
        phone: '+91 98765 43210',
      },
      {
        items: [
          { name: 'Club Sandwich', quantity: 1, unit_price: 420 },
          { name: 'Coke', quantity: 2, unit_price: 120 },
        ],
        totalAmount: 660,
      },
    ),
    mk(
      'demo-task-2',
      'housekeeping',
      'Make up room request',
      12,
      18,
      {
        id: 'demo-guest-2',
        name: 'Standard guest',
        roomNumber: '208',
        loyaltyTier: 'BRONZE',
      },
    ),
    mk(
      'demo-task-3',
      'laundry',
      '3 shirts · same-day pickup',
      8,
      52,
      {
        id: 'demo-guest-3',
        name: 'Arjun Rao',
        roomNumber: '1604',
        loyaltyTier: 'PLATINUM',
        phone: '+91 99000 11223',
      },
      { totalAmount: 1100 },
    ),
    mk(
      'demo-task-4',
      'beverage',
      'Bottle of Pinot Noir + 2 glasses',
      2,
      35,
      {
        id: 'demo-guest-4',
        name: 'Hiroshi Tanaka',
        roomNumber: '903',
        loyaltyTier: 'SILVER',
      },
      {
        items: [{ name: 'Pinot Noir', quantity: 1, unit_price: 4200 }],
        totalAmount: 4200,
      },
    ),
  ];
}

function demoGuestProfile(taskGuestId: string, task?: StaffTask): GuestProfileFull {
  const tier = task?.guest.loyaltyTier ?? 'GOLD';
  return {
    id: taskGuestId,
    fullName: task?.guest.name ?? 'Priya Mehta',
    loyaltyTier: tier,
    totalStays: tier === 'PLATINUM' ? 24 : tier === 'GOLD' ? 8 : 3,
    lifetimeValue: tier === 'PLATINUM' ? 980000 : tier === 'GOLD' ? 240000 : 45000,
    phone: task?.guest.phone,
    preferences: {
      dietary: ['vegetarian'],
      roomTemperature: 22,
      pillowFirmness: 'firm',
      newspaper: 'Times of India',
      floor: 'high',
    },
    recentFeedback: [
      { rating: 5, comment: 'F&B team was amazing', date: '2026-04-12' },
      { rating: 4, comment: 'Room was clean and quiet', date: '2026-01-08' },
    ],
    currentStay: task
      ? {
          roomNumber: task.guest.roomNumber,
          checkInDate: '2026-05-26',
          checkOutDate: '2026-05-29',
          balanceDue: 8340,
        }
      : null,
    activeOrders: task
      ? [{ id: task.id, description: task.description, status: task.status }]
      : [],
  };
}

function fallbackBrief(profile: GuestProfileFull): string {
  const dietary = profile.preferences.dietary?.join(', ') ?? 'no dietary notes';
  return (
    `${profile.fullName.split(' ')[0]} is a ${profile.loyaltyTier.toLowerCase()} member on their ` +
    `${profile.totalStays}th stay with lifetime spend ₹${profile.lifetimeValue.toLocaleString('en-IN')}. ` +
    `They prefer high-floor quiet rooms and ${dietary} meals; keep room temp at ${profile.preferences.roomTemperature ?? 22}°C.\n\n` +
    `Greet by name on arrival, confirm pillow preference (${profile.preferences.pillowFirmness ?? 'firm'}), ` +
    `and leave a copy of ${profile.preferences.newspaper ?? 'their preferred paper'} with the turndown. ` +
    `Past feedback highlights the F&B team — flag any new F&B order for white-glove handling.`
  );
}

export const useStaffStore = create<StaffState>((set, get) => ({
  tasks: [],
  guestProfiles: {},
  briefs: {},
  isLoading: false,
  error: null,
  filter: { type: 'all', mine: false },

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await ordersApi.get<{ tasks: StaffTask[] }>('/staff/tasks');
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      set({ tasks, isLoading: false });
    } catch {
      // Backend not reachable — fall back to demo tasks so the screen demos.
      set({ tasks: demoSeed(), isLoading: false });
    }
  },

  setFilter: (f) => set({ filter: { ...get().filter, ...f } }),

  updateTaskStatus: async (taskId, status, opts) => {
    // Optimistic update
    const prev = get().tasks;
    set({
      tasks: prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    });
    try {
      await ordersApi.patch(`/orders/${taskId}/status`, {
        status,
        ...(opts?.notes ? { notes: opts.notes } : {}),
        ...(opts?.completionPhotoUrl ? { completion_photo_url: opts.completionPhotoUrl } : {}),
      });
    } catch (err) {
      // Keep the optimistic update for demo mode; surface the error softly.
      set({ error: err instanceof Error ? err.message : 'Status update failed (offline mode)' });
    }
    // Remove completed/cancelled from active list after a beat.
    if (status === 'completed' || status === 'cancelled') {
      setTimeout(() => {
        set({ tasks: get().tasks.filter((t) => t.id !== taskId) });
      }, 1500);
    }
  },

  fetchGuestProfile: async (guestId) => {
    const cached = get().guestProfiles[guestId];
    if (cached) return cached;
    try {
      const { data } = await ordersApi.get<GuestProfileFull>(`/staff/guests/${guestId}`);
      set({ guestProfiles: { ...get().guestProfiles, [guestId]: data } });
      return data;
    } catch {
      const task = get().tasks.find((t) => t.guest.id === guestId);
      const profile = demoGuestProfile(guestId, task);
      set({ guestProfiles: { ...get().guestProfiles, [guestId]: profile } });
      return profile;
    }
  },

  fetchGuestBrief: async (guestId) => {
    const cached = get().briefs[guestId];
    if (cached && Date.now() - cached.generatedAt < 5 * 60 * 1000) return cached.brief;
    const profile = await get().fetchGuestProfile(guestId);
    if (!profile) return '';
    try {
      const { data } = await aiApi.post<{ brief: string }>('/guest-brief', {
        guest: {
          full_name: profile.fullName,
          loyalty_tier: profile.loyaltyTier.toLowerCase(),
          total_stays: profile.totalStays,
          dietary_flags: profile.preferences.dietary ?? [],
        },
        recent_feedback: profile.recentFeedback,
        preferences: profile.preferences,
      });
      const brief = data?.brief ?? fallbackBrief(profile);
      set({
        briefs: { ...get().briefs, [guestId]: { guestId, brief, generatedAt: Date.now() } },
      });
      return brief;
    } catch {
      const brief = fallbackBrief(profile);
      set({
        briefs: { ...get().briefs, [guestId]: { guestId, brief, generatedAt: Date.now() } },
      });
      return brief;
    }
  },

  applyTaskEvent: (event) => {
    const tasks = get().tasks;
    if (event.kind === 'new') {
      if (tasks.some((t) => t.id === event.task.id)) return;
      set({ tasks: [event.task, ...tasks] });
      return;
    }
    if (event.kind === 'status') {
      set({
        tasks: tasks.map((t) =>
          t.id === event.taskId ? { ...t, status: event.status } : t,
        ),
      });
      return;
    }
    if (event.kind === 'sla_warning' || event.kind === 'sla_breach') {
      set({
        tasks: tasks.map((t) =>
          t.id === event.taskId
            ? {
                ...t,
                priority: event.kind === 'sla_breach' ? 'high' : t.priority,
              }
            : t,
        ),
      });
    }
  },
}));

export { TIERS };
