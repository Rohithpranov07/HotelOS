import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useStaffStore } from '../../src/stores/staff.store';
import { useOpsStore } from '../../src/stores/ops.store';
import { canSeeAlerts } from '../../src/lib/staffRoles';
import {
  alertKindLabel,
  buildStaffAlerts,
  summarizeAlertCounts,
  type AlertKind,
  type StaffAlert,
} from '../../src/lib/staffAlerts';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const KIND_ICON: Record<AlertKind, keyof typeof Ionicons.glyphMap> = {
  sla: 'timer-outline',
  feedback: 'chatbubble-ellipses-outline',
  vip: 'star-outline',
  inventory: 'cube-outline',
  maintenance: 'construct-outline',
};

const FILTERS: Array<{ key: 'all' | AlertKind; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'sla', label: 'SLA' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'vip', label: 'VIP' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'maintenance', label: 'Maintenance' },
];

export default function StaffAlertsScreen() {
  useLuxeFonts();
  const router = useRouter();
  const staffUser = useAuthStore((s) => s.staffUser);

  const tasks = useStaffStore((s) => s.tasks);
  const negativeFeedback = useStaffStore((s) => s.negativeFeedback);
  const acknowledgeNegativeFeedback = useStaffStore((s) => s.acknowledgeNegativeFeedback);

  const vipArrivals = useOpsStore((s) => s.vipArrivals);
  const inventory = useOpsStore((s) => s.inventory);
  const maintenance = useOpsStore((s) => s.maintenance);
  const acknowledgeVip = useOpsStore((s) => s.acknowledgeVip);
  const dismissMaintenance = useOpsStore((s) => s.dismissMaintenance);

  const [filter, setFilter] = useState<'all' | AlertKind>('all');

  if (!canSeeAlerts(staffUser?.role)) {
    return <Redirect href="/(staff)/home" />;
  }

  const alerts = useMemo(
    () => buildStaffAlerts({ tasks, negativeFeedback, vipArrivals, inventory, maintenance }),
    [tasks, negativeFeedback, vipArrivals, inventory, maintenance],
  );
  const counts = useMemo(() => summarizeAlertCounts(alerts), [alerts]);

  const visible = useMemo(
    () => (filter === 'all' ? alerts : alerts.filter((a) => a.kind === filter)),
    [alerts, filter],
  );

  const handlePress = (a: StaffAlert) => {
    if (a.taskId) {
      router.push({ pathname: '/(staff)/task', params: { id: a.taskId } });
    } else if (a.guestId && a.kind !== 'vip') {
      router.push({ pathname: '/(staff)/guest', params: { id: a.guestId } });
    } else if (a.vipId) {
      acknowledgeVip(a.vipId);
    } else if (a.maintenanceId) {
      dismissMaintenance(a.maintenanceId);
    } else if (a.feedbackId) {
      acknowledgeNegativeFeedback(a.feedbackId);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Alerts · Manager view</Text>
          <Text style={styles.title}>
            {counts.total === 0 ? 'All systems calm' : `${counts.total} live`}
          </Text>
          <View style={styles.statRow}>
            <Stat label="Breach" value={counts.breach} tint="#E27A6E" />
            <Stat label="Warning" value={counts.warning} tint={Luxe.amberGlow} />
            <Stat label="Info" value={counts.info} tint={Luxe.ivoryDim} />
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n = f.key === 'all' ? counts.total : counts.byKind[f.key];
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label} · {n}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {visible.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color={Luxe.gold} />
              <Text style={styles.emptyTitle}>No alerts in this view.</Text>
              <Text style={styles.emptySub}>
                Real-time signals from SLA timers, guest sentiment, VIP arrivals,
                inventory and IoT maintenance will surface here.
              </Text>
            </View>
          ) : (
            visible.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => handlePress(a)}
                style={[
                  styles.alertCard,
                  a.severity === 'breach' && styles.alertBreach,
                  a.severity === 'warning' && styles.alertWarning,
                ]}
              >
                <View style={styles.alertHeader}>
                  <Ionicons
                    name={KIND_ICON[a.kind]}
                    size={14}
                    color={
                      a.severity === 'breach'
                        ? '#E27A6E'
                        : a.severity === 'warning'
                          ? Luxe.amberGlow
                          : Luxe.ivoryDim
                    }
                  />
                  <Text
                    style={[
                      styles.alertTitle,
                      a.severity === 'breach' && { color: '#E27A6E' },
                    ]}
                  >
                    {a.title}
                  </Text>
                  <Text style={styles.kindChip}>{alertKindLabel(a.kind).toUpperCase()}</Text>
                </View>
                <Text style={styles.alertBody}>{a.body}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: value > 0 ? tint : Luxe.muted }]}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  header: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 8 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 38,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  statRow: { flexDirection: 'row', gap: 18, marginTop: 14 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Luxe.titanium,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(244,201,126,0.16)',
    borderColor: 'rgba(244,201,126,0.40)',
  },
  filterText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.3,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
  filterTextActive: { color: Luxe.goldBright },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 },
  empty: { paddingTop: 80, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivoryDim },
  emptySub: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.0,
    color: Luxe.muted,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 16,
  },
  alertCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
  },
  alertBreach: { borderColor: '#E27A6E' },
  alertWarning: { borderColor: 'rgba(244,201,126,0.4)' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertTitle: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.3,
    color: Luxe.amberGlow,
    textTransform: 'uppercase',
    flex: 1,
  },
  kindChip: {
    fontFamily: LuxeFonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Luxe.muted,
  },
  alertBody: { fontFamily: LuxeFonts.sans, fontSize: 13.5, color: Luxe.ivoryDim, lineHeight: 20 },
});
