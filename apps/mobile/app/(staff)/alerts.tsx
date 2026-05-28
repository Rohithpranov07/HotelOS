import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useStaffStore } from '../../src/stores/staff.store';
import { getSlaRemainingMinutes } from '../../src/components/staff/SlaCountdown';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

interface AlertRow {
  id: string;
  severity: 'breach' | 'warning' | 'info';
  title: string;
  body: string;
  taskId?: string;
  guestId?: string;
}

export default function StaffAlertsScreen() {
  useLuxeFonts();
  const router = useRouter();
  const tasks = useStaffStore((s) => s.tasks);
  const logout = useAuthStore((s) => s.logout);

  const alerts = useMemo<AlertRow[]>(() => {
    const out: AlertRow[] = [];
    for (const t of tasks) {
      const remaining = getSlaRemainingMinutes(t.slaDeadline);
      if (remaining === null) continue;
      if (remaining < 0) {
        out.push({
          id: `breach-${t.id}`,
          severity: 'breach',
          title: `SLA breached · ${t.type}`,
          body: `${t.guest.name} · Room ${t.guest.roomNumber} · ${t.description}`,
          taskId: t.id,
        });
      } else if (remaining < 10) {
        out.push({
          id: `warn-${t.id}`,
          severity: 'warning',
          title: `SLA warning · ${remaining}m left`,
          body: `${t.guest.name} · Room ${t.guest.roomNumber} · ${t.description}`,
          taskId: t.id,
        });
      }
    }
    return out;
  }, [tasks]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Alerts · Manager view</Text>
          <Text style={styles.title}>
            {alerts.length === 0 ? 'All systems calm' : `${alerts.length} live`}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {alerts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color={Luxe.gold} />
              <Text style={styles.emptyTitle}>No active alerts.</Text>
              <Text style={styles.emptySub}>SLA warnings and breaches will appear here.</Text>
            </View>
          ) : (
            alerts.map((a) => (
              <Pressable
                key={a.id}
                onPress={() =>
                  a.taskId
                    ? router.push({ pathname: '/(staff)/task', params: { id: a.taskId } })
                    : null
                }
                style={[
                  styles.alertCard,
                  a.severity === 'breach' && styles.alertBreach,
                  a.severity === 'warning' && styles.alertWarning,
                ]}
              >
                <View style={styles.alertHeader}>
                  <Ionicons
                    name={a.severity === 'breach' ? 'alert-circle' : 'warning-outline'}
                    size={16}
                    color={a.severity === 'breach' ? '#E27A6E' : Luxe.amberGlow}
                  />
                  <Text
                    style={[
                      styles.alertTitle,
                      a.severity === 'breach' && { color: '#E27A6E' },
                    ]}
                  >
                    {a.title}
                  </Text>
                </View>
                <Text style={styles.alertBody}>{a.body}</Text>
              </Pressable>
            ))
          )}

          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={Luxe.ivoryDim} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 140 },
  empty: { paddingTop: 80, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivoryDim },
  emptySub: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.muted,
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
    letterSpacing: 1.4,
    color: Luxe.amberGlow,
    textTransform: 'uppercase',
  },
  alertBody: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivoryDim, lineHeight: 20 },
  logoutBtn: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
  },
  logoutText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
});
