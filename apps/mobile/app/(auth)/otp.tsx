import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MASTER_OTP, useAuthStore } from '../../src/stores/auth.store';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';

const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const OTP_LENGTH = 6;

export default function OtpVerificationScreen() {
  useLuxeFonts();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    fullName?: string;
    email?: string;
  }>();
  const phone = params.phone ?? '';
  const passedName = (params.fullName ?? '').toString();
  const passedEmail = (params.email ?? '').toString();

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const verifyingRef = useRef(false);
  const hiddenInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // autofocus the invisible input that drives the digit boxes
  useEffect(() => {
    const t = setTimeout(() => hiddenInputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const handleComplete = useCallback(
    async (code: string) => {
      if (verifyingRef.current || code.length !== OTP_LENGTH) return;
      verifyingRef.current = true;
      setError(null);
      try {
        await verifyOtp(phone, code);

        // Persist optional name/email collected on the login screen.
        const patch: { fullName?: string; email?: string } = {};
        if (passedName) patch.fullName = passedName;
        if (passedEmail) patch.email = passedEmail;
        if (Object.keys(patch).length > 0) {
          const state = useAuthStore.getState();
          if (state.guest) {
            useAuthStore.setState({
              guest: {
                ...state.guest,
                fullName: patch.fullName || state.guest.fullName,
                email: patch.email || state.guest.email,
              },
            });
          }
        }

        router.replace('/(app)/home');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Incorrect OTP';
        const left = Math.max(0, attemptsLeft - 1);
        setAttemptsLeft(left);
        setError(
          left > 0
            ? `${message} · ${left} attempt${left === 1 ? '' : 's'} left`
            : 'Too many incorrect attempts. Request a new code.',
        );
        setOtp('');
      } finally {
        verifyingRef.current = false;
      }
    },
    [attemptsLeft, phone, passedName, passedEmail, router, verifyOtp],
  );

  const onChangeText = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (digits.length === OTP_LENGTH) handleComplete(digits);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setOtp('');
    setAttemptsLeft(MAX_ATTEMPTS);
    try {
      const { expiresInSeconds } = await sendOtp(phone);
      setCountdown(expiresInSeconds || RESEND_SECONDS);
      hiddenInputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend code');
    }
  };

  const maskedPhone = formatPhone(phone);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A130A', '#0A0807', Luxe.obsidian]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(244,201,126,0.24)', 'rgba(244,201,126,0.06)', 'transparent']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.85, y: 0.55 }}
        style={styles.ambient}
        pointerEvents="none"
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={styles.backBtn}
              >
                <Ionicons name="chevron-back" size={20} color={Luxe.ivory} />
              </Pressable>
              <Text style={styles.kicker}>Verify</Text>
              <View style={{ width: 38 }} />
            </View>

            <View style={styles.body}>
              <Animated.View entering={FadeIn.duration(520)}>
                <Text style={styles.heroLine}>One last</Text>
                <Text style={styles.heroLine}>
                  <Text style={styles.heroItalic}>moment</Text> of trust.
                </Text>
                <Text style={styles.sub}>
                  We sent a 6-digit code to{' '}
                  <Text style={styles.phoneText}>{maskedPhone}</Text>
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(560).delay(120)}>
                <Pressable
                  onPress={() => hiddenInputRef.current?.focus()}
                  style={styles.boxRow}
                  unstable_pressDelay={100}
                >
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const ch = otp[i] ?? '';
                    const isCursor = i === otp.length;
                    const isFilled = !!ch;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.box,
                          isFilled && styles.boxFilled,
                          isCursor && styles.boxCursor,
                          error && styles.boxError,
                        ]}
                      >
                        <Text style={styles.boxDigit}>{ch}</Text>
                        {isCursor && !isLoading && !error ? (
                          <View style={styles.caret} />
                        ) : null}
                      </View>
                    );
                  })}
                </Pressable>

                {/* invisible input driving the boxes */}
                <TextInput
                  ref={hiddenInputRef}
                  value={otp}
                  onChangeText={onChangeText}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  style={styles.hiddenInput}
                  caretHidden
                />
              </Animated.View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#E27A6E" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : isLoading ? (
                <Text style={styles.verifyingText}>Verifying…</Text>
              ) : null}

              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.resendMuted}>
                    Resend code in <Text style={styles.resendTimer}>{countdown}s</Text>
                  </Text>
                ) : (
                  <Pressable
                    onPress={handleResend}
                    hitSlop={8}
                    unstable_pressDelay={100}
                  >
                    <Text style={styles.resendActive}>Resend code</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => onChangeText(MASTER_OTP)}
                unstable_pressDelay={120}
                style={styles.masterHint}
              >
                <Ionicons name="sparkles-outline" size={12} color={Luxe.amberGlow} />
                <Text style={styles.masterHintText}>
                  Demo build · tap to use master code{' '}
                  <Text style={styles.masterHintCode}>{MASTER_OTP}</Text>
                </Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                unstable_pressDelay={100}
              >
                <Text style={styles.changeNumber}>Use a different number</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
}

function formatPhone(p: string) {
  // +91XXXXXXXXXX → +91 XXXXX XXXXX
  const m = p.match(/^(\+\d{1,3})(\d{5})(\d{5})$/);
  if (!m) return p;
  return `${m[1]} ${m[2]} ${m[3]}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  flex: { flex: 1 },
  ambient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 360,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  heroLine: {
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
  sub: {
    marginTop: 14,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
  },
  phoneText: {
    fontFamily: LuxeFonts.monoMedium,
    color: Luxe.ivory,
    letterSpacing: 0.4,
  },

  boxRow: {
    marginTop: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,15,0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: 'rgba(244,201,126,0.40)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  boxCursor: {
    borderColor: Luxe.goldBright,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  boxError: {
    borderColor: 'rgba(226,122,110,0.55)',
    backgroundColor: 'rgba(226,122,110,0.05)',
  },
  boxDigit: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    color: Luxe.ivory,
    letterSpacing: -0.4,
  },
  caret: {
    position: 'absolute',
    bottom: 14,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: Luxe.goldBright,
  },

  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  errorRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  errorText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    color: '#E27A6E',
    letterSpacing: 0.3,
  },
  verifyingText: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    letterSpacing: 1.4,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },

  resendRow: { marginTop: 28, alignItems: 'center' },
  resendMuted: {
    fontFamily: LuxeFonts.mono,
    fontSize: 12,
    color: Luxe.muted,
    letterSpacing: 0.4,
  },
  resendTimer: { color: Luxe.ivoryDim },
  resendActive: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    color: Luxe.goldBright,
    textTransform: 'uppercase',
  },

  masterHint: {
    marginTop: 22,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.22)',
  },
  masterHintText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: Luxe.ivoryDim,
  },
  masterHintCode: {
    fontFamily: LuxeFonts.monoMedium,
    color: Luxe.amberGlow,
    letterSpacing: 1.4,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  changeNumber: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
});
