// Operations store — backs the manager-facing analytics screen, low-inventory and
// predictive-maintenance alerts, the VIP arrivals feed, and the AI shift-handover
// summary. Everything here is demo-data driven so the screens stay rich even when
// no backend is reachable; the same shape is what the eventual /api/v1/ops
// endpoints will return.

import { create } from 'zustand';

export type InventoryCategory = 'amenities' | 'laundry' | 'minibar' | 'cleaning';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  onHand: number;
  par: number; // reorder threshold
  perStayBurn: number; // rough demo metric
}

export interface MaintenanceFlag {
  id: string;
  source: 'iot' | 'ai' | 'manual';
  severity: 'low' | 'medium' | 'high';
  zone: string;
  asset: string;
  signal: string;
  detectedAt: string;
}

export interface VipArrival {
  id: string;
  guestId: string;
  guestName: string;
  tier: 'GOLD' | 'PLATINUM';
  roomNumber: string;
  expectedAt: string;
  notes?: string;
  acknowledged: boolean;
}

export interface LeaderboardRow {
  staffId: string;
  fullName: string;
  role: string;
  tasksCompleted: number;
  avgRatingX10: number; // ×10 to avoid float compare; 47 → 4.7
  slaCompliancePct: number;
  breaches: number;
}

export interface FbDepartmentRow {
  department: string;
  orders: number;
  revenue: number;
}

export interface AnomalyFlag {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  detectedAt: string;
}

export interface AnalyticsSnapshot {
  occupancy: {
    occupiedRooms: number;
    totalRooms: number;
    pct: number;
    delta24h: number; // percentage-point change vs. 24h ago
  };
  revenueToday: number;
  revenueSameDayLastYear: number;
  adr: number; // average daily rate
  revpar: number;
  fbByDepartment: FbDepartmentRow[];
  leaderboard: LeaderboardRow[];
  anomalies: AnomalyFlag[];
  generatedAt: string;
}

interface OpsState {
  inventory: InventoryItem[];
  maintenance: MaintenanceFlag[];
  vipArrivals: VipArrival[];
  analytics: AnalyticsSnapshot;
  lastHandoverSummary: string | null;
  lastHandoverAt: string | null;

  acknowledgeVip: (id: string) => void;
  adjustInventory: (id: string, delta: number) => void;
  dismissMaintenance: (id: string) => void;
  setHandoverSummary: (summary: string) => void;
}

function isoMinutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function seedInventory(): InventoryItem[] {
  return [
    { id: 'inv-towels', name: 'Bath towels', category: 'laundry', unit: 'pcs', onHand: 28, par: 80, perStayBurn: 3 },
    { id: 'inv-robes', name: 'Bathrobes', category: 'laundry', unit: 'pcs', onHand: 9, par: 40, perStayBurn: 1.2 },
    { id: 'inv-amenity-kit', name: 'Signature amenity kit', category: 'amenities', unit: 'kits', onHand: 14, par: 30, perStayBurn: 1 },
    { id: 'inv-slippers', name: 'Slippers', category: 'amenities', unit: 'pairs', onHand: 62, par: 60, perStayBurn: 2 },
    { id: 'inv-mini-pinot', name: 'Pinot Noir 187ml', category: 'minibar', unit: 'btls', onHand: 4, par: 20, perStayBurn: 0.4 },
    { id: 'inv-cleaner', name: 'Marble-safe cleaner', category: 'cleaning', unit: 'L', onHand: 11, par: 10, perStayBurn: 0.3 },
  ];
}

function seedMaintenance(): MaintenanceFlag[] {
  return [
    {
      id: 'mnt-ac-1204',
      source: 'iot',
      severity: 'high',
      zone: 'Floor 12',
      asset: 'Room 1204 — AC unit',
      signal: 'Return-air ΔT > 9°C for 42 min · compressor stress likely',
      detectedAt: isoMinutesAgo(34),
    },
    {
      id: 'mnt-water-7',
      source: 'iot',
      severity: 'medium',
      zone: 'Floor 7',
      asset: 'Riser 7B — water pressure',
      signal: 'Pressure 1.2 bar (target 2.4) · 11 min of low-flow events',
      detectedAt: isoMinutesAgo(12),
    },
    {
      id: 'mnt-lift-spa',
      source: 'ai',
      severity: 'low',
      zone: 'Spa wing',
      asset: 'Lift B — door sensor',
      signal: 'Door-reverse rate up 4× over 7d trailing mean',
      detectedAt: isoMinutesAgo(180),
    },
  ];
}

