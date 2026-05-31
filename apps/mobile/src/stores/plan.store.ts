import { create } from 'zustand';
import { storage } from '../lib/storage';

const KEY = 'discover_plan_spot_ids';

function loadInitial(): string[] {
  const raw = storage.getString(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  storage.set(KEY, JSON.stringify(ids));
}

interface PlanState {
  spotIds: string[];
  togglePlan: (id: string) => boolean;
  isPlanned: (id: string) => boolean;
  clearPlan: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  spotIds: loadInitial(),
  togglePlan: (id) => {
    const current = get().spotIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    persist(next);
    set({ spotIds: next });
    return next.includes(id);
  },
  isPlanned: (id) => get().spotIds.includes(id),
  clearPlan: () => {
    persist([]);
    set({ spotIds: [] });
  },
}));
