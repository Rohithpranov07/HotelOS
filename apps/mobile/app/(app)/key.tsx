import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Luxe, LuxeFonts, LuxeRadii } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { useReservationStore, type Reservation } from '../../src/stores/reservation.store';
import { useKeyStore, type KeyResponse } from '../../src/stores/key.store';
import { HoldToUnlockButton } from '../../src/components/HoldToUnlockButton';

import { DEMO_RESERVATION, DEMO_KEY } from '../../src/lib/demo';

export default function KeyScreen() {
  useLuxeFonts();
  const router = useRouter();
  const reservation = useReservationStore((s) => s.reservation);
  const fetchActive = useReservationStore((s) => s.fetchActiveReservation);
  const keyData = useKeyStore((s) => s.keyData);
  const unlockStatus = useKeyStore((s) => s.unlockStatus);
  const fetchKey = useKeyStore((s) => s.fetchKey);
  const unlockDoor = useKeyStore((s) => s.unlockDoor);
  const resetUnlock = useKeyStore((s) => s.resetUnlock);

  const shimmer = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchActive();
      if (reservation?.id) fetchKey(reservation.id);
    }, [fetchActive, fetchKey, reservation?.id]),
  );

  useEffect(() => {
    if (!reservation?.id) return;
    fetchKey(reservation.id);
    const interval = setInterval(() => {
      if (reservation?.id) fetchKey(reservation.id);
    }, 30_000);
    return () => clearInterval(interval);
  }, [reservation?.id, fetchKey]);

  useEffect(() => {
    if (keyData?.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 2200, useNativeDriver: false }),
          Animated.timing(shimmer, { toValue: 0, duration: 2200, useNativeDriver: false }),
        ]),
      ).start();
    }
  }, [keyData?.status, shimmer]);

  useEffect(() => {
    if (unlockStatus === 'success') {
      const t = setTimeout(resetUnlock, 2400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [unlockStatus, resetUnlock]);

  // Demo fallback so the screen renders fully when no live reservation is loaded.
  const effectiveReservation = reservation ?? DEMO_RESERVATION;
  const effectiveKey = keyData ?? (reservation ? null : DEMO_KEY);

  const status = effectiveKey?.status ?? 'not_applicable';
  const roomNumber =
    effectiveKey?.room_number ?? effectiveReservation.room?.roomNumber ?? '—';
  const validUntil = effectiveKey?.valid_until ? formatValidUntil(effectiveKey.valid_until) : null;
  const activatesAt = effectiveKey?.activates_at ? formatActivates(effectiveKey.activates_at) : null;

  const canUnlock = status === 'active' && unlockStatus !== 'success';
  const showCheckinPrompt =
    effectiveReservation.status === 'confirmed' && status !== 'active';

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Text style={styles.kicker}>Mobile Key</Text>
            <StatusPill status={status} />
          </View>

          <Text style={styles.roomLine}>
            Suite <Text style={styles.roomNumber}>{roomNumber}</Text>
          </Text>
          <Text style={styles.roomMeta}>
            {effectiveReservation.room?.floor != null
              ? `${ordinal(effectiveReservation.room.floor)} floor · `
              : ''}
            {effectiveReservation.room?.roomType ?? 'Deluxe King'}
          </Text>

          <KeyArt status={status} shimmer={shimmer} roomNumber={roomNumber} />

          <View style={styles.keyMetaCard}>
            {status === 'active' && validUntil ? (
              <View style={styles.metaRow}>
                <View style={styles.dot} />
                <Text style={styles.metaText}>Key active until {validUntil}</Text>
              </View>
            ) : null}
            {status === 'pending_activation' ? (
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: Luxe.ivoryDim }]} />
                <Text style={styles.metaText}>
                  {activatesAt ? `Activates ${activatesAt}` : 'Activates at check-in'}
                </Text>
              </View>
            ) : null}
            {status === 'revoked' ? (
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: '#7E6F5F' }]} />
                <Text style={styles.metaText}>Key expired — thank you for staying with us.</Text>
              </View>
            ) : null}
            {status === 'not_applicable' ? (
              <View style={styles.metaRow}>
                <View style={[styles.dot, { backgroundColor: Luxe.muted }]} />
                <Text style={styles.metaText}>Mobile key not provisioned yet.</Text>
              </View>
            ) : null}
          </View>

          {/* Unlock states */}
          <View style={{ paddingHorizontal: 22, marginTop: 22 }}>
            {unlockStatus === 'success' ? (
              <View style={styles.successCard}>
                <Ionicons name="checkmark-circle" size={26} color={Luxe.goldBright} />
                <Text style={styles.successTitle}>Unlocked</Text>
                <Text style={styles.successHint}>Welcome back to suite {roomNumber}.</Text>
              </View>
            ) : unlockStatus === 'scanning' || unlockStatus === 'connecting' || unlockStatus === 'unlocking' ? (
              <View style={styles.busyCard}>
                <ActivityIndicator color={Luxe.goldBright} />
                <Text style={styles.busyText}>
                  {unlockStatus === 'scanning'
                    ? 'Searching for the lock…'
                    : unlockStatus === 'connecting'
                      ? 'Connecting to lock…'
                      : 'Sending unlock signal…'}
                </Text>
              </View>
            ) : unlockStatus === 'error' ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={20} color="#E08B8B" />
                <Text style={styles.errorText}>Could not connect. Step closer to the door.</Text>
                <Pressable style={styles.retryBtn} onPress={resetUnlock}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <HoldToUnlockButton
                onUnlock={unlockDoor}
                disabled={!canUnlock}
                label={canUnlock ? 'Hold to Unlock' : 'Locked'}
              />
            )}
            <Text style={styles.proximityHint}>
              Stand within 1m of the door lock · Bluetooth required
            </Text>
          </View>

          {showCheckinPrompt ? (
            <Pressable
              onPress={() => router.push('/(app)/checkin')}
              style={styles.checkinCta}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaKicker}>Speed past the front desk</Text>
                <Text style={styles.ctaTitle}>Complete digital check-in</Text>
                <Text style={styles.ctaHint}>3 quick steps · ID, preferences, confirm</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Luxe.goldBright} />
            </Pressable>
          ) : null}

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>
              If the door doesn&apos;t respond after two attempts, the concierge can issue a one-time
              physical key from the front desk.
            </Text>
            <Pressable
              onPress={() => router.push('/(app)/concierge')}
              style={styles.helpBtn}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Luxe.goldBright} />
              <Text style={styles.helpBtnText}>Message concierge</Text>
            </Pressable>
          </View>
        </ScrollView>
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'active'
      ? { bg: 'rgba(212,168,87,0.18)', dot: Luxe.goldBright, label: 'Active' }
      : status === 'pending_activation'
        ? { bg: 'rgba(255,240,210,0.06)', dot: Luxe.ivoryDim, label: 'Pending' }
        : status === 'revoked'
          ? { bg: 'rgba(120,90,60,0.18)', dot: '#7E6F5F', label: 'Expired' }
          : { bg: 'rgba(255,240,210,0.04)', dot: Luxe.muted, label: 'N/A' };
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.pillText, { color: tone.dot }]}>{tone.label}</Text>
    </View>
  );
}