function seedVipArrivals(): VipArrival[] {
  return [
    {
      id: 'vip-arr-1',
      guestId: 'demo-guest-3',
      guestName: 'Arjun Rao',
      tier: 'PLATINUM',
      roomNumber: '1604',
      expectedAt: new Date(Date.now() + 45 * 60_000).toISOString(),
      notes: '8th stay this year · prefers in-suite check-in',
      acknowledged: false,
    },
    {
      id: 'vip-arr-2',
      guestId: 'demo-guest-1',
      guestName: 'Priya Mehta',
      tier: 'GOLD',
      roomNumber: '412',
      expectedAt: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
      notes: 'Vegetarian set-up · Times of India on arrival',
      acknowledged: false,
    },
  ];
}

function seedAnalytics(): AnalyticsSnapshot {
  return {
    occupancy: { occupiedRooms: 142, totalRooms: 168, pct: 84.5, delta24h: +3.2 },
    revenueToday: 1_482_400,
    revenueSameDayLastYear: 1_312_100,
    adr: 11_240,
    revpar: 9_498,
    fbByDepartment: [
      { department: 'In-room dining', orders: 58, revenue: 184_300 },
      { department: 'All-day diner', orders: 92, revenue: 312_540 },
      { department: 'Specialty', orders: 24, revenue: 198_220 },
      { department: 'Bar & lounge', orders: 41, revenue: 142_080 },
    ],
    leaderboard: [
      { staffId: 'st-1', fullName: 'Ravi Kumar', role: 'Room Service', tasksCompleted: 24, avgRatingX10: 49, slaCompliancePct: 96, breaches: 1 },
      { staffId: 'st-2', fullName: 'Mei Chen', role: 'Housekeeping', tasksCompleted: 19, avgRatingX10: 48, slaCompliancePct: 94, breaches: 1 },
      { staffId: 'st-3', fullName: 'Hiroshi Tanaka', role: 'Concierge', tasksCompleted: 12, avgRatingX10: 50, slaCompliancePct: 100, breaches: 0 },
      { staffId: 'st-4', fullName: 'Lena Park', role: 'Front Desk', tasksCompleted: 17, avgRatingX10: 46, slaCompliancePct: 88, breaches: 2 },
      { staffId: 'st-5', fullName: 'Diego Alvarez', role: 'Housekeeping', tasksCompleted: 14, avgRatingX10: 44, slaCompliancePct: 82, breaches: 3 },
    ],
    anomalies: [
      {
        id: 'an-1',
        title: 'In-room dining tickets +38% on floor 14',
        body: 'Order volume from floor 14 jumped vs trailing 14-day mean — possible group booking under-served at All-day diner.',
        severity: 'warning',
        detectedAt: isoMinutesAgo(22),
      },
      {
        id: 'an-2',
        title: 'Housekeeping SLA dip — evening shift',
        body: 'Average completion time up 8 min over the last 3 evenings on floors 9–11. Worth a staffing check.',
        severity: 'info',
        detectedAt: isoMinutesAgo(95),
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

export const useOpsStore = create<OpsState>((set, get) => ({
  inventory: seedInventory(),
  maintenance: seedMaintenance(),
  vipArrivals: seedVipArrivals(),
  analytics: seedAnalytics(),
  lastHandoverSummary: null,
  lastHandoverAt: null,

  acknowledgeVip: (id) =>
    set({
      vipArrivals: get().vipArrivals.map((v) =>
        v.id === id ? { ...v, acknowledged: true } : v,
      ),
    }),

  adjustInventory: (id, delta) =>
    set({
      inventory: get().inventory.map((i) =>
        i.id === id ? { ...i, onHand: Math.max(0, i.onHand + delta) } : i,
      ),
    }),

  dismissMaintenance: (id) =>
    set({ maintenance: get().maintenance.filter((m) => m.id !== id) }),

  setHandoverSummary: (summary) =>
    set({ lastHandoverSummary: summary, lastHandoverAt: new Date().toISOString() }),
}));

export function isLowStock(item: InventoryItem): boolean {
  return item.onHand < item.par * 0.4;
}
