import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, LoadingSpinner, OtpInput } from '@hotel-os/ui';
import { useAuthStore } from '../../src/stores/auth.store';

const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone ?? '';

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleComplete = useCallback(
    async (code: string) => {
      if (verifyingRef.current || code.length !== 6) return;
      verifyingRef.current = true;
      setError(undefined);
      try {
        await verifyOtp(phone, code);
        router.replace('/(app)/home');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Incorrect OTP';
        const left = Math.max(0, attemptsLeft - 1);
        setAttemptsLeft(left);
        setError(
          left > 0
            ? `${message}. ${left} attempt${left === 1 ? '' : 's'} remaining`
            : 'Too many incorrect attempts. Please request a new code.',
        );
        setOtp('');
      } finally {
        verifyingRef.current = false;
      }
    },
    [attemptsLeft, phone, router, verifyOtp],
  );

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(undefined);
    setOtp('');
    setAttemptsLeft(MAX_ATTEMPTS);
    try {
      const { expiresInSeconds } = await sendOtp(phone);
      setCountdown(expiresInSeconds || RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend code');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to <Text style={styles.phone}>{phone}</Text>
          </Text>

          <View style={styles.otpWrap}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={handleComplete}
              error={!!error}
              disabled={isLoading || attemptsLeft <= 0}
            />
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <LoadingSpinner size="small" />
              <Text style={styles.loadingText}>Verifying…</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.resendMuted}>
                Resend code in {countdown}s
              </Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={8}>
                <Text style={styles.resendActive}>Resend OTP</Text>
              </Pressable>
            )}
          </View>

          <View style={{ flex: 1 }} />

          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.changeNumber}>Change phone number</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.navy },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  phone: { color: Colors.text, fontWeight: '600' },
  otpWrap: { marginTop: 32 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  loadingText: { color: Colors.textSecondary, fontSize: 13 },
  error: { color: Colors.danger, fontSize: 13, marginTop: 16 },
  resendRow: { marginTop: 24, alignItems: 'center' },
  resendMuted: { color: Colors.textTertiary, fontSize: 13 },
  resendActive: { color: Colors.teal, fontSize: 14, fontWeight: '600' },
  changeNumber: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
