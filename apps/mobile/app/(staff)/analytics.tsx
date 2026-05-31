import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useOpsStore } from '../../src/stores/ops.store';
import { canSeeAlerts } from '../../src/lib/staffRoles';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

export default function StaffAnalyticsScreen() {
  useLuxeFonts();
  const staffUser = useAuthStore((s) => s.staffUser);
  const analytics = useOpsStore((s) => s.analytics);

  // Manager-only surface. Front desk + line staff don't need property KPIs.
  if (!canSeeAlerts(staffUser?.role)) {
    return <Redirect href="/(staff)/home" />;
  }

  const revenueDelta = analytics.revenueToday - analytics.revenueSameDayLastYear;
  const revenueDeltaPct = (revenueDelta / analytics.revenueSameDayLastYear) * 100;
  const revenueUp = revenueDelta >= 0;

  const fbTotalOrders = useMemo(
    () => analytics.fbByDepartment.reduce((acc, d) => acc + d.orders, 0),
    [analytics.fbByDepartment],
  );
  const fbTotalRevenue = useMemo(
    () => analytics.fbByDepartment.reduce((acc, d) => acc + d.revenue, 0),
    [analytics.fbByDepartment],
  );
  const fbMaxOrders = useMemo(
    () => Math.max(1, ...analytics.fbByDepartment.map((d) => d.orders)),
    [analytics.fbByDepartment],
  );

  const ranked = useMemo(
    () => [...analytics.leaderboard].sort((a, b) => b.tasksCompleted - a.tasksCompleted),
    [analytics.leaderboard],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>Live Property Analytics</Text>
          <Text style={styles.title}>Today, in motion</Text>
          <Text style={styles.subhead}>
            Generated {formatTime(analytics.generatedAt)} · property-wide
          </Text>

          {/* Occupancy */}
          <LinearGradient
            colors={['rgba(244,201,126,0.12)', 'rgba(244,201,126,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.occupancyCard}
          >
            <Text style={styles.cardLabel}>Occupancy</Text>
            <View style={styles.occupancyHead}>
              <Text style={styles.occupancyPct}>
                {analytics.occupancy.pct.toFixed(1)}
                <Text style={styles.occupancyPctUnit}>%</Text>
              </Text>
              <View style={styles.occupancyMeta}>
                <Text style={styles.occupancyRoomsBig}>
                  {analytics.occupancy.occupiedRooms}
                  <Text style={styles.occupancyRoomsSmall}> / {analytics.occupancy.totalRooms}</Text>
                </Text>
                <Text style={styles.occupancyRoomsLabel}>ROOMS OCCUPIED</Text>
              </View>
            </View>
            <View style={styles.occupancyTrack}>
              <View style={[styles.occupancyFill, { width: `${analytics.occupancy.pct}%` }]} />
            </View>
            <Text
              style={[
                styles.occupancyDelta,
                analytics.occupancy.delta24h >= 0 ? { color: Luxe.gold } : { color: '#E27A6E' },
              ]}
            >
              {analytics.occupancy.delta24h >= 0 ? '▲' : '▼'} {Math.abs(analytics.occupancy.delta24h).toFixed(1)}pp vs 24h ago
            </Text>
          </LinearGradient>

          {/* Revenue */}
          <View style={styles.row}>
            <View style={[styles.metricCard, { flex: 1 }]}>
              <Text style={styles.cardLabel}>Revenue today</Text>
              <Text style={styles.metricValue}>{formatINR(analytics.revenueToday)}</Text>
              <View style={styles.deltaRow}>
                <Ionicons
                  name={revenueUp ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={revenueUp ? Luxe.goldBright : '#E27A6E'}
                />
                <Text style={[styles.deltaText, revenueUp ? styles.deltaUp : styles.deltaDown]}>
                  {revenueUp ? '+' : '−'}
                  {formatINR(Math.abs(revenueDelta))} ({revenueDeltaPct >= 0 ? '+' : ''}
                  {revenueDeltaPct.toFixed(1)}%)
                </Text>
              </View>
              <Text style={styles.metricFoot}>vs same day last year</Text>
            </View>
            <View style={[styles.metricCard, { flex: 1 }]}>
              <Text style={styles.cardLabel}>ADR · RevPAR</Text>
              <Text style={styles.metricValue}>{formatINR(analytics.adr)}</Text>
              <Text style={styles.metricFoot}>
                RevPAR {formatINR(analytics.revpar)}
              </Text>
            </View>
          </View>

          {/* F&B by department */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>F&B orders by department</Text>
            <View style={styles.fbHeader}>
              <Text style={styles.fbHeaderText}>
                {fbTotalOrders} orders · {formatINR(fbTotalRevenue)}
              </Text>
            </View>
            {analytics.fbByDepartment.map((d) => {
              const widthPct = (d.orders / fbMaxOrders) * 100;
              return (
                <View key={d.department} style={styles.fbRow}>
                  <View style={styles.fbRowHead}>
                    <Text style={styles.fbDept}>{d.department}</Text>
                    <Text style={styles.fbCount}>{d.orders}</Text>
                    <Text style={styles.fbRevenue}>{formatINR(d.revenue)}</Text>
                  </View>
                  <View style={styles.fbBarTrack}>
                    <View style={[styles.fbBarFill, { width: `${widthPct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Staff leaderboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Staff performance · leaderboard</Text>
            {ranked.map((row, i) => {
              const slaTint =
                row.slaCompliancePct >= 95
                  ? Luxe.goldBright
                  : row.slaCompliancePct >= 85
                    ? Luxe.amberGlow
                    : '#E27A6E';
              return (
                <View key={row.staffId} style={styles.leaderRow}>
                  <Text style={styles.leaderRank}>#{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaderName}>{row.fullName}</Text>
                    <Text style={styles.leaderRole}>{row.role}</Text>
                  </View>
                  <View style={styles.leaderStat}>
                    <Text style={styles.leaderStatValue}>{row.tasksCompleted}</Text>
                    <Text style={styles.leaderStatLabel}>TASKS</Text>
                  </View>
                  <View style={styles.leaderStat}>
                    <Text style={styles.leaderStatValue}>{(row.avgRatingX10 / 10).toFixed(1)}</Text>
                    <Text style={styles.leaderStatLabel}>★ AVG</Text>
                  </View>
                  <View style={styles.leaderStat}>
                    <Text style={[styles.leaderStatValue, { color: slaTint }]}>
                      {row.slaCompliancePct}%
                    </Text>
                    <Text style={styles.leaderStatLabel}>SLA</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Anomalies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI anomaly detection</Text>
            {analytics.anomalies.length === 0 ? (
              <Text style={styles.anomalyEmpty}>No unusual patterns flagged.</Text>
            ) : (
              analytics.anomalies.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.anomalyCard,
                    a.severity === 'critical' && { borderColor: '#E27A6E' },
                    a.severity === 'warning' && { borderColor: 'rgba(244,201,126,0.40)' },
                  ]}
                >
                  <View style={styles.anomalyHead}>
                    <Ionicons
                      name={
                        a.severity === 'critical'
                          ? 'alert-circle'
                          : a.severity === 'warning'
                            ? 'warning-outline'
                            : 'pulse-outline'
                      }
                      size={14}
                      color={
                        a.severity === 'critical'
                          ? '#E27A6E'
                          : a.severity === 'warning'
                            ? Luxe.amberGlow
                            : Luxe.ivoryDim
                      }
                    />
                    <Text
                      style={[
                        styles.anomalyTitle,
                        a.severity === 'critical' && { color: '#E27A6E' },
                      ]}
                    >
                      {a.title}
                    </Text>
                  </View>
                  <Text style={styles.anomalyBody}>{a.body}</Text>
                  <Text style={styles.anomalyTime}>{formatTime(a.detectedAt)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function formatINR(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}k`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  scroll: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 140 },
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
  subhead: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.titanium,
    marginBottom: 22,
  },
  occupancyCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
    marginBottom: 16,
  },
  cardLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  occupancyHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  occupancyPct: {
    fontFamily: LuxeFonts.serif,
    fontSize: 56,
    lineHeight: 56,
    color: Luxe.ivory,
    letterSpacing: -2,
  },
  occupancyPctUnit: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.amberGlow,
  },
  occupancyMeta: { flex: 1, alignItems: 'flex-end' },
  occupancyRoomsBig: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivory },
  occupancyRoomsSmall: { fontFamily: LuxeFonts.serif, fontSize: 14, color: Luxe.titanium },
  occupancyRoomsLabel: {
    marginTop: 4,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8.5,
    letterSpacing: 1.4,
    color: Luxe.titanium,
  },
  occupancyTrack: {
    marginTop: 16,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,240,210,0.06)',
    overflow: 'hidden',
  },
  occupancyFill: { height: '100%', borderRadius: 999, backgroundColor: Luxe.goldBright },
  occupancyDelta: {
    marginTop: 10,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    letterSpacing: 1,
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  metricCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  metricValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    color: Luxe.ivory,
    letterSpacing: -0.8,
  },
  metricFoot: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    color: Luxe.titanium,
    letterSpacing: 0.4,
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  deltaText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  deltaUp: { color: Luxe.goldBright },
  deltaDown: { color: '#E27A6E' },
  section: { marginTop: 24 },
  sectionTitle: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  fbHeader: { marginBottom: 10 },
  fbHeaderText: { fontFamily: LuxeFonts.mono, fontSize: 11.5, color: Luxe.ivoryDim, letterSpacing: 0.4 },
  fbRow: { marginBottom: 12 },
  fbRowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 5 },
  fbDept: { flex: 1, fontFamily: LuxeFonts.sansMedium, fontSize: 13, color: Luxe.ivory },
  fbCount: { fontFamily: LuxeFonts.mono, fontSize: 12, color: Luxe.titanium },
  fbRevenue: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    color: Luxe.goldBright,
    minWidth: 64,
    textAlign: 'right',
  },
  fbBarTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,240,210,0.05)',
    overflow: 'hidden',
  },
  fbBarFill: { height: '100%', borderRadius: 999, backgroundColor: Luxe.gold },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  leaderRank: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    color: Luxe.amberGlow,
    width: 32,
  },
  leaderName: { fontFamily: LuxeFonts.sansMedium, fontSize: 13.5, color: Luxe.ivory },
  leaderRole: {
    marginTop: 2,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    color: Luxe.titanium,
    letterSpacing: 0.5,
  },
  leaderStat: { alignItems: 'center', minWidth: 42 },
  leaderStatValue: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.ivory },
  leaderStatLabel: {
    marginTop: 2,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8,
    letterSpacing: 1.2,
    color: Luxe.muted,
  },
  anomalyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    marginBottom: 10,
  },
  anomalyHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  anomalyTitle: {
    flex: 1,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.amberGlow,
    textTransform: 'uppercase',
  },
  anomalyBody: { fontFamily: LuxeFonts.sans, fontSize: 13, color: Luxe.ivoryDim, lineHeight: 19 },
  anomalyTime: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    color: Luxe.titanium,
    letterSpacing: 0.4,
  },
  anomalyEmpty: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    color: Luxe.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
