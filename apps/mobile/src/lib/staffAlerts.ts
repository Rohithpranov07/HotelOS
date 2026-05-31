// Single source of truth for what appears on the staff Alerts surface.
// Merges signals from: live tasks (SLA), guest feedback (negative sentiment),
// VIP arrivals, inventory levels, and predictive-maintenance flags.
// Pure functions — no store reads — so callers stay reactive to their own selectors.

import type { StaffTask, NegativeFeedbackPing } from '../stores/staff.store';
import type { InventoryItem, MaintenanceFlag, VipArrival } from '../stores/ops.store';
import { isLowStock } from '../stores/ops.store';

export type AlertSeverity = 'breach' | 'warning' | 'info';
export type AlertKind = 'sla' | 'feedback' | 'vip' | 'inventory' | 'maintenance';

export interface StaffAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  body: string;
  detectedAt: string;
  // Optional navigation hints — consumers map these to expo-router pushes.
  taskId?: string;
  guestId?: string;
  inventoryId?: string;
  maintenanceId?: string;
  feedbackId?: string;
  vipId?: string;
}

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

function relativeTimestamp(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h === 1 ? '1h ago' : `${h}h ago`;
}

function slaAlertsFromTasks(tasks: StaffTask[]): StaffAlert[] {
  const out: StaffAlert[] = [];
  for (const t of tasks) {
    if (!t.slaDeadline) continue;
    if (t.status === 'completed' || t.status === 'cancelled') continue;
    const remaining = minutesUntil(t.slaDeadline);
    if (remaining < 0) {
      out.push({
        id: `sla-breach-${t.id}`,
        kind: 'sla',
        severity: 'breach',
        title: `SLA breached · ${t.type}`,
        body: `${t.guest.name} · Room ${t.guest.roomNumber} · ${t.description}`,
        detectedAt: t.slaDeadline,
        taskId: t.id,
        guestId: t.guest.id,
      });
    } else if (remaining < 10) {
      out.push({
        id: `sla-warn-${t.id}`,
        kind: 'sla',
        severity: 'warning',
        title: `SLA warning · ${remaining}m left`,
        body: `${t.guest.name} · Room ${t.guest.roomNumber} · ${t.description}`,
        detectedAt: new Date().toISOString(),
        taskId: t.id,
        guestId: t.guest.id,
      });
    }
  }
  return out;
}

function feedbackAlerts(pings: NegativeFeedbackPing[]): StaffAlert[] {
  return pings
    .filter((p) => !p.acknowledged)
    .map((p) => ({
      id: `fb-${p.id}`,
      kind: 'feedback' as const,
      severity: p.overallScore <= 2 ? ('breach' as const) : ('warning' as const),
      title: `Negative feedback · ${p.overallScore}/5`,
      body: p.comment
        ? `${p.guestName} · Room ${p.roomNumber} — “${p.comment.slice(0, 110)}${p.comment.length > 110 ? '…' : ''}”`
        : `${p.guestName} · Room ${p.roomNumber} flagged service quality.`,
      detectedAt: p.receivedAt,
      feedbackId: p.id,
    }));
}

function vipAlerts(arrivals: VipArrival[]): StaffAlert[] {
  return arrivals
    .filter((v) => !v.acknowledged)
    .map((v) => {
      const mins = minutesUntil(v.expectedAt);
      const when = mins <= 0 ? 'arriving now' : `arrives in ${mins}m`;
      return {
        id: `vip-${v.id}`,
        kind: 'vip' as const,
        severity: (mins <= 30 ? 'warning' : 'info') as AlertSeverity,
        title: `${v.tier} arrival · Room ${v.roomNumber}`,
        body: `${v.guestName} ${when}${v.notes ? ` — ${v.notes}` : ''}`,
        detectedAt: v.expectedAt,
        vipId: v.id,
        guestId: v.guestId,
      };
    });
}

function inventoryAlerts(items: InventoryItem[]): StaffAlert[] {
  return items.filter(isLowStock).map((i) => {
    const pctOfPar = Math.round((i.onHand / i.par) * 100);
    return {
      id: `inv-${i.id}`,
      kind: 'inventory' as const,
      severity: (pctOfPar < 20 ? 'breach' : 'warning') as AlertSeverity,
      title: `Low stock · ${i.name}`,
      body: `${i.onHand} ${i.unit} on hand · par ${i.par} (${pctOfPar}%)`,
      detectedAt: new Date().toISOString(),
      inventoryId: i.id,
    };
  });
}

function maintenanceAlerts(flags: MaintenanceFlag[]): StaffAlert[] {
  return flags.map((m) => ({
    id: `mnt-${m.id}`,
    kind: 'maintenance' as const,
    severity: (m.severity === 'high' ? 'breach' : m.severity === 'medium' ? 'warning' : 'info') as AlertSeverity,
    title: `${m.source.toUpperCase()} · ${m.asset}`,
    body: `${m.zone} — ${m.signal} · detected ${relativeTimestamp(m.detectedAt)}`,
    detectedAt: m.detectedAt,
    maintenanceId: m.id,
  }));
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { breach: 0, warning: 1, info: 2 };

export interface AlertSources {
  tasks: StaffTask[];
  negativeFeedback: NegativeFeedbackPing[];
  vipArrivals: VipArrival[];
  inventory: InventoryItem[];
  maintenance: MaintenanceFlag[];
}

export function buildStaffAlerts(sources: AlertSources): StaffAlert[] {
  const merged: StaffAlert[] = [
    ...slaAlertsFromTasks(sources.tasks),
    ...feedbackAlerts(sources.negativeFeedback),
    ...vipAlerts(sources.vipArrivals),
    ...inventoryAlerts(sources.inventory),
    ...maintenanceAlerts(sources.maintenance),
  ];
  return merged.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });
}

export function summarizeAlertCounts(alerts: StaffAlert[]): {
  total: number;
  breach: number;
  warning: number;
  info: number;
  byKind: Record<AlertKind, number>;
} {
  const byKind: Record<AlertKind, number> = {
    sla: 0,
    feedback: 0,
    vip: 0,
    inventory: 0,
    maintenance: 0,
  };
  let breach = 0;
  let warning = 0;
  let info = 0;
  for (const a of alerts) {
    byKind[a.kind] += 1;
    if (a.severity === 'breach') breach += 1;
    else if (a.severity === 'warning') warning += 1;
    else info += 1;
  }
  return { total: alerts.length, breach, warning, info, byKind };
}

export function alertKindLabel(kind: AlertKind): string {
  switch (kind) {
    case 'sla': return 'SLA';
    case 'feedback': return 'Feedback';
    case 'vip': return 'VIP arrival';
    case 'inventory': return 'Inventory';
    case 'maintenance': return 'Maintenance';
  }
}
