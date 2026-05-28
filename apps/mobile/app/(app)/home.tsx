import { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Hero } from '../../src/components/luxe/Hero';
import { MobileKeyCard } from '../../src/components/luxe/MobileKeyCard';
import { StayTimeline } from '../../src/components/luxe/StayTimeline';
import { LuxeActionGrid, type LuxeAction } from '../../src/components/luxe/LuxeActionGrid';
import { SmartCard } from '../../src/components/luxe/SmartCard';
import { DiscoveryRail } from '../../src/components/luxe/DiscoveryRail';
import { LuxeLoyaltyCard } from '../../src/components/luxe/LuxeLoyaltyCard';
import { RoomPreferences } from '../../src/components/luxe/RoomPreferences';
import { SectionHeader } from '../../src/components/luxe/SectionHeader';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { useAuthStore } from '../../src/stores/auth.store';
import { useReservationStore, type Reservation } from '../../src/stores/reservation.store';
import { useOrdersStore, type Order } from '../../src/stores/orders.store';
import { buildDiscoveryItems } from '../../src/lib/discoveryItems';
import { hasShownCheckoutModal } from './checkout-complete';

const POLL_MS = 5 * 60 * 1000;



export default function HomeScreen() {
  const fontsLoaded = useLuxeFonts();
  const guest = useAuthStore((s) => s.guest);
  const reservation = useReservationStore((s) => s.reservation);
  const fetchActiveReservation = useReservationStore((s) => s.fetchActiveReservation);
  const activeOrders = useOrdersStore((s) => s.activeOrders);
  const fetchActiveOrders = useOrdersStore((s) => s.fetchActiveOrders);
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActiveReservation();
      fetchActiveOrders();
    }, [fetchActiveReservation, fetchActiveOrders]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchActiveReservation();
    });
    const interval = setInterval(() => fetchActiveReservation(), POLL_MS);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [fetchActiveReservation]);

  useEffect(() => {
    if (
      reservation?.status === 'checked_out' &&
      reservation.id &&
      !hasShownCheckoutModal(reservation.id)
    ) {
      router.replace({
        pathname: '/(app)/checkout-complete',
        params: { reservationId: reservation.id },
      });
    }
  }, [reservation?.status, reservation?.id, router]);

  if (!guest) {
    return <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]} />;
  }
  void fontsLoaded;

  const firstName = guest.fullName?.split(' ')[0] || 'Guest';
  const { greeting, subhead } = greetingFor(reservation);
  const suiteNumber = reservation?.room?.roomNumber ?? '1604';

  const actions: LuxeAction[] = [
    {
      kind: 'concierge',
      label: 'Concierge AI',
      sub: 'Always listening',
      badge: 'Live',
      onPress: () => router.push('/(app)/concierge'),
    },
    {
      kind: 'housekeeping',
      label: 'Housekeeping',
      sub: reservation?.isDnd ? 'Do not disturb' : 'Turn down · Linen',
      onPress: () => router.push('/(app)/housekeeping'),
    },
    {
      kind: 'payments',
      label: 'Folio & Pay',
      sub: reservation ? `${formatBalance(reservation.balanceDue)} open` : 'View bill',
      onPress: () => router.push('/(app)/folio'),
    },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={[]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          bounces={false}
          overScrollMode="never"
        >
          <Hero
            greeting={greeting}
            name={firstName}
            subhead={subhead}
            suiteNumber={suiteNumber}
          />

          {/* MOBILE KEY */}
          <View style={styles.mobileKeyWrap}>
            <MobileKeyCard
              suiteNumber={suiteNumber}
              unlocked={unlocked}
              onUnlock={() => {
                setUnlocked(true);
                router.push('/(app)/key');
              }}
            />
            {reservation?.status === 'confirmed' ? (
              <View style={styles.checkinPrompt}>
                <Text style={styles.checkinPromptKicker}>Before arrival</Text>
                <Text style={styles.checkinPromptText}>
                  Complete digital check-in to skip the front desk.
                </Text>
                <Text
                  style={styles.checkinPromptCta}
                  onPress={() => router.push('/(app)/checkin')}
                >
                  Begin →
                </Text>
              </View>
            ) : null}
          </View>

          {/* STAY TIMELINE */}
          <View style={{ marginTop: 56 }}>
            <StayTimeline
              items={buildTimelineItems(reservation, activeOrders)}
              dayLabel={dayLabel(reservation) || 'Day 2 of 4'}
            />
          </View>

          {/* QUICK ACTIONS */}
          <View style={{ marginTop: 60 }}>
            <SectionHeader kicker="In reach" title="At a touch" right="03" />
            <LuxeActionGrid items={actions} />
          </View>

          {/* ROOM PREFERENCES */}
          <View style={{ marginTop: 60 }}>
            <SectionHeader kicker="Your suite" title="Room preferences" right="Saved" />
            <RoomPreferences />
          </View>

          {/* SMART CONTEXT */}
          <View style={{ marginTop: 60 }}>
            <SectionHeader kicker="Right now" title="Quiet intelligence" right="Live" />
            <View style={styles.smartStack}>
              {buildSmartCards({ reservation, activeOrders, router }).map((card, i) => (
                <SmartCard key={i} {...card} />
              ))}
            </View>
          </View>

          {/* DISCOVERY */}
          <View style={{ marginTop: 64 }}>
            <SectionHeader
              kicker="The edit"
              title="Curated for tonight"
              right="See all"
              onRightPress={() => router.push('/(app)/discover')}
            />
            <DiscoveryRail items={buildDiscoveryItems(router).slice(0, 4)} />
          </View>

          {/* LOYALTY */}
          <View style={{ marginTop: 64, paddingHorizontal: 22 }}>
            <Text style={styles.societyLabel}>The Society</Text>
            <LuxeLoyaltyCard
              tier={tierForGuest(guest.loyaltyTier)}
              points={guest.loyaltyPoints}
              monogram={firstName.charAt(0).toUpperCase()}
              progress={loyaltyProgress(guest.loyaltyPoints)}
              nextTier={nextTier(guest.loyaltyTier)}
            />
          </View>

          {/* FOOTNOTE */}
          <View style={styles.footnote}>
            <Text style={styles.footnoteText}>Hôtel Octave · v 2.6</Text>
            <Text style={styles.footnoteText}>End-to-end encrypted</Text>
          </View>
        </ScrollView>

        {/* Bottom fade into dock */}
        <LinearGradient
          colors={['transparent', 'rgba(8,7,10,0.85)', Luxe.obsidian]}
          locations={[0, 0.45, 0.8]}
          pointerEvents="none"
          style={styles.bottomFade}
        />
      </SafeAreaView>
    </View>
  );
}

