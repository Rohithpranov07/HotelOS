import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaffStore, type GuestProfileFull } from '../../src/stores/staff.store';
import {
  computeRepeatGuestPrompt,
  computeSentimentScore,
  computeUpsellFlags,
} from '../../src/lib/guestIntelligence';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

export default function GuestIntelligenceScreen() {
  useLuxeFonts();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fetchGuestProfile = useStaffStore((s) => s.fetchGuestProfile);
  const fetchGuestBrief = useStaffStore((s) => s.fetchGuestBrief);

  const [profile, setProfile] = useState<GuestProfileFull | null>(null);
  const [brief, setBrief] = useState<string>('');
  const [briefLoading, setBriefLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const p = await fetchGuestProfile(id);
      if (!cancelled) setProfile(p);
      setBriefLoading(true);
      const b = await fetchGuestBrief(id);
      if (!cancelled) {
        setBrief(b);
        setBriefLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fetchGuestProfile, fetchGuestBrief]);

  if (!profile) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Luxe.goldBright} />
      </View>
    );
  }

  const sentiment = computeSentimentScore(profile);
  const upsells = computeUpsellFlags(profile);
  const repeat = computeRepeatGuestPrompt(profile);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassPill}>
            <Ionicons name="chevron-back" size={18} color={Luxe.ivory} />
          </Pressable>
          <View style={styles.tierChip}>
            <Text style={styles.tierText}>{profile.loyaltyTier}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>Guest Intelligence</Text>
          <Text style={styles.title}>{profile.fullName}</Text>
          <Text style={styles.subhead}>
            {profile.totalStays} stays · ₹{(profile.lifetimeValue / 100000).toFixed(1)}L lifetime value
          </Text>

          <View style={[styles.repeatBanner, repeat.isRepeat ? styles.repeatBannerLoyal : styles.repeatBannerNew]}>
            <Ionicons
              name={repeat.isRepeat ? 'sparkles' : 'add-circle-outline'}
              size={14}
              color={repeat.isRepeat ? Luxe.goldBright : Luxe.ivory}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.repeatBadge}>{repeat.badge.toUpperCase()}</Text>
              <Text style={styles.repeatMessage}>{repeat.message}</Text>
            </View>
          </View>

          {/* AI brief */}
          <View style={styles.briefCard}>
            <LinearGradient
              colors={['rgba(244,201,126,0.14)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.sectionLabel}>AI Brief</Text>
            {briefLoading ? (
              <ActivityIndicator color={Luxe.goldBright} style={{ marginTop: 14 }} />
            ) : (
              <Text style={styles.briefText}>{brief}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sentiment</Text>
            <View style={styles.sentimentCard}>
              <View style={styles.sentimentHead}>
                <Text style={[styles.sentimentValue, sentimentTint(sentiment.tint)]}>
                  {sentiment.score}
                </Text>
                <Text style={styles.sentimentScale}>/ 100</Text>
                <View style={{ flex: 1 }} />
                <Text style={[styles.sentimentLabel, sentimentTint(sentiment.tint)]}>
                  {sentiment.label.toUpperCase()}
                </Text>
              </View>
              <View style={styles.sentimentTrack}>
                <View
                  style={[
                    styles.sentimentFill,
                    sentimentBarTint(sentiment.tint),
                    { width: `${sentiment.score}%` },
                  ]}
                />
              </View>
              <Text style={styles.sentimentFoot}>
                {sentiment.sampleSize === 0
                  ? 'No feedback on file — score is a neutral baseline.'
                  : `Based on ${sentiment.sampleSize} recent rating${sentiment.sampleSize === 1 ? '' : 's'}.`}
              </Text>
            </View>
          </View>

          {upsells.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Upsell opportunities</Text>
              {upsells.map((u) => (
                <View key={u.id} style={styles.upsellCard}>
                  <View style={styles.upsellHead}>
                    <View style={[styles.weightDot, weightDotTint(u.weight)]} />
                    <Text style={styles.upsellTitle}>{u.title}</Text>
                  </View>
                  <Text style={styles.upsellBody}>{u.body}</Text>
                  <Text style={styles.upsellCta}>{u.cta.toUpperCase()} →</Text>
                </View>
              ))}
            </View>
          ) : null}

          {profile.currentStay ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Current stay</Text>
              <Text style={styles.bodyText}>
                Room {profile.currentStay.roomNumber} · {profile.currentStay.checkInDate} → {profile.currentStay.checkOutDate}
              </Text>
              <Text style={styles.balance}>
                Balance due ₹{profile.currentStay.balanceDue.toLocaleString('en-IN')}
              </Text>
            </View>
          ) : null}

          {profile.activeOrders.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Active orders ({profile.activeOrders.length})</Text>
              {profile.activeOrders.map((o) => (
                <View key={o.id} style={styles.orderRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.bodyText}>{o.description}</Text>
                  <Text style={styles.statusText}>{o.status.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Preferences</Text>
            <View style={styles.chipRow}>
              {profile.preferences.dietary?.map((d) => (
                <Pill key={d} icon="leaf-outline" label={d} />
              ))}
              {profile.preferences.roomTemperature ? (
                <Pill icon="thermometer-outline" label={`${profile.preferences.roomTemperature}°C`} />
              ) : null}
              {profile.preferences.pillowFirmness ? (
                <Pill icon="bed-outline" label={profile.preferences.pillowFirmness} />
              ) : null}
              {profile.preferences.newspaper ? (
                <Pill icon="newspaper-outline" label={profile.preferences.newspaper} />
              ) : null}
              {profile.preferences.floor ? (
                <Pill icon="business-outline" label={`${profile.preferences.floor} floor`} />
              ) : null}
            </View>
          </View>

          {profile.recentFeedback.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recent feedback</Text>
              {profile.recentFeedback.map((f, i) => (
                <View key={i} style={styles.feedbackRow}>
                  <Text style={styles.stars}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</Text>
                  <Text style={styles.feedback}>{f.comment}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function sentimentTint(tint: 'positive' | 'neutral' | 'negative') {
  if (tint === 'positive') return { color: Luxe.goldBright };
  if (tint === 'negative') return { color: '#E27A6E' };
  return { color: Luxe.ivoryDim };
}

function sentimentBarTint(tint: 'positive' | 'neutral' | 'negative') {
  if (tint === 'positive') return { backgroundColor: Luxe.goldBright };
  if (tint === 'negative') return { backgroundColor: '#E27A6E' };
  return { backgroundColor: Luxe.titanium };
}

function weightDotTint(w: 'high' | 'medium' | 'low') {
  if (w === 'high') return { backgroundColor: Luxe.goldBright };
  if (w === 'medium') return { backgroundColor: Luxe.amberGlow };
  return { backgroundColor: Luxe.titanium };
}

function Pill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color={Luxe.goldBright} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  glassPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  tierText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Luxe.goldBright,
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },
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
    fontSize: 38,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  subhead: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
  briefCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
  },
  briefText: {
    marginTop: 12,
    fontFamily: LuxeFonts.serif,
    fontSize: 16,
    lineHeight: 24,
    color: Luxe.ivory,
  },
  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  bodyText: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivoryDim, lineHeight: 21 },
  balance: {
    marginTop: 6,
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    color: Luxe.amberGlow,
    letterSpacing: -0.4,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Luxe.goldBright,
  },
  statusText: {
    marginLeft: 'auto',
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Luxe.titanium,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
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
  pillText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
  feedbackRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  stars: { fontFamily: LuxeFonts.mono, fontSize: 13, color: Luxe.goldBright, letterSpacing: 2 },
  feedback: {
    marginTop: 4,
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 14,
    color: Luxe.ivoryDim,
  },
  repeatBanner: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
  },
  repeatBannerLoyal: {
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderColor: 'rgba(244,201,126,0.30)',
  },
  repeatBannerNew: {
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderColor: 'rgba(255,240,210,0.12)',
  },
  repeatBadge: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.goldBright,
    marginBottom: 4,
  },
  repeatMessage: {
    fontFamily: LuxeFonts.sans,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
    lineHeight: 18,
  },
  sentimentCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
  },
  sentimentHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 14,
  },
  sentimentValue: { fontFamily: LuxeFonts.serif, fontSize: 36, letterSpacing: -1 },
  sentimentScale: { fontFamily: LuxeFonts.mono, fontSize: 12, color: Luxe.muted },
  sentimentLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  sentimentTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,240,210,0.06)',
    overflow: 'hidden',
  },
  sentimentFill: { height: '100%', borderRadius: 999 },
  sentimentFoot: {
    marginTop: 10,
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    color: Luxe.titanium,
    letterSpacing: 0.4,
  },
  upsellCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    marginBottom: 10,
  },
  upsellHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  weightDot: { width: 8, height: 8, borderRadius: 4 },
  upsellTitle: {
    flex: 1,
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13.5,
    color: Luxe.ivory,
    letterSpacing: 0.2,
  },
  upsellBody: {
    fontFamily: LuxeFonts.sans,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
    lineHeight: 18,
  },
  upsellCta: {
    marginTop: 10,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
  },
});
