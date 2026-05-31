// Shift handover summary — calls the AI service when reachable, falls back to a
// deterministic local summary so the demo always produces something useful.

import { aiApi } from './api';
import type { StaffTask, NegativeFeedbackPing } from '../stores/staff.store';
import type { VipArrival, MaintenanceFlag, InventoryItem } from '../stores/ops.store';
import { isLowStock } from '../stores/ops.store';

export interface HandoverContext {
  staffName: string;
  role: string;
  shiftStartedAt: string | null;
  tasks: StaffTask[];
  completedTodayIds: string[];
  negativeFeedback: NegativeFeedbackPing[];
  vipArrivals: VipArrival[];
  maintenance: MaintenanceFlag[];
  inventory: InventoryItem[];
}

function pluralise(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function localSummary(ctx: HandoverContext): string {
  const pending = ctx.tasks.filter((t) => t.status === 'pending' || t.status === 'accepted').length;
  const inProgress = ctx.tasks.filter((t) => t.status === 'in_progress').length;
  const breached = ctx.tasks.filter((t) => {
    if (!t.slaDeadline) return false;
    return new Date(t.slaDeadline).getTime() < Date.now();
  }).length;
  const completed = ctx.completedTodayIds.length;
  const negCount = ctx.negativeFeedback.filter((n) => !n.acknowledged).length;
  const vipCount = ctx.vipArrivals.filter((v) => !v.acknowledged).length;
  const lowStock = ctx.inventory.filter(isLowStock);
  const iotFlags = ctx.maintenance.filter((m) => m.severity !== 'low').length;

  const headline =
    breached > 0
      ? `${pluralise(breached, 'task is', 'tasks are')} past SLA — clear these first.`
      : pending > 0
        ? `${pluralise(pending, 'task is', 'tasks are')} waiting; ${inProgress} mid-flight.`
        : 'Floor is quiet. Use the window for prep work.';

  const lines: string[] = [];
  lines.push(headline);

  if (negCount > 0) {
    const sample = ctx.negativeFeedback.find((n) => !n.acknowledged);
    lines.push(
      `${pluralise(negCount, 'guest is', 'guests are')} flagged as upset` +
        (sample?.comment ? ` — latest: "${sample.comment.slice(0, 90)}".` : '.'),
    );
  }

  if (vipCount > 0) {
    const next = [...ctx.vipArrivals]
      .filter((v) => !v.acknowledged)
      .sort((a, b) => new Date(a.expectedAt).getTime() - new Date(b.expectedAt).getTime())[0];
    if (next) {
      const mins = Math.max(
        0,
        Math.round((new Date(next.expectedAt).getTime() - Date.now()) / 60_000),
      );
      lines.push(
        `Watch for ${next.guestName} (${next.tier}, Room ${next.roomNumber}) in ~${mins}m.`,
      );
    }
  }

  if (lowStock.length > 0) {
    lines.push(
      `Low stock: ${lowStock
        .slice(0, 3)
        .map((i) => `${i.name} (${i.onHand}/${i.par})`)
        .join('; ')}.`,
    );
  }

  if (iotFlags > 0) {
    lines.push(
      `${pluralise(iotFlags, 'maintenance flag', 'maintenance flags')} need triage from engineering.`,
    );
  }

  lines.push(
    `Wins on this shift: ${pluralise(completed, 'task completed', 'tasks completed')}. ` +
      `Hand off cleanly and brief the next ${ctx.role.replace('_', ' ')} lead.`,
  );

  return lines.join(' ');
}

export async function generateShiftHandover(ctx: HandoverContext): Promise<{
  summary: string;
  source: 'ai' | 'local';
}> {
  const fallback = localSummary(ctx);

  const payload = {
    staff: { full_name: ctx.staffName, role: ctx.role },
    shift_started_at: ctx.shiftStartedAt,
    tasks_open: ctx.tasks.length,
    tasks_completed_today: ctx.completedTodayIds.length,
    negative_feedback: ctx.negativeFeedback.slice(0, 5).map((n) => ({
      guest: n.guestName,
      room: n.roomNumber,
      score: n.overallScore,
      comment: n.comment,
    })),
    vip_arrivals: ctx.vipArrivals.map((v) => ({
      guest: v.guestName,
      tier: v.tier,
      room: v.roomNumber,
      expected_at: v.expectedAt,
      notes: v.notes,
    })),
    inventory_low: ctx.inventory.filter(isLowStock).map((i) => ({
      name: i.name,
      on_hand: i.onHand,
      par: i.par,
    })),
    maintenance_flags: ctx.maintenance.map((m) => ({
      asset: m.asset,
      zone: m.zone,
      severity: m.severity,
      signal: m.signal,
    })),
  };

  try {
    const { data } = await aiApi.post<{ summary?: string }>('/shift-handover', payload);
    if (data?.summary) return { summary: data.summary, source: 'ai' };
    return { summary: fallback, source: 'local' };
  } catch {
    return { summary: fallback, source: 'local' };
  }
}
