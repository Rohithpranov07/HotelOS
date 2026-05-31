import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useOrdersStore,
  type Order,
  type OrderStatus,
} from '../../src/stores/orders.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { connectSocket } from '../../src/lib/socket';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const STEPS: { key: OrderStatus; label: string; phrase: string }[] = [
  { key: 'pending', label: 'Received', phrase: 'Order received.' },
  { key: 'accepted', label: 'Confirmed', phrase: 'Confirmed by the kitchen.' },
  { key: 'in_progress', label: 'Preparing', phrase: 'On the pass now.' },
  { key: 'completed', label: 'Delivered', phrase: 'Delivered to your suite.' },
];

const SERVICE_RATE = 0.05;

export default function TrackOrderScreen() {
  void useLuxeFonts();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const activeOrders = useOrdersStore((s) => s.activeOrders);
  const history = useOrdersStore((s) => s.orderHistory);
  const enqueueFeedback = useOrdersStore((s) => s.enqueueFeedback);
  const reservation = useReservationStore((s) => s.reservation);

  const order: Order | undefined = useMemo(() => {
    const all = [...activeOrders, ...history];
    if (orderId) return all.find((o) => o.id === orderId);
    return activeOrders[0] ?? history[0];
  }, [activeOrders, history, orderId]);

  // A delivered, not-yet-rated order should always surface the feedback prompt —
  // even when the guest lands here on an order that completed earlier.
  useEffect(() => {
    if (order && order.status === 'completed' && !order.guest_mood && !order.guest_rating) {
      enqueueFeedback(order);
    }
  }, [order?.id, order?.status, order?.guest_mood, order?.guest_rating, enqueueFeedback]);

  // Live ETA countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (reservation?.id) connectSocket(reservation.id);
  }, [reservation?.id]);

  if (!order) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.empty}>Order not found.</Text>
        <Pressable onPress={() => router.replace('/(app)/services')} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnLabel}>BACK TO MENU</Text>
        </Pressable>
      </View>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === order.status);
  const activeIdx = idx === -1 ? 0 : idx;
  const isDelivered = order.status === 'completed';

  const minutesLeft = order.sla_deadline
    ? Math.max(0, Math.round((new Date(order.sla_deadline).getTime() - now) / 60_000))
    : (order.estimated_delivery_minutes ?? 18);

  const subtotal = order.total_amount;
  const service = Math.round(subtotal * SERVICE_RATE);
  const total = subtotal + service;
  const shortId = order.id.slice(0, 8).toUpperCase();

  // Fraction of the way through the kitchen SLA — drives the live prep bar.
  const createdMs = new Date(order.created_at).getTime();
  const slaMs = order.sla_deadline ? new Date(order.sla_deadline).getTime() : createdMs;
  const prepProgress =
    slaMs > createdMs ? Math.min(1, Math.max(0.04, (now - createdMs) / (slaMs - createdMs))) : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace('/(app)/services')}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={Luxe.ivory} />
          </Pressable>
          <View style={styles.statusPill}>
            {isDelivered ? (
              <View style={[styles.dot, styles.dotDone]} />
            ) : (
              <PulsingDot color={Luxe.amberGlow} size={6} />
            )}
            <Text style={styles.statusText}>
              {(STEPS[activeIdx]?.label ?? 'TRACKING').toUpperCase()}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={styles.hero}>
            <LinearGradient
              colors={['rgba(244,201,126,0.18)', 'transparent']}
              locations={[0, 0.7]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.kicker}>
              {isDelivered ? 'Bon appétit' : 'In motion'}
            </Text>
            <Text style={styles.title}>
              {isDelivered ? 'Your tray has arrived.' : STEPS[activeIdx]?.phrase}
            </Text>
            {!isDelivered ? (
              <>
                <View style={styles.etaRow}>
                  <Text style={styles.etaValue}>{minutesLeft}</Text>
                  <Text style={styles.etaUnit}>MIN LEFT</Text>
                </View>
                <PrepBar progress={prepProgress} />
              </>
            ) : (
              <Text style={styles.etaItalic}>
                Tap below to rate this dish when you've had a moment.
              </Text>
            )}
          </View>

          {/* PROGRESS TRACK */}
          <View style={styles.trackWrap}>
            {/* base line spans node-center to node-center */}
            <View style={styles.trackBase} />
            <View
              style={[
                styles.trackFill,
                {
                  width: `${(Math.max(0, activeIdx) / (STEPS.length - 1)) * 100}%`,
                },
              ]}
            />
            <View style={styles.trackRow}>
              {STEPS.map((s, i) => {
                const done = i <= activeIdx;
                const current = i === activeIdx && !isDelivered;
                return (
                  <View key={s.key} style={styles.stepCol}>
                    <View
                      style={[
                        styles.node,
                        done && styles.nodeDone,
                        current && styles.nodeCurrent,
                      ]}
                    />
                    <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                      {s.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* LIVE STATUS FEED */}
          <StatusFeed order={order} activeIdx={activeIdx} isDelivered={isDelivered} now={now} />

          {/* ORDER DETAILS */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionKicker}>Your order</Text>
              <Text style={styles.sectionMeta}>#{shortId}</Text>
            </View>
            {order.items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    × {it.quantity}
                    {it.notes ? `  ·  "${it.notes}"` : ''}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>₹{(it.unit_price * it.quantity).toFixed(0)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <Row label="Subtotal" value={`₹${subtotal.toFixed(0)}`} />
            <Row label="Service charge · 5%" value={`₹${service.toFixed(0)}`} />
            <View style={styles.divider} />
            <Row label="Total" value={`₹${total.toFixed(0)}`} emphasis />
          </View>

          {/* ASSIGNED STAFF */}
          {order.assigned_staff && (
            <View style={styles.section}>
              <Text style={styles.sectionKicker}>Bringing it up</Text>
              <View style={styles.staffRow}>
                <View style={styles.avatar}>
                  <LinearGradient
                    colors={['#F4C97E', '#9A7A3F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.avatarText}>
                    {initials(order.assigned_staff.fullName)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{order.assigned_staff.fullName}</Text>
                  <Text style={styles.staffRole}>
                    {order.assigned_staff.role.toUpperCase()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    void Linking.openURL('tel:+919944945190');
                  }}
                  style={styles.iconBtn}
                  hitSlop={6}
                >
                  <Ionicons name="call-outline" size={16} color={Luxe.amberGlow} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/(app)/concierge',
                      params: {
                        prefill: `Quick question about my ${order.type} order ${order.id.slice(0, 6)} — `,
                      },
                    });
                  }}
                  style={styles.iconBtn}
                  hitSlop={6}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={Luxe.amberGlow} />
                </Pressable>
              </View>
            </View>
          )}

          {/* NOTES */}
          {order.notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionKicker}>For the kitchen</Text>
              <Text style={styles.notes}>"{order.notes}"</Text>
            </View>
          ) : null}

          {/* SUITE */}
          <View style={styles.section}>
            <View style={styles.suiteRow}>
              <View>
                <Text style={styles.sectionKicker}>To suite</Text>
                <Text style={styles.suiteNum}>
                  {reservation?.room?.roomNumber ?? '1604'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sectionKicker}>Charge</Text>
                <Text style={styles.suiteFolio}>Room folio</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM CTAs */}
        <View style={styles.ctaBar}>
          <LinearGradient
            colors={['transparent', Luxe.obsidian]}
            locations={[0, 0.5]}
            pointerEvents="none"
            style={styles.ctaFade}
          />
          <Pressable
            onPress={() => router.replace('/(app)/services')}
            style={[styles.cta, styles.ctaGhost]}
          >
            <Text style={styles.ctaGhostLabel}>BACK TO MENU</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (isDelivered && !order.guest_mood && !order.guest_rating) {
                enqueueFeedback(order);
              } else {
                router.replace('/(app)/orders');
              }
            }}
            style={[styles.cta, styles.ctaPrimary]}
          >
            <LinearGradient
              colors={['#F4C97E', '#D4A857', '#9A7A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ctaPrimaryLabel}>
              {isDelivered && !order.guest_mood && !order.guest_rating ? 'RATE THIS DISH' : 'ALL ORDERS'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PulsingDot({ color = Luxe.amberGlow, size = 6 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.65, 0.15, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: Luxe.amberGlow,
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }}
      />
    </View>
  );
}

function PrepBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
  }, [progress, anim]);
  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.prepBarTrack}>
      <Animated.View style={[styles.prepBarFill, { width }]}>
        <LinearGradient
          colors={['#9A7A3F', '#F4C97E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const FEED_STEPS: { key: OrderStatus; label: string; note: string }[] = [
  { key: 'pending', label: 'Order received', note: 'Sent to the kitchen' },
  { key: 'accepted', label: 'Confirmed', note: 'Chef has the ticket' },
  { key: 'in_progress', label: 'Preparing', note: 'Cooking & plating now' },
  { key: 'completed', label: 'Delivered', note: 'Enjoy your meal' },
];

function fmtTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StatusFeed({
  order,
  activeIdx,
  isDelivered,
  now,
}: {
  order: Order;
  activeIdx: number;
  isDelivered: boolean;
  now: number;
}) {
  const timeFor = (key: OrderStatus): string | null =>
    fmtTime(order.status_history.find((h) => h.status === key)?.at);
  void now;
  return (
    <View style={styles.feedCard}>
      <View style={styles.feedHead}>
        <PulsingDot size={6} />
        <Text style={styles.feedHeadText}>Live updates</Text>
      </View>
      {FEED_STEPS.map((step, i) => {
        const done = i < activeIdx || (i === activeIdx && isDelivered);
        const current = i === activeIdx && !isDelivered;
        const future = i > activeIdx;
        const time = timeFor(step.key);
        const isLast = i === FEED_STEPS.length - 1;
        return (
          <View key={step.key} style={styles.feedRow}>
            <View style={styles.feedRail}>
              <View style={styles.feedDotSlot}>
                {current ? (
                  <PulsingDot size={12} />
                ) : (
                  <View
                    style={[
                      styles.feedDot,
                      done && styles.feedDotDone,
                      future && styles.feedDotFuture,
                    ]}
                  >
                    {done && <Ionicons name="checkmark" size={9} color="#1A1206" />}
                  </View>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.feedLine,
                    (done || current) && styles.feedLineDone,
                  ]}
                />
              )}
            </View>
            <View style={styles.feedBody}>
              <Text
                style={[
                  styles.feedLabel,
                  current && styles.feedLabelCurrent,
                  future && styles.feedLabelFuture,
                ]}
              >
                {step.label}
              </Text>
              <Text style={styles.feedNote}>{current ? `${step.note}…` : step.note}</Text>
            </View>
            <Text style={styles.feedTime}>
              {time ?? (current ? 'now' : future ? '—' : '')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, emphasis && styles.totalLabelEm]}>{label}</Text>
      <Text style={[styles.totalValue, emphasis && styles.totalValueEm]}>{value}</Text>
    </View>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.6)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotLive: { backgroundColor: Luxe.amberGlow },
  dotDone: { backgroundColor: '#A8D08D' },
  statusText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.amberGlow,
    letterSpacing: 1.8,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 30,
    lineHeight: 34,
    color: Luxe.ivory,
    letterSpacing: -0.7,
  },
  etaRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  etaValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 52,
    lineHeight: 54,
    color: Luxe.amberGlow,
    letterSpacing: -1.6,
    fontVariant: ['tabular-nums'],
  },
  etaUnit: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    color: Luxe.titanium,
    letterSpacing: 2,
  },
  etaItalic: {
    marginTop: 14,
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 14,
    color: Luxe.ivoryDim,
  },
  prepBarTrack: {
    marginTop: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,240,210,0.08)',
    overflow: 'hidden',
    maxWidth: 300,
  },
  prepBarFill: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },

  // LIVE STATUS FEED
  feedCard: {
    marginHorizontal: 22,
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
    backgroundColor: 'rgba(20,18,15,0.55)',
  },
  feedHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 },
  feedHeadText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  feedRow: { flexDirection: 'row', gap: 13 },
  feedRail: { width: 16, alignItems: 'center' },
  feedDotSlot: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  feedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Luxe.surfaceTop,
    borderWidth: 1,
    borderColor: Luxe.hairlineStrong,
  },
  feedDotDone: { backgroundColor: Luxe.gold, borderColor: Luxe.goldBright },
  feedDotFuture: { backgroundColor: 'transparent' },
  feedLine: {
    flex: 1,
    width: 1.5,
    minHeight: 16,
    backgroundColor: 'rgba(255,240,210,0.22)',
  },
  feedLineDone: { backgroundColor: 'rgba(244,201,126,0.45)' },
  feedBody: { flex: 1, paddingBottom: 18 },
  feedLabel: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 14,
    color: Luxe.ivory,
  },
  feedLabelCurrent: { color: Luxe.amberGlow },
  feedLabelFuture: { color: Luxe.muted, fontFamily: LuxeFonts.sans },
  feedNote: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 11.5,
    color: Luxe.titanium,
    marginTop: 2,
  },
  feedTime: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 0.6,
  },
  trackWrap: {
    marginTop: 6,
    marginBottom: 6,
    marginHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 4,
    position: 'relative',
  },
  // Lines run between first and last node centers. Each column is 1/N wide,
  // so the centers sit at 0.5/N and (N-0.5)/N of the row width.
  // For N=4 → 12.5% and 87.5% → inset 12.5% on each side.
  trackBase: {
    position: 'absolute',
    left: '12.5%',
    right: '12.5%',
    top: 11, // node center: paddingTop(4) + nodeRadius(6) + borderWidth(1)/? ≈ 10
    height: 1,
    backgroundColor: Luxe.hairlineStrong,
  },
  trackFill: {
    position: 'absolute',
    left: '12.5%',
    top: 11,
    height: 1,
    backgroundColor: Luxe.gold,
  },
  trackRow: { flexDirection: 'row' },
  stepCol: { flex: 1, alignItems: 'center' },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Luxe.surfaceTop,
    borderWidth: 1,
    borderColor: Luxe.hairlineStrong,
  },
  nodeDone: { backgroundColor: Luxe.gold, borderColor: Luxe.goldBright },
  nodeCurrent: {
    backgroundColor: Luxe.amberGlow,
    borderColor: Luxe.amberGlow,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  stepLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginTop: 14,
  },
  stepLabelDone: { color: Luxe.ivory },
  section: {
    marginTop: 18,
    marginHorizontal: 22,
    padding: 18,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: Luxe.hairline,
    backgroundColor: 'rgba(20,18,15,0.55)',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.titanium,
    letterSpacing: 1.4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  itemName: {
    fontFamily: LuxeFonts.serif,
    fontSize: 16,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  itemMeta: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.muted,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  itemPrice: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 13,
    color: Luxe.amberGlow,
    letterSpacing: 0.4,
  },
  divider: { height: 0.5, backgroundColor: Luxe.hairlineStrong, marginVertical: 10 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    color: Luxe.ivoryDim,
  },
  totalLabelEm: {
    fontFamily: LuxeFonts.serif,
    fontSize: 17,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  totalValue: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 13,
    color: Luxe.ivory,
    letterSpacing: 0.4,
  },
  totalValueEm: { fontSize: 17, color: Luxe.amberGlow, letterSpacing: 0.5 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 15,
    color: '#1A1410',
    letterSpacing: 0.5,
  },
  staffName: {
    fontFamily: LuxeFonts.serif,
    fontSize: 17,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
  staffRole: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.4,
    marginTop: 3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.30)',
    backgroundColor: 'rgba(244,201,126,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 14,
    color: Luxe.ivoryDim,
    lineHeight: 20,
  },
  suiteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  suiteNum: {
    fontFamily: LuxeFonts.serif,
    fontSize: 26,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  suiteFolio: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    color: Luxe.ivory,
    letterSpacing: -0.3,
    marginTop: 6,
  },
  ctaBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
    flexDirection: 'row',
    gap: 10,
  },
  ctaFade: {
    position: 'absolute',
    left: -18,
    right: -18,
    top: -40,
    height: 40,
  },
  cta: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaGhost: {
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(28,26,21,0.6)',
  },
  ctaGhostLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    color: Luxe.ivoryDim,
    letterSpacing: 2,
  },
  ctaPrimary: {
    shadowColor: '#D4A857',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaPrimaryLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    color: '#1A1410',
    letterSpacing: 2,
    fontWeight: '600',
  },
  empty: {
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 18,
    color: Luxe.titanium,
    marginBottom: 18,
  },
  emptyBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.40)',
  },
  emptyBtnLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.amberGlow,
    letterSpacing: 2,
  },
});
