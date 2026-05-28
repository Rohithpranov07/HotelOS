import { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Hero } from '../../src/components/luxe/Hero';
import { MobileKeyCard } from '../../src/components/luxe/MobileKeyCard';
import { StayTimeline, type TimelineItem } from '../../src/components/luxe/StayTimeline';
import { LuxeActionGrid, type LuxeAction } from '../../src/components/luxe/LuxeActionGrid';
import { SmartCard } from '../../src/components/luxe/SmartCard';
import { DiscoveryRail, type DiscoveryItem } from '../../src/components/luxe/DiscoveryRail';
import { LuxeLoyaltyCard } from '../../src/components/luxe/LuxeLoyaltyCard';
import { SectionHeader } from '../../src/components/luxe/SectionHeader';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { useAuthStore } from '../../src/stores/auth.store';
import { useReservationStore, type Reservation } from '../../src/stores/reservation.store';
import { hasShownCheckoutModal } from './checkout-complete';

const POLL_MS = 5 * 60 * 1000;

const DISCOVERY_BASE: DiscoveryItem[] = [
  {
    kicker: 'Tonight',
    title: 'Chef Aoyama\nat Kusa, 8:15',
    meta: 'Reserved',
    byline: 'A 7-course tasting in the cedar room',
    tone: 'amber',
  },
  {
    kicker: 'Cellar',
    title: 'A pour from\nthe private list',
    meta: '6 vintages',
    byline: 'Curated by sommelier Hiroshi Tanaka',
    tone: 'bronze',
  },
  {
    kicker: 'Spa',
    title: 'Onsen ritual\nat moonrise',
    meta: '21:00 slot',
    byline: 'Steam, cypress and stillness',
    tone: 'ink',
  },
  {
    kicker: 'Kyoto',
    title: 'Lantern walk\nthrough Gion',
    meta: '12 min',
    byline: 'After dinner — concierge will accompany',
    tone: 'ivory',
  },
];

const TIMELINE: TimelineItem[] = [
  { time: '17:30', label: 'Turndown', done: true },
  { time: '20:15', label: 'Dinner · Kusa', active: true },
  { time: '21:30', label: 'Onsen ritual' },
  { time: '23:00', label: 'Nightcap' },
];

export default function HomeScreen() {
  const fontsLoaded = useLuxeFonts();
  const guest = useAuthStore((s) => s.guest);
  const reservation = useReservationStore((s) => s.reservation);
  const fetchActiveReservation = useReservationStore((s) => s.fetchActiveReservation);
  const updateDnd = useReservationStore((s) => s.updateDnd);
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActiveReservation();
    }, [fetchActiveReservation]),
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
      kind: 'room-service',
      label: 'Room Service',
      sub: 'In-suite · 24h',
      badge: 'Open',
      onPress: () => router.push('/(app)/services'),
    },
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
      onPress: () => updateDnd(!(reservation?.isDnd ?? false)),
    },
    {
      kind: 'payments',
      label: 'Folio & Pay',
      sub: reservation ? `${formatBalance(reservation.balanceDue)} open` : 'View bill',
      onPress: () => router.push('/(app)/folio'),
    },
  ];

  void reservation;

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
            <StayTimeline items={TIMELINE} dayLabel={dayLabel(reservation) || 'Day 2 of 4'} />
          </View>

          {/* QUICK ACTIONS */}
          <View style={{ marginTop: 60 }}>
            <SectionHeader kicker="In reach" title="At a touch" right="04" />
            <LuxeActionGrid items={actions} />
          </View>

          {/* SMART CONTEXT */}
          <View style={{ marginTop: 60 }}>
            <SectionHeader kicker="Right now" title="Quiet intelligence" right="Live" />
            <View style={styles.smartStack}>
              <SmartCard
                kicker="In 12 minutes"
                title="Wagyu is plated and on its way to your suite."
                body="Hot sake follows a moment behind. Lighting dimmed to 14%."
                action="Track"
                live
              />
              <SmartCard
                kicker="Pool · West"
                title="Quiet now — two guests, water at 28°."
                body="Open until 23:00. Cabana 6 reserved under your name."
                action="Reserve"
                glow="ink"
              />
            </View>
          </View>

          {/* DISCOVERY */}
          <View style={{ marginTop: 64 }}>
            <SectionHeader kicker="The edit" title="Curated for tonight" right="See all" />
            <DiscoveryRail items={DISCOVERY_BASE} />
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
  mobileKeyWrap: { paddingHorizontal: 22, marginTop: -36, position: 'relative', zIndex: 4 },
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