/* ─── Stay Timeline builder ─── */

interface TimelineSlot { time: string; label: string; min: number }

function buildTimelineItems(
  reservation: Reservation | null,
  activeOrders: Order[],
): { time: string; label: string; done?: boolean; active?: boolean }[] {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const pool: TimelineSlot[] = [
    { time: '07:30', label: 'Breakfast', min: 450 },
    { time: '12:30', label: 'Lunch menu', min: 750 },
    { time: '17:30', label: 'Turndown', min: 1050 },
    { time: '19:30', label: 'Dinner', min: 1170 },
    { time: '21:00', label: 'Spa ritual', min: 1260 },
    { time: '23:00', label: 'Nightcap', min: 1380 },
  ];

  // Checkout appears only on the last day
  if (isLastDay(reservation)) {
    pool.push({ time: '11:00', label: 'Checkout', min: 660 });
  }

  // Inject the earliest live order's ETA
  const liveOrder = activeOrders.find(
    (o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'in_progress',
  );
  if (liveOrder?.sla_deadline) {
    const eta = new Date(liveOrder.sla_deadline);
    const min = eta.getHours() * 60 + eta.getMinutes();
    if (min > currentMin) {
      const label = liveOrder.items[0]?.name ?? 'Order arriving';
      pool.push({
        time: `${String(eta.getHours()).padStart(2, '0')}:${String(eta.getMinutes()).padStart(2, '0')}`,
        label: label.length > 14 ? label.slice(0, 13) + '…' : label,
        min,
      });
    }
  }

  pool.sort((a, b) => a.min - b.min);

  // Window: last completed event + next 3, or 4 upcoming if nothing is past yet
  const past = pool.filter((s) => s.min < currentMin);
  const future = pool.filter((s) => s.min >= currentMin);
  const window = past.length > 0
    ? [...past.slice(-1), ...future.slice(0, 3)]
    : future.slice(0, 4);

  const nextMin = future[0]?.min ?? -1;

  return window.slice(0, 4).map((slot) => ({
    time: slot.time,
    label: slot.label,
    done: slot.min < currentMin,
    active: slot.min === nextMin,
  }));
}

function isLastDay(r: Reservation | null): boolean {
  if (!r) return false;
  const co = new Date(r.checkOutDate);
  const today = new Date();
  return (
    co.getFullYear() === today.getFullYear() &&
    co.getMonth() === today.getMonth() &&
    co.getDate() === today.getDate()
  );
}

/* ─── Quiet Intelligence card builder ─── */

interface SmartCardData {
  kicker: string;
  title: string;
  body?: string;
  action?: string;
  glow?: 'gold' | 'ink' | 'bronze';
  live?: boolean;
  onPress?: () => void;
}

function etaLabel(order: Order): string {
  if (order.sla_deadline) {
    const mins = Math.max(0, Math.round((new Date(order.sla_deadline).getTime() - Date.now()) / 60_000));
    if (mins <= 0) return 'Arriving now';
    return `In ${mins} min`;
  }
  if (order.estimated_delivery_minutes) return `In ${order.estimated_delivery_minutes} min`;
  return 'On its way';
}

function orderStatusLabel(status: Order['status']): string {
  if (status === 'pending') return 'Acknowledged — being prepared.';
  if (status === 'accepted') return 'Accepted — kitchen is on it.';
  if (status === 'in_progress') return 'Being prepared and plated now.';
  return 'On its way.';
}

function orderTitle(order: Order): string {
  const names = order.items.slice(0, 2).map((i) => i.name);
  const suffix = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';
  return names.join(', ') + suffix;
}

function atmosphereCard(router: ReturnType<typeof useRouter>): SmartCardData {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) {
    return {
      kicker: 'This morning',
      title: 'The city wakes quietly below.',
      body: 'Breakfast can be arranged in-suite — pastries, fruit, and your preferred brew.',
      action: 'Order',
      glow: 'gold',
      onPress: () => router.push('/(app)/services'),
    };
  }
  if (h >= 11 && h < 17) {
    return {
      kicker: 'This afternoon',
      title: 'The pool is unhurried right now.',
      body: 'A quiet swim, a cold towel, and the afternoon is yours. The spa has open slots too.',
      action: 'Arrange',
      glow: 'ink',
      onPress: () => router.push('/(app)/concierge'),
    };
  }
  if (h >= 17 && h < 22) {
    return {
      kicker: 'This evening',
      title: 'The kitchen is open.',
      body: "Chef's tasting menu, a bottle from the cellar, or just what you're craving.",
      action: 'Order',
      glow: 'gold',
      onPress: () => router.push('/(app)/services'),
    };
  }
  return {
    kicker: 'Late night',
    title: 'The hotel is still.',
    body: 'A nightcap, a late-night snack, or simply silence — the concierge is always here.',
    action: 'Ask',
    glow: 'ink',
    onPress: () => router.push('/(app)/concierge'),
  };
}