interface KeyArtProps {
  status: string;
  shimmer: Animated.Value;
  roomNumber: string;
}

function KeyArt({ status, shimmer, roomNumber }: KeyArtProps) {
  const active = status === 'active';
  const sheen = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30%', '120%'],
  });
  return (
    <View style={styles.artWrap}>
      <LinearGradient
        colors={active ? ['#26201A', '#15120D', '#0C0A08'] : ['#1A1814', '#121008', '#0A0907']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.artCard}
      >
        <View style={styles.artHairlineTop} />
        <View style={styles.artHairlineBottom} />

        {active ? (
          <Animated.View style={[styles.sheen, { left: sheen }]}>
            <LinearGradient
              colors={['transparent', 'rgba(244,201,126,0.18)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}

        <View style={styles.artChip}>
          <LinearGradient
            colors={active ? ['#F4C97E', '#D4A857', '#9A7A3F'] : ['#5C5448', '#3C3528', '#2A2418']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="key" size={26} color={active ? '#1B130A' : '#0E0B07'} />
        </View>
        <Text style={[styles.artLabel, !active && { color: Luxe.muted }]}>ROOM</Text>
        <Text style={[styles.artNumber, !active && { color: Luxe.ivoryDim }]}>{roomNumber}</Text>
        <Text style={styles.artFootnote}>
          {active ? 'Encrypted · Bluetooth' : 'Awaiting activation'}
        </Text>
      </LinearGradient>
    </View>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function formatValidUntil(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatActivates(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    color: Luxe.ivoryDim,
    marginTop: 14,
  },
  emptyHint: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    color: Luxe.muted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  roomLine: {
    fontFamily: LuxeFonts.serif,
    fontSize: 42,
    lineHeight: 46,
    color: Luxe.ivory,
    paddingHorizontal: 22,
    marginTop: 10,
    letterSpacing: -1,
  },
  roomNumber: { fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright },
  roomMeta: {
    paddingHorizontal: 22,
    marginTop: 4,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
  artWrap: { paddingHorizontal: 22, marginTop: 28 },
  artCard: {
    height: 230,
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingVertical: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(212,168,87,0.24)',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  artHairlineTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.45)',
  },
  artHairlineBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212,168,87,0.18)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
  },
  artChip: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.5)',
    marginBottom: 16,
  },
  artLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  artNumber: {
    fontFamily: LuxeFonts.serif,
    fontSize: 52,
    lineHeight: 56,
    color: Luxe.ivory,
    letterSpacing: -1.5,
    marginTop: 2,
  },
  artFootnote: {
    marginTop: 6,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
  keyMetaCard: {
    marginTop: 22,
    marginHorizontal: 22,
    padding: 14,
    borderRadius: LuxeRadii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Luxe.goldBright },
  metaText: { fontFamily: LuxeFonts.sans, fontSize: 13, color: Luxe.ivoryDim },
  successCard: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.42)',
    backgroundColor: 'rgba(212,168,87,0.10)',
    gap: 8,
  },
  successTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivory,
  },
  successHint: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    color: Luxe.ivoryDim,
  },
  busyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    height: 60,
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
  },
  busyText: { fontFamily: LuxeFonts.sansMedium, color: Luxe.ivory, fontSize: 13 },
  errorCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: LuxeRadii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224,139,139,0.32)',
    backgroundColor: 'rgba(224,139,139,0.08)',
    gap: 10,
  },
  errorText: { fontFamily: LuxeFonts.sans, color: '#E08B8B', fontSize: 13 },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(224,139,139,0.45)' },
  retryText: { fontFamily: LuxeFonts.sansMedium, color: '#E08B8B', fontSize: 12 },
  proximityHint: {
    marginTop: 14,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  checkinCta: {
    marginTop: 22,
    marginHorizontal: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.45)',
    backgroundColor: 'rgba(212,168,87,0.08)',
    gap: 16,
  },
  ctaKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  ctaTitle: { fontFamily: LuxeFonts.serif, fontSize: 19, color: Luxe.ivory, marginTop: 4 },
  ctaHint: { fontFamily: LuxeFonts.sansLight, fontSize: 12, color: Luxe.ivoryDim, marginTop: 4 },
  helpCard: {
    marginTop: 22,
    marginHorizontal: 22,
    padding: 18,
    borderRadius: LuxeRadii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.softBlack,
    gap: 10,
  },
  helpTitle: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  helpText: { fontFamily: LuxeFonts.sansLight, fontSize: 13, color: Luxe.ivoryDim, lineHeight: 19 },
  helpBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.45)',
    backgroundColor: 'rgba(212,168,87,0.06)',
  },
  helpBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.goldBright,
    letterSpacing: 0.4,
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
