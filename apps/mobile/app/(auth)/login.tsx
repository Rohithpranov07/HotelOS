import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const HKI_LOGO = require('../../assets/hki-icon.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '../../src/stores/auth.store';
import { Luxe, LuxeFonts, LuxeRadii } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';

type Mode = 'guest' | 'employee';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export default function LoginScreen() {
  useLuxeFonts();
  const router = useRouter();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [mode, setMode] = useState<Mode>('guest');

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const indicator = useSharedValue(0); // 0 = guest, 1 = employee
  const setSegment = (next: Mode) => {
    setMode(next);
    indicator.value = withTiming(next === 'guest' ? 0 : 1, {
      duration: 320,
      easing: EASE,
    });
    setError(null);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicator.value * (SEG_WIDTH / 2 - 4) },
    ],
  }));

  const submitGuest = async () => {
    setError(null);
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('That email doesn’t look right.');
      return;
    }
    const fullPhone = `+91${phone}`;
    try {
      await sendOtp(fullPhone);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: fullPhone,
          fullName: fullName.trim(),
          email: email.trim(),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send code.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Ambient amber + obsidian glow */}
      <LinearGradient
        colors={['#1A130A', '#0A0807', Luxe.obsidian]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(244,201,126,0.28)', 'rgba(244,201,126,0.08)', 'transparent']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0.92, y: 0 }}
        end={{ x: 0.15, y: 0.55 }}
        style={styles.ambient}
        pointerEvents="none"
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* ─── BRAND ─── */}
              <Animated.View entering={FadeIn.duration(620)} style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <LinearGradient
                    colors={['rgba(244,201,126,0.55)', 'rgba(154,122,63,0.10)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.brandMarkPlaque}>
                    <ExpoImage
                      source={HKI_LOGO}
                      style={styles.brandMarkLogo}
                      contentFit="contain"
                      transition={180}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.brandKicker}>Hotel Kodai · International</Text>
                  <Text style={styles.brandName}>Hotel OS</Text>
                </View>
              </Animated.View>

              {/* ─── HERO ─── */}
              <Animated.View entering={FadeInDown.duration(700).delay(80)}>
                <Text style={styles.heroLine1}>Welcome to your</Text>
                <Text style={styles.heroLine2}>
                  evening, <Text style={styles.heroItalic}>signed in.</Text>
                </Text>
                <Text style={styles.heroSub}>
                  Choose how you'd like to enter — guest stays or staff operations.
                </Text>
              </Animated.View>

              {/* ─── SEGMENTED MODE TOGGLE ─── */}
              <Animated.View entering={FadeIn.duration(540).delay(180)} style={styles.segmentWrap}>
                <View style={styles.segment}>
                  <Animated.View style={[styles.segmentIndicator, indicatorStyle]}>
                    <LinearGradient
                      colors={['#F4C97E', '#D4A857', '#9A7A3F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>

                  <Pressable
                    onPress={() => setSegment('guest')}
                    unstable_pressDelay={120}
                    style={styles.segmentItem}
                  >
                    <Ionicons
                      name="moon-outline"
                      size={14}
                      color={mode === 'guest' ? '#1A1206' : Luxe.titanium}
                    />
                    <Text
                      style={[
                        styles.segmentLabel,
                        mode === 'guest' && styles.segmentLabelActive,
                      ]}
                    >
                      Guest
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSegment('employee')}
                    unstable_pressDelay={120}
                    style={styles.segmentItem}
                  >
                    <Ionicons
                      name="key-outline"
                      size={14}
                      color={mode === 'employee' ? '#1A1206' : Luxe.titanium}
                    />
                    <Text
                      style={[
                        styles.segmentLabel,
                        mode === 'employee' && styles.segmentLabelActive,
                      ]}
                    >
                      Employee
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>

              {/* ─── PANEL ─── */}
              <View style={styles.panel}>
                {mode === 'guest' ? (
                  <GuestPanel
                    key="guest"
                    phone={phone}
                    setPhone={setPhone}
                    fullName={fullName}
                    setFullName={setFullName}
                    email={email}
                    setEmail={setEmail}
                    error={error}
                    isLoading={isLoading}
                    onSubmit={submitGuest}
                  />
                ) : (
                  <EmployeePanel key="employee" onContinue={() => router.push('/(auth)/staff-login')} />
                )}
              </View>

              <Text style={styles.legal}>
                By continuing, you agree to our{' '}
                <Text style={styles.legalLink}>Terms</Text> &{' '}
                <Text style={styles.legalLink}>Privacy Policy</Text>.
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   GUEST — phone + (first-time) name & email, sends OTP
   ───────────────────────────────────────────────────────────── */
function GuestPanel({
  phone,
  setPhone,
  fullName,
  setFullName,
  email,
  setEmail,
  error,
  isLoading,
  onSubmit,
}: {
  phone: string;
  setPhone: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  error: string | null;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  const [showFirstTime, setShowFirstTime] = useState(false);
  const canSubmit = phone.length === 10 && !isLoading;

  return (
    <Animated.View entering={FadeInDown.duration(420).easing(EASE)}>
      <Field label="Mobile number">
        <View style={styles.inputRow}>
          <View style={styles.dialBlock}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.dialText}>+91</Text>
          </View>
          <View style={styles.dialDivider} />
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            placeholderTextColor={Luxe.muted}
            keyboardType="number-pad"
            maxLength={10}
            autoFocus
            textContentType="telephoneNumber"
            style={styles.input}
          />
        </View>
      </Field>

      <Pressable
        onPress={() => setShowFirstTime((v) => !v)}
        unstable_pressDelay={120}
        hitSlop={6}
        style={styles.firstTimeToggle}
      >
        <Ionicons
          name={showFirstTime ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Luxe.goldBright}
        />
        <Text style={styles.firstTimeText}>
          {showFirstTime ? 'Hide first-time details' : 'First time here?'}
        </Text>
      </Pressable>

      {showFirstTime ? (
        <Animated.View entering={FadeInDown.duration(320).easing(EASE)}>
          <Field label="Your name">
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={16} color={Luxe.titanium} style={styles.inputIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Aanya Mehra"
                placeholderTextColor={Luxe.muted}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                style={styles.input}
              />
            </View>
          </Field>

          <Field label="Email">
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={16} color={Luxe.titanium} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="aanya@domain.com"
                placeholderTextColor={Luxe.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                style={styles.input}
              />
            </View>
          </Field>

          <Text style={styles.firstTimeHint}>
            We save these once, so reception knows you before you arrive.
          </Text>
        </Animated.View>
      ) : null}

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color="#E27A6E" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        unstable_pressDelay={120}
        style={[styles.cta, !canSubmit && styles.ctaDisabled]}
      >
        <LinearGradient
          colors={['#F4C97E', '#E8B466', '#D4A857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        {isLoading ? (
          <ActivityIndicator color="#1A1410" />
        ) : (
          <>
            <Text style={styles.ctaText}>Send verification code</Text>
            <Ionicons name="arrow-forward" size={16} color="#1A1410" />
          </>
        )}
      </Pressable>

      <View style={styles.privacyRow}>
        <Ionicons name="shield-checkmark-outline" size={12} color={Luxe.muted} />
        <Text style={styles.privacyText}>
          Number stays private — used only for one-time codes.
        </Text>
      </View>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPLOYEE — coming soon placeholder
   ───────────────────────────────────────────────────────────── */
function EmployeePanel({ onContinue }: { onContinue: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(420).easing(EASE)} style={styles.guestCard}>
      <LinearGradient
        colors={['rgba(244,201,126,0.10)', 'rgba(212,168,87,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: LuxeRadii.lg }]}
      />
      <Text style={styles.guestHeading}>
        Sign in to your{' '}
        <Text style={styles.guestHeadingItalic}>service line.</Text>
      </Text>
      <Text style={styles.guestBody}>
        Manager and on-floor team access — hotel-issued email + password with optional 2FA,
        property-scoped roles, and live task routing.
      </Text>

      <View style={styles.guestList}>
        <GuestListItem icon="mail-outline" label="Hotel-issued email & password" />
        <GuestListItem icon="shield-checkmark-outline" label="Optional 2FA for managers" />
        <GuestListItem icon="notifications-outline" label="Live alerts & task routing" />
      </View>

      <Pressable onPress={onContinue} style={staffCtaStyles.cta}>
        <Text style={staffCtaStyles.ctaText}>Continue to staff sign-in</Text>
        <Ionicons name="arrow-forward" size={15} color="#1A1410" />
      </Pressable>
    </Animated.View>
  );
}

const staffCtaStyles = StyleSheet.create({
  cta: {
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12.5,
    color: '#1A1410',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
});

function GuestListItem({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.guestListItem}>
      <View style={styles.guestListIcon}>
        <Ionicons name={icon} size={13} color={Luxe.goldBright} />
      </View>
      <Text style={styles.guestListLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const SEG_WIDTH = 280;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 28 },
  ambient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: 360,
  },

  /* brand */
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandMark: {
    width: 62,
    height: 62,
    borderRadius: 16,
    padding: 1.5,
    overflow: 'hidden',
    shadowColor: '#F4C97E',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  brandMarkPlaque: {
    flex: 1,
    borderRadius: 14.5,
    backgroundColor: '#F6EFE0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandMarkLogo: {
    width: '100%',
    height: '100%',
  },
  brandKicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
  brandName: {
    fontFamily: LuxeFonts.serifMedium,
    fontSize: 18,
    color: Luxe.ivory,
    marginTop: 2,
    letterSpacing: -0.2,
  },

  /* hero */
  heroLine1: {
    marginTop: 38,
    fontFamily: LuxeFonts.serif,
    fontSize: 38,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  heroLine2: {
    fontFamily: LuxeFonts.serif,
    fontSize: 38,
    lineHeight: 44,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  heroItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  heroSub: {
    marginTop: 14,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
    maxWidth: 320,
  },

  /* segment */
  segmentWrap: { marginTop: 30, alignItems: 'center' },
  segment: {
    width: SEG_WIDTH,
    height: 46,
    borderRadius: 999,
    backgroundColor: 'rgba(18,16,12,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.10)',
    flexDirection: 'row',
    padding: 4,
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: SEG_WIDTH / 2 - 4,
    height: 38,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#F4C97E',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 2,
  },
  segmentLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
  segmentLabelActive: { color: '#1A1206' },

  /* panel */
  panel: { marginTop: 26 },

  /* guest */
  guestCard: {
    padding: 22,
    borderRadius: LuxeRadii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.22)',
    overflow: 'hidden',
  },
  comingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  comingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Luxe.amberGlow,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  comingPillText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: Luxe.amberGlow,
    textTransform: 'uppercase',
  },
  guestHeading: {
    marginTop: 16,
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    lineHeight: 28,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  guestHeadingItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  guestBody: {
    marginTop: 10,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
  },
  guestList: { marginTop: 18, gap: 10 },
  guestListItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestListIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.25)',
  },
  guestListLabel: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    color: Luxe.ivory,
    letterSpacing: 0.1,
  },

  /* employee form */
  field: { marginTop: 18 },
  fieldLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,18,15,0.65)',
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.10)',
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: LuxeFonts.sans,
    fontSize: 15,
    color: Luxe.ivory,
    paddingVertical: 14,
  },
  eyeBtn: { paddingHorizontal: 4, paddingVertical: 4 },

  dialBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
  },
  dialDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: 'rgba(255,240,210,0.14)',
    marginRight: 10,
  },
  flag: { fontSize: 16 },
  dialText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 13,
    color: Luxe.ivory,
    letterSpacing: 0.6,
  },

  firstTimeToggle: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.22)',
  },
  firstTimeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Luxe.amberGlow,
    textTransform: 'uppercase',
  },
  firstTimeHint: {
    marginTop: 10,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 11.5,
    lineHeight: 17,
    color: Luxe.muted,
    letterSpacing: 0.2,
  },

  ctaDisabled: { opacity: 0.45, shadowOpacity: 0 },

  privacyRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: Luxe.muted,
  },

  errorRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    color: '#E27A6E',
    letterSpacing: 0.3,
  },

  cta: {
    marginTop: 24,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#F4C97E',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    letterSpacing: 1.6,
    color: '#1A1410',
    textTransform: 'uppercase',
  },
  forgot: { marginTop: 16, alignSelf: 'center' },
  forgotText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },

  legal: {
    marginTop: 28,
    textAlign: 'center',
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Luxe.muted,
    lineHeight: 16,
  },
  legalLink: { color: Luxe.gold },
});