function buildSmartCards({
  reservation,
  activeOrders,
  router,
}: {
  reservation: Reservation | null;
  activeOrders: Order[];
  router: ReturnType<typeof useRouter>;
}): SmartCardData[] {
  const cards: SmartCardData[] = [];

  // 1. Live order tracking
  const liveOrder = activeOrders.find((o) =>
    (o.status === 'pending' || o.status === 'accepted' || o.status === 'in_progress'),
  );
  if (liveOrder) {
    cards.push({
      kicker: etaLabel(liveOrder),
      title: orderTitle(liveOrder),
      body: `${orderStatusLabel(liveOrder.status)}${liveOrder.assigned_staff ? ` ${liveOrder.assigned_staff.fullName} is handling your order.` : ''}`,
      action: 'Track',
      glow: 'gold',
      live: true,
      onPress: () => router.push('/(app)/orders'),
    });
  }

  // 2. Outstanding balance
  if (reservation && reservation.balanceDue > 0) {
    cards.push({
      kicker: 'Folio',
      title: `${formatBalance(reservation.balanceDue)} remaining on your stay.`,
      body: 'Settle at any time — card, UPI, or loyalty points all accepted.',
      action: 'View',
      glow: 'bronze',
      onPress: () => router.push('/(app)/folio'),
    });
  }

  // 3. Do Not Disturb active
  if (reservation?.isDnd) {
    cards.push({
      kicker: 'Suite',
      title: 'Do Not Disturb is on.',
      body: 'Housekeeping will hold. Tap to change your preference.',
      action: 'Manage',
      glow: 'ink',
      onPress: () => router.push('/(app)/housekeeping'),
    });
  }

  // 4. Pre-arrival check-in nudge
  if (reservation?.status === 'confirmed' || reservation?.status === 'pre_checked_in') {
    cards.push({
      kicker: 'Before arrival',
      title: 'Skip the front desk entirely.',
      body: 'Complete digital check-in and walk straight to your suite — your key will be waiting.',
      action: 'Begin',
      glow: 'gold',
      onPress: () => router.push('/(app)/checkin'),
    });
  }

  // Fall back to atmosphere cards so the section is never empty
  if (cards.length === 0) {
    cards.push(atmosphereCard(router));
    cards.push({
      kicker: 'Always on',
      title: 'Your concierge is listening.',
      body: 'Anything you need — ordered, arranged, or simply answered.',
      action: 'Chat',
      glow: 'bronze',
      onPress: () => router.push('/(app)/concierge'),
    });
  } else if (cards.length === 1) {
    // Keep at least 2 cards for visual balance
    cards.push(atmosphereCard(router));
  }

  return cards.slice(0, 3);
}

