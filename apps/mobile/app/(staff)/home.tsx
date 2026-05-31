import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/auth.store';
import { useStaffStore } from '../../src/stores/staff.store';
import { useOpsStore } from '../../src/stores/ops.store';
import { getSlaRemainingMinutes } from '../../src/components/staff/SlaCountdown';
import { allowedTaskTypes, canSeeAlerts, roleLabel } from '../../src/lib/staffRoles';
import { buildStaffAlerts, alertKindLabel } from '../../src/lib/staffAlerts';
import { generateShiftHandover } from '../../src/lib/shiftHandover';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function StaffHomeScreen() {
  useLuxeFonts();
  const router = useRouter();

  const staffUser = useAuthStore((s) => s.staffUser);
  const logout = useAuthStore((s) => s.logout);

  const tasks = useStaffStore((s) => s.tasks);
  const fetchTasks = useStaffStore((s) => s.fetchTasks);
  const completedTodayIds = useStaffStore((s) => s.completedTodayIds);
  const onShift = useStaffStore((s) => s.onShift);
  const setOnShift = useStaffStore((s) => s.setOnShift);
  const shiftStartedAt = useStaffStore((s) => s.shiftStartedAt);

  useEffect(() => {
    if (tasks.length === 0) fetchTasks();
  }, [tasks.length, fetchTasks]);

  const allowedSet = useMemo(
    () => new Set(allowedTaskTypes(staffUser?.role)),
    [staffUser?.role],
  );
  const scopedTasks = useMemo(
    () => tasks.filter((t) => allowedSet.has(t.type)),
    [tasks, allowedSet],
  );

  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let critical = 0;
    let breached = 0;
    for (const t of scopedTasks) {
      if (t.status === 'pending') pending += 1;
      if (t.status === 'accepted' || t.status === 'in_progress') inProgress += 1;
      const rem = getSlaRemainingMinutes(t.slaDeadline);
      if (rem !== null) {
        if (rem < 0) breached += 1;
        else if (rem < 10) critical += 1;
      }
    }
    return { pending, inProgress, critical, breached, completed: completedTodayIds.length };
  }, [scopedTasks, completedTodayIds.length]);

  const negativeFeedback = useStaffStore((s) => s.negativeFeedback);
  const vipArrivals = useOpsStore((s) => s.vipArrivals);
  const inventory = useOpsStore((s) => s.inventory);
  const maintenance = useOpsStore((s) => s.maintenance);

  const topAlerts = useMemo(() => {
    // Managers see the full alert mix; line staff see only SLA tasks they own.
    const managerView = canSeeAlerts(staffUser?.role);
    if (managerView) {
      return buildStaffAlerts({
        tasks: scopedTasks,
        negativeFeedback,
        vipArrivals,
        inventory,
        maintenance,
      }).slice(0, 3);
    }
    return scopedTasks
      .map((t) => ({ t, rem: getSlaRemainingMinutes(t.slaDeadline) }))
      .filter((x) => x.rem !== null && x.rem < 15)
      .sort((a, b) => (a.rem ?? 0) - (b.rem ?? 0))
      .slice(0, 2)
      .map(({ t, rem }) => ({
        id: `home-sla-${t.id}`,
        kind: 'sla' as const,
        severity: ((rem ?? 0) < 0 ? 'breach' : 'warning') as 'breach' | 'warning',
        title: (rem ?? 0) < 0 ? `SLA BREACHED ${Math.abs(rem ?? 0)}M` : `${rem}M LEFT`,
        body: `${t.guest.name} · Room ${t.guest.roomNumber} — ${t.description}`,
        taskId: t.id,
      }));
  }, [scopedTasks, negativeFeedback, vipArrivals, inventory, maintenance, staffUser?.role]);

  const showAlertsTab = canSeeAlerts(staffUser?.role);
  const roleName = roleLabel(staffUser?.role);
  const firstName = (staffUser?.fullName ?? 'Team').split(' ')[0];

  const [handoverOpen, setHandoverOpen] = useState(false);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverSummary, setHandoverSummary] = useState<string | null>(null);
  const [handoverSource, setHandoverSource] = useState<'ai' | 'local'>('local');

  const buildHandover = useCallback(async () => {
    setHandoverOpen(true);
    setHandoverLoading(true);
    setHandoverSummary(null);
    try {
      const { summary, source } = await generateShiftHandover({
        staffName: staffUser?.fullName ?? 'Team',
        role: staffUser?.role ?? 'staff',
        shiftStartedAt,
        tasks,
        completedTodayIds,
        negativeFeedback,
        vipArrivals,
        maintenance,
        inventory,
      });
      setHandoverSummary(summary);
      setHandoverSource(source);
    } finally {
      setHandoverLoading(false);
    }
  }, [
    staffUser?.fullName,
    staffUser?.role,
    shiftStartedAt,
    tasks,
    completedTodayIds,
    negativeFeedback,
    vipArrivals,
    maintenance,
    inventory,
  ]);

  const shareHandover = useCallback(async () => {
    if (!handoverSummary) return;
    try {
      await Share.share({
        message:
          `Shift handover — ${roleName} · ${firstName}\n\n${handoverSummary}\n\nGenerated ${new Date().toLocaleString()}`,
      });
    } catch {
      // user cancelled share — nothing to do
    }
  }, [handoverSummary, roleName, firstName]);
  const shiftDuration = shiftStartedAt ? humanDuration(Date.now() - new Date(shiftStartedAt).getTime()) : '—';

  const confirmLogout = () => {
    Alert.alert('End session?', 'You will be signed out of the staff app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Staff Console</Text>
            <Text style={styles.title}>{greeting()},</Text>
            <Text style={[styles.title, styles.titleItalic]}>{firstName}.</Text>
            <View style={styles.identityRow}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{roleName.toUpperCase()}</Text>
              </View>
              <Text style={styles.identityMeta} numberOfLines={1}>
                Property · {staffUser?.propertyId ? short(staffUser.propertyId) : '—'}
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={['rgba(244,201,126,0.10)', 'rgba(244,201,126,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shiftCard}
          >
            <View style={styles.shiftHead}>
              <View>
                <Text style={styles.shiftLabel}>Shift status</Text>
                <Text style={styles.shiftValue}>{onShift ? 'On floor' : 'Off shift'}</Text>
                <Text style={styles.shiftMeta}>
                  {onShift ? `Started ${shiftDuration} ago` : 'Toggle on to receive tasks'}
                </Text>
              </View>
              <Switch
                value={onShift}
                onValueChange={setOnShift}
                trackColor={{ true: Luxe.goldDeep, false: '#2A2722' }}
                thumbColor={onShift ? Luxe.goldBright : Luxe.titanium}
              />
            </View>
          </LinearGradient>

          <View style={styles.grid}>
            <Stat label="Pending" value={stats.pending} accent={stats.pending > 0 ? Luxe.amberGlow : Luxe.ivoryDim} />
            <Stat label="In progress" value={stats.inProgress} accent={Luxe.ivoryDim} />
            <Stat
              label="SLA critical"
              value={stats.critical + stats.breached}
              accent={stats.breached > 0 ? '#E27A6E' : stats.critical > 0 ? Luxe.amberGlow : Luxe.ivoryDim}
              hint={stats.breached > 0 ? `${stats.breached} breached` : undefined}
            />
            <Stat label="Done today" value={stats.completed} accent={Luxe.gold} />
          </View>

          <Pressable onPress={() => router.push('/(staff)/tasks')} style={styles.primaryCta}>
            <Text style={styles.primaryCtaText}>Open task queue</Text>
            <Ionicons name="arrow-forward" size={16} color="#1A1410" />
          </Pressable>

          <Pressable onPress={buildHandover} style={styles.handoverBtn}>
            <Ionicons name="sparkles-outline" size={14} color={Luxe.goldBright} />
            <Text style={styles.handoverBtnText}>Generate shift handover</Text>
          </Pressable>

          {topAlerts.length > 0 ? (
            <View style={styles.alertsBlock}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Needs attention</Text>
                {showAlertsTab ? (
                  <Pressable onPress={() => router.push('/(staff)/alerts')} hitSlop={8}>
                    <Text style={styles.sectionLink}>All alerts</Text>
                  </Pressable>
                ) : null}
              </View>
              {topAlerts.map((a) => {
                const breached = a.severity === 'breach';
                const onPress = () => {
                  if ('taskId' in a && a.taskId) {
                    router.push({ pathname: '/(staff)/task', params: { id: a.taskId } });
                  } else if ('guestId' in a && a.guestId) {
                    router.push({ pathname: '/(staff)/guest', params: { id: a.guestId } });
                  } else if (showAlertsTab) {
                    router.push('/(staff)/alerts');
                  }
                };
                return (
                  <Pressable
                    key={a.id}
                    onPress={onPress}
                    style={[styles.alertCard, breached && styles.alertCardBreach]}
                  >
                    <View style={styles.alertHead}>
                      <Ionicons
                        name={breached ? 'alert-circle' : 'warning-outline'}
                        size={14}
                        color={breached ? '#E27A6E' : Luxe.amberGlow}
                      />
                      <Text style={[styles.alertHeadText, breached && { color: '#E27A6E' }]}>
                        {a.title}
                      </Text>
                      <Text style={styles.alertType}>· {alertKindLabel(a.kind).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.alertBody} numberOfLines={2}>
                      {a.body}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.quickRow}>
            <QuickLink
              icon="people-outline"
              label="Guests"
              onPress={() => router.push('/(staff)/guests')}
            />
            {showAlertsTab ? (
              <QuickLink
                icon="notifications-outline"
                label="Alerts"
                onPress={() => router.push('/(staff)/alerts')}
              />
            ) : null}
          </View>

          <Pressable onPress={confirmLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={15} color={Luxe.ivoryDim} />
            <Text style={styles.logoutText}>Sign out · {staffUser?.email ?? ''}</Text>
          </Pressable>
        </ScrollView>

        <Modal
          visible={handoverOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setHandoverOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setHandoverOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalKicker}>Shift Handover</Text>
                  <Text style={styles.modalTitle}>End-of-shift brief</Text>
                </View>
                <View style={styles.sourcePill}>
                  <Text style={styles.sourcePillText}>
                    {handoverSource === 'ai' ? 'AI · Claude' : 'Local · Offline'}
                  </Text>
                </View>
              </View>

              {handoverLoading ? (
                <View style={styles.handoverLoading}>
                  <ActivityIndicator color={Luxe.goldBright} />
                  <Text style={styles.handoverLoadingText}>
                    Synthesising tasks, alerts, VIP and inventory signals…
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 360 }}>
                  <Text style={styles.handoverBody}>{handoverSummary ?? ''}</Text>
                </ScrollView>
              )}

              <View style={styles.handoverActions}>
                <Pressable
                  onPress={buildHandover}
                  disabled={handoverLoading}
                  style={styles.handoverSecondary}
                >
                  <Ionicons name="refresh-outline" size={14} color={Luxe.ivoryDim} />
                  <Text style={styles.handoverSecondaryText}>Regenerate</Text>
                </Pressable>
                <Pressable
                  onPress={shareHandover}
                  disabled={!handoverSummary}
                  style={styles.handoverPrimary}
                >
                  <Ionicons name="share-outline" size={14} color="#1A1410" />
                  <Text style={styles.handoverPrimaryText}>Send to next shift</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent: string;
  hint?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickLink}>
      <Ionicons name={icon} size={18} color={Luxe.gold} />
      <Text style={styles.quickLinkText}>{label}</Text>
    </Pressable>
  );
}

function humanDuration(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function short(id: string): string {
  return id.length > 8 ? `${id.slice(0, 6)}…${id.slice(-2)}` : id;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  scroll: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 140 },
  header: { marginBottom: 24 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 40,
    lineHeight: 44,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  titleItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  rolePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  rolePillText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
  },
  identityMeta: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
    flex: 1,
  },
  shiftCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    marginBottom: 18,
  },
  shiftHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  shiftValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 26,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  shiftMeta: {
    marginTop: 4,
    fontFamily: LuxeFonts.sans,
    fontSize: 12,
    color: Luxe.ivoryDim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  statValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 32,
    letterSpacing: -0.8,
  },
  statLabel: {
    marginTop: 6,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Luxe.titanium,
  },
  statHint: {
    marginTop: 4,
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    color: '#E27A6E',
    letterSpacing: 0.6,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
    marginBottom: 26,
  },
  primaryCtaText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    letterSpacing: 1.4,
    color: '#1A1410',
    textTransform: 'uppercase',
  },
  alertsBlock: { marginBottom: 22 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  sectionLink: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Luxe.ivoryDim,
  },
  alertCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    marginBottom: 10,
  },
  alertCardBreach: { borderColor: '#E27A6E' },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  alertHeadText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.3,
    color: Luxe.amberGlow,
  },
  alertType: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    color: Luxe.titanium,
    letterSpacing: 1.2,
  },
  alertBody: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    color: Luxe.ivoryDim,
    lineHeight: 18,
  },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  quickLinkText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.ivory,
    letterSpacing: 0.4,
  },
  logoutBtn: {
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
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
  },
  handoverBtn: {
    marginTop: -14,
    marginBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  handoverBtnText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    color: Luxe.goldBright,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,7,10,0.78)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0C0A08',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,240,210,0.18)',
    marginBottom: 18,
  },
  modalHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  modalKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  sourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  sourcePillText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
  },
  handoverLoading: { paddingVertical: 30, alignItems: 'center', gap: 14 },
  handoverLoadingText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    color: Luxe.titanium,
    letterSpacing: 0.8,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  handoverBody: {
    fontFamily: LuxeFonts.serif,
    fontSize: 17,
    lineHeight: 26,
    color: Luxe.ivory,
    paddingVertical: 6,
  },
  handoverActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  handoverSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  handoverSecondaryText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: Luxe.ivoryDim,
    textTransform: 'uppercase',
  },
  handoverPrimary: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
  },
  handoverPrimaryText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 11.5,
    letterSpacing: 1.3,
    color: '#1A1410',
    textTransform: 'uppercase',
  },
});
