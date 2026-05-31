import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { useContentStore } from '../../src/stores/content.store';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { PremiumScreen } from '../../src/components/luxe/PremiumScreen';

const FALLBACK_PAST_STAYS = [
  { room: 'Suite · Room 301', dates: 'Apr 12 → Apr 14, 2025', nights: 2, spend: 22600 },
  { room: 'Jr. Suite · Room 215', dates: 'Jan 06 → Jan 10, 2025', nights: 4, spend: 36800 },
  { room: 'Deluxe Double · Room 212', dates: 'Nov 22 → Nov 23, 2024', nights: 1, spend: 7100 },
  { room: 'Family Room · Room 108', dates: 'Aug 03 → Aug 05, 2024', nights: 2, spend: 16200 },
  { room: 'Executive Room · Room 104', dates: 'May 18 → May 20, 2024', nights: 2, spend: 11400 },
];

const PREFERENCES = [
  { icon: 'leaf-outline', label: 'Vegetarian' },
  { icon: 'flame-outline', label: 'Heater · 21°C' },
  { icon: 'bed-outline', label: 'Firm pillow' },
  { icon: 'newspaper-outline', label: 'The Hindu' },
  { icon: 'business-outline', label: 'High floor' },
] as const;

const TIER_LABEL: Record<string, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Obsidian',
};

const NEXT_TIER: Record<string, string> = {
  BRONZE: 'Silver',
  SILVER: 'Gold',
  GOLD: 'Obsidian',
  PLATINUM: 'Noir',
};

const TIER_LADDER = [0, 1000, 5000, 15000, 50000];

function tierProgress(points: number): number {
  for (let i = 0; i < TIER_LADDER.length - 1; i++) {
    const lo = TIER_LADDER[i]!;
    const hi = TIER_LADDER[i + 1]!;
    if (points < hi) return (points - lo) / (hi - lo);
  }
  return 1;
}