function greetingFor(r: Reservation | null): { greeting: string; subhead: string } {
  const h = new Date().getHours();
  const baseTime = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  if (!r) {
    return {
      greeting: baseTime,
      subhead:
        'Your evening is in motion. The suite is prepared, dinner is being plated, and the night is yours.',
    };
  }
  if (r.status === 'confirmed' || r.status === 'pre_checked_in') {
    return {
      greeting: 'Welcome back',
      subhead: 'Your suite is being prepared. The night ahead is yours to shape.',
    };
  }
  if (r.status === 'checked_in') {
    return {
      greeting: baseTime,
      subhead: 'Your evening is in motion. The suite is prepared, dinner is being plated, and the night is yours.',
    };
  }
  if (r.status === 'checked_out') {
    return {
      greeting: 'Thank you',
      subhead: 'A quiet farewell — until next time.',
    };
  }
  return { greeting: baseTime, subhead: '' };
}

function formatRange(checkIn: string, checkOut: string): string {
  const f = (s: string) =>
    new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${f(checkIn)} – ${f(checkOut)}`;
}

function nightsLabel(r: Reservation): string {
  const ms = new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime();
  const n = Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
  return `${n} night${n === 1 ? '' : 's'}`;
}

function preArrivalKicker(r: Reservation): string {
  const ms = new Date(r.checkInDate).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  if (days <= 0) return 'Arriving today';
  if (days === 1) return 'Arriving tomorrow';
  return `In ${days} days`;
}

function dayLabel(r: Reservation | null): string {
  if (!r) return '';
  const total = Math.max(1, Math.round(
    (new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / (24 * 60 * 60 * 1000),
  ));
  const elapsed = Math.min(total, Math.max(1, Math.ceil(
    (Date.now() - new Date(r.checkInDate).getTime()) / (24 * 60 * 60 * 1000),
  )));
  return `Day ${elapsed} of ${total}`;
}

function formatBalance(n: number): string {
  if (n <= 0) return '₹0';
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
}

function pointsEarned(r: Reservation): number {
  return Math.floor(r.totalAmount / 100) * 10;
}

const TIER_LABEL: Record<string, string> = {
  BRONZE: 'Bronze Tier',
  SILVER: 'Silver Tier',
  GOLD: 'Gold Tier',
  PLATINUM: 'Obsidian Circle',
};

const NEXT_TIER: Record<string, string> = {
  BRONZE: 'Silver',
  SILVER: 'Gold',
  GOLD: 'Obsidian',
  PLATINUM: 'Noir',
};

function tierForGuest(t: string): string {
  return TIER_LABEL[t] ?? `${t.charAt(0)}${t.slice(1).toLowerCase()} Tier`;
}

function nextTier(t: string): string {
  return NEXT_TIER[t] ?? 'Next';
}

function loyaltyProgress(points: number): number {
  const ladders = [0, 1000, 5000, 15000, 50000];
  for (let i = 0; i < ladders.length - 1; i++) {
    const lo = ladders[i] as number;
    const hi = ladders[i + 1] as number;
    if (points < hi) return (points - lo) / (hi - lo);
  }
  return 1;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  mobileKeyWrap: { paddingHorizontal: 22, marginTop: 12, position: 'relative', zIndex: 4 },
  checkinPrompt: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.36)',
    backgroundColor: 'rgba(212,168,87,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkinPromptKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  checkinPromptText: {
    flex: 1,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
    paddingHorizontal: 8,
  },
  checkinPromptCta: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: Luxe.goldBright,
  },
  smartStack: { paddingHorizontal: 22, gap: 12 },
  societyLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  footnote: {
    marginTop: 36,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footnoteText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.muted,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
    pointerEvents: 'none',
  },
});
