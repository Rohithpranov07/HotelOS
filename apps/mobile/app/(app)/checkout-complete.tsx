import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useLoyaltyStore } from '../../src/stores/loyalty.store';
import { storage } from '../../src/lib/storage';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const SHOWN_KEY_PREFIX = 'checkout_modal_shown:';

export function markCheckoutModalShown(reservationId: string): void {
  storage.set(`${SHOWN_KEY_PREFIX}${reservationId}`, '1');
}

export function hasShownCheckoutModal(reservationId: string): boolean {
  return storage.getString(`${SHOWN_KEY_PREFIX}${reservationId}`) === '1';
}

export default function CheckoutCompleteScreen() {
  useLuxeFonts();
  const router = useRouter();
  const params = useLocalSearchParams<{
    reservationId?: string;
    pointsEarned?: string;
    newBalance?: string;
    invoiceUrl?: string;
  }>();
  const guest = useAuthStore((s) => s.guest);
  const summary = useLoyaltyStore((s) => s.summary);
  const fetchSummary = useLoyaltyStore((s) => s.fetchSummary);

  useEffect(() => {
    if (!summary) fetchSummary();
    if (params.reservationId) markCheckoutModalShown(params.reservationId);
  }, [summary, fetchSummary, params.reservationId]);

  const pointsEarned = Number(params.pointsEarned ?? summary?.thisStayEarned ?? 148);
  const newBalance =
    Number(params.newBalance ?? summary?.currentPoints ?? guest?.loyaltyPoints ?? 0);

  const onRate = () => {
    router.replace({
      pathname: '/(app)/feedback',
      params: params.reservationId ? { reservationId: params.reservationId } : {},
    });
  };

  const onInvoice = () => {
    router.replace('/(app)/folio');
  };

  const onHome = () => {
    router.replace('/(app)/home');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(244,201,126,0.18)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.markWrap}>
            <Ionicons name="checkmark" size={36} color="#1A1410" />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(120).duration(500)} style={styles.kicker}>
            STAY COMPLETE
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.title}>
            Thank you.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(280).duration(500)} style={styles.body}>
            You earned {pointsEarned.toLocaleString('en-IN')} points this stay.{'\n'}
            New balance: {newBalance.toLocaleString('en-IN')} points
          </Animated.Text>

          <View style={styles.actions}>
            <Pressable onPress={onRate} style={styles.primaryBtn}>
              <Ionicons name="star" size={16} color="#1A1410" />
              <Text style={styles.primaryBtnText}>Rate your stay</Text>
            </Pressable>
            <Pressable onPress={onInvoice} style={styles.secondaryBtn}>
              <Ionicons name="document-text-outline" size={16} color={Luxe.ivory} />
              <Text style={styles.secondaryBtnText}>Download invoice</Text>
            </Pressable>
            <Pressable onPress={onHome} style={styles.tertiaryBtn}>
              <Text style={styles.tertiaryBtnText}>Back to home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 60, gap: 16, alignItems: 'center' },
  markWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Luxe.goldBright,
    marginBottom: 12,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 2.4,
    color: Luxe.gold,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 52,
    lineHeight: 56,
    color: Luxe.ivory,
    letterSpacing: -1.6,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontFamily: LuxeFonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: Luxe.ivoryDim,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { marginTop: 36, width: '100%', gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: '#1A1410',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  secondaryBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13,
    color: Luxe.ivory,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tertiaryBtn: { paddingVertical: 14, alignItems: 'center' },
  tertiaryBtnText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
});