function pointsToNext(points: number): number {
  for (let i = 0; i < TIER_LADDER.length; i++) {
    if (points < TIER_LADDER[i]!) return TIER_LADDER[i]! - points;
  }
  return 0;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AccountScreen() {
  useLuxeFonts();
  const router = useRouter();
  const guest = useAuthStore((s) => s.guest);
  const logout = useAuthStore((s) => s.logout);
  const reservation = useReservationStore((s) => s.reservation);
  const apiPastStays = useContentStore((s) => s.pastStays);
  const fetchPastStays = useContentStore((s) => s.fetchPastStays);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    fetchPastStays();
  }, [fetchPastStays]);

  const confirmLogout = () => {
    setShowLogout(false);
    void logout();
  };

  const PAST_STAYS = apiPastStays && apiPastStays.length > 0 ? apiPastStays : FALLBACK_PAST_STAYS;
  const totalStays = PAST_STAYS.length;
  const totalNights = PAST_STAYS.reduce((a, s) => a + s.nights, 0);
  const lifetime = PAST_STAYS.reduce((a, s) => a + s.spend, 0);
  const points = guest?.loyaltyPoints ?? 0;
  const tier = guest?.loyaltyTier ?? 'BRONZE';
  const staying = reservation?.status === 'checked_in';
  const suite = reservation?.room?.roomNumber;

  return (
    <View style={styles.root}>
      <PremiumScreen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>Account</Text>

          {/* PROFILE HERO */}
          <View style={styles.hero}>
            <LinearGradient
              colors={['#2A2316', '#1A1610']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <LinearGradient
              colors={['rgba(244,201,126,0.18)', 'transparent']}
              locations={[0, 0.7]}
              start={{ x: 0.95, y: 0 }}
              end={{ x: 0.1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
            />
            <View style={styles.heroTop}>
              <View style={styles.monogram}>
                <LinearGradient
                  colors={['#F4C97E', '#D4A857', '#9A7A3F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.monogramText}>{initials(guest?.fullName || 'Guest')}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {guest?.fullName || 'Guest'}
                </Text>
                <View style={styles.tierPill}>
                  <Ionicons name="trophy" size={10} color={Luxe.goldBright} />
                  <Text style={styles.tierPillText}>{TIER_LABEL[tier] ?? tier} member</Text>
                </View>
              </View>
            </View>

            {staying && (
              <View style={styles.stayingRow}>
                <PulsingDot />
                <Text style={styles.stayingText}>
                  Currently staying{suite ? ` · Suite ${suite}` : ''}
                </Text>
              </View>
            )}

            {/* STATS */}
            <View style={styles.statStrip}>
              <Stat value={String(totalStays)} label="Stays" />
              <View style={styles.statDivider} />
              <Stat value={String(totalNights)} label="Nights" />
              <View style={styles.statDivider} />
              <Stat value={`₹${Math.round(lifetime / 1000)}k`} label="Lifetime" />
              <View style={styles.statDivider} />
              <Stat value={points.toLocaleString('en-IN')} label="Points" />
            </View>

            {/* TIER PROGRESS */}
            <TierBar points={points} tier={tier} />
          </View>

          <Section label="Profile">
            <Row label="Name" value={guest?.fullName ?? '—'} />
            <Row label="Phone" value={guest?.phone ?? '—'} />
            <Row label="Email" value={guest?.email ?? 'Add an email'} subtle={!guest?.email} />
            <Row label="Language" value="English (India)" />
          </Section>

          <Section label="Loyalty">
            <Pressable onPress={() => router.push('/(app)/loyalty')} style={styles.cardRow}>
              <View style={styles.tierMark}>
                <Ionicons name="trophy" size={16} color={Luxe.goldBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{guest?.loyaltyTier ?? 'BRONZE'} member</Text>
                <Text style={styles.cardMeta}>
                  {(guest?.loyaltyPoints ?? 0).toLocaleString('en-IN')} points
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Luxe.titanium} />
            </Pressable>
          </Section>

          <Section label="Preferences">
            <View style={styles.chipRow}>
              {PREFERENCES.map((p) => (
                <View key={p.label} style={styles.chip}>
                  <Ionicons name={p.icon} size={12} color={Luxe.goldBright} />
                  <Text style={styles.chipText}>{p.label}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section label="Payment methods">
            <View style={styles.cardRow}>
              <Ionicons name="card-outline" size={20} color={Luxe.ivory} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>HDFC •••• 4248</Text>
                <Text style={styles.cardMeta}>Default · Expires 04/29</Text>
              </View>
            </View>
            <View style={[styles.cardRow, { marginTop: 8 }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={Luxe.ivory} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>rohith@upi</Text>
                <Text style={styles.cardMeta}>UPI · Verified</Text>
              </View>
            </View>
          </Section>

          <Section label="Past stays">
            {PAST_STAYS.map((s, i) => (
              <View key={s.dates} style={[styles.stayRow, i === 0 && styles.stayFirst]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stayTitle}>Hotel Kodai International</Text>
                  <Text style={styles.stayRoom}>{s.room}</Text>
                  <Text style={styles.stayMeta}>
                    {s.dates} · {s.nights} {s.nights === 1 ? 'night' : 'nights'}
                  </Text>
                </View>
                <Text style={styles.staySpend}>₹{s.spend.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </Section>

          <Section label="Your hotel">
            <View style={styles.hotelCard}>
              <LinearGradient
                colors={['rgba(244,201,126,0.10)', 'rgba(139,111,71,0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <View style={styles.hotelCardRow}>
                <Ionicons name="business-outline" size={18} color={Luxe.goldBright} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotelCardName}>Kodai International</Text>
                  <Text style={styles.hotelCardSub}>The Largest Resort in Kodaikanal · ESTEJI Hotels</Text>
                </View>
              </View>
              <View style={styles.hotelCardDivider} />
              <View style={styles.hotelCardRow}>
                <Ionicons name="location-outline" size={16} color={Luxe.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotelCardDetail}>17/328 Lawsghat Road</Text>
                  <Text style={styles.hotelCardMeta}>Kodaikanal · Tamil Nadu 624 101</Text>
                </View>
              </View>
              <View style={[styles.hotelCardRow, { marginTop: 10 }]}>
                <Ionicons name="call-outline" size={16} color={Luxe.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotelCardDetail}>+91 9944945190</Text>
                  <Text style={styles.hotelCardMeta}>Mobile · Landline +91 4542 245190</Text>
                </View>
              </View>
              <View style={[styles.hotelCardRow, { marginTop: 10 }]}>
                <Ionicons name="mail-outline" size={16} color={Luxe.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hotelCardDetail}>reservations@hki.co.in</Text>
                  <Text style={styles.hotelCardMeta}>Reservations · sales@hki.co.in</Text>
                </View>
              </View>
            </View>
          </Section>

          <Section label="Help & support">
            <Pressable style={styles.cardRow} onPress={() => router.push('/(app)/concierge')}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={Luxe.ivory} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>Chat with concierge</Text>
              <Ionicons name="chevron-forward" size={18} color={Luxe.titanium} />
            </Pressable>
            <Pressable
              onPress={() => {
                void Linking.openURL('tel:+919944945190');
              }}
              style={[styles.cardRow, { marginTop: 8 }]}
            >
              <Ionicons name="call-outline" size={20} color={Luxe.ivory} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Call reception</Text>
                <Text style={styles.cardMeta}>+91 9944945190 · 24 hr</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Luxe.titanium} />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/concierge',
                  params: { prefill: 'I have a question about my stay — ' },
                })
              }
              style={[styles.cardRow, { marginTop: 8 }]}
            >
              <Ionicons name="document-text-outline" size={20} color={Luxe.ivory} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>Guest FAQ</Text>
              <Ionicons name="open-outline" size={16} color={Luxe.titanium} />
            </Pressable>
          </Section>

          <Pressable onPress={() => setShowLogout(true)} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={Luxe.ivoryDim} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      </PremiumScreen>

      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalBody}>
              You'll need your phone number to sign back in.
            </Text>
            <View style={styles.modalRow}>
              <Pressable onPress={() => setShowLogout(false)} style={styles.modalSecondary}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmLogout} style={styles.modalPrimary}>
                <Text style={styles.modalPrimaryText}>Sign out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, subtle && { color: Luxe.muted }]}>{value}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PulsingDot() {
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
  const opacity = pulse.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.6, 0.15, 0] });
  return (
    <View style={{ width: 7, height: 7, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: Luxe.goldBright,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: Luxe.goldBright,
          shadowColor: Luxe.amberGlow,
          shadowOpacity: 0.8,
          shadowRadius: 4,
        }}
      />
    </View>
  );
}

function TierBar({ points, tier }: { points: number; tier: string }) {
  const target = tierProgress(points);
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [target, anim]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const remaining = pointsToNext(points);
  const next = NEXT_TIER[tier] ?? 'Next';

  return (
    <View style={styles.tierBarWrap}>
      <View style={styles.tierBarHead}>
        <Text style={styles.tierBarLabel}>
          {remaining > 0 ? `${remaining.toLocaleString('en-IN')} pts to ${next}` : 'Top tier reached'}
        </Text>
        <Text style={styles.tierBarPct}>{Math.round(target * 100)}%</Text>
      </View>
      <View style={styles.tierBarTrack}>
        <Animated.View style={[styles.tierBarFill, { width }]}>
          <LinearGradient
            colors={['#9A7A3F', '#F4C97E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140 },
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
    marginTop: 6,
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },

  // PROFILE HERO
  hero: {
    marginTop: 14,
    padding: 22,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,201,126,0.28)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  monogram: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  monogramText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    color: '#1A1206',
    letterSpacing: 0.5,
  },
  heroName: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    color: Luxe.ivory,
    letterSpacing: -0.8,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.3)',
  },
  tierPillText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.goldBright,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 16,
  },
  stayingText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,240,210,0.1)',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: LuxeFonts.serif, fontSize: 19, color: Luxe.ivory, letterSpacing: -0.4 },
  statLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 8,
    color: Luxe.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: 'rgba(255,240,210,0.1)' },

  // TIER BAR
  tierBarWrap: { marginTop: 20 },
  tierBarHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  tierBarLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tierBarPct: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivoryDim,
    letterSpacing: 0.6,
  },
  tierBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,240,210,0.08)',
    overflow: 'hidden',
  },
  tierBarFill: { height: 6, borderRadius: 3, overflow: 'hidden' },

  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  rowLabel: { fontFamily: LuxeFonts.mono, fontSize: 11, color: Luxe.titanium, letterSpacing: 1.2 },
  rowValue: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivory },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
  },
  cardTitle: { fontFamily: LuxeFonts.sansMedium, fontSize: 14, color: Luxe.ivory },
  cardMeta: {
    marginTop: 3,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: Luxe.titanium,
  },
  tierMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.20)',
  },
  chipText: { fontFamily: LuxeFonts.mono, fontSize: 11, color: Luxe.ivoryDim },
  stayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  stayFirst: { borderTopWidth: 0 },
  stayTitle: { fontFamily: LuxeFonts.sansMedium, fontSize: 14, color: Luxe.ivory },
  stayRoom: {
    marginTop: 2,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    color: Luxe.gold,
  },
  stayMeta: {
    marginTop: 3,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: Luxe.titanium,
  },
  staySpend: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.amberGlow },

  hotelCard: {
    padding: 18, borderRadius: 16, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.22)',
    backgroundColor: '#0C0A08',
  },
  hotelCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hotelCardDivider: {
    height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,240,210,0.09)',
    marginVertical: 14,
  },
  hotelCardName: { fontFamily: LuxeFonts.serif, fontSize: 16, color: Luxe.ivory, letterSpacing: -0.3 },
  hotelCardSub: { fontFamily: LuxeFonts.mono, fontSize: 10, color: Luxe.gold, letterSpacing: 0.6, marginTop: 2 },
  hotelCardDetail: { fontFamily: LuxeFonts.sansMedium, fontSize: 13, color: Luxe.ivoryDim },
  hotelCardMeta: { fontFamily: LuxeFonts.mono, fontSize: 10, color: Luxe.muted, letterSpacing: 0.5, marginTop: 2 },
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 22,
    backgroundColor: Luxe.surfaceTop,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  modalTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  modalBody: {
    marginTop: 8,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
  },
  modalRow: { marginTop: 22, flexDirection: 'row', gap: 8 },
  modalSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
  },
  modalSecondaryText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modalPrimary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Luxe.goldBright,
  },
  modalPrimaryText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    color: '#1A1410',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
