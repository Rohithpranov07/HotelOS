import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';

export default function StaffLoginScreen() {
  useLuxeFonts();
  const router = useRouter();
  const staffLogin = useAuthStore((s) => s.staffLogin);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password required');
      return;
    }
    try {
      await staffLogin(email.trim(), password, needsTotp ? totp.trim() : undefined);
      router.replace('/(staff)/tasks');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      if (/TOTP|2FA|code/i.test(msg)) {
        setNeedsTotp(true);
        setError('Enter your 2FA code to continue');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={Luxe.ivory} />
              </Pressable>
              <Text style={styles.kicker}>Staff Access</Text>
              <View style={{ width: 32 }} />
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>Sign in to your</Text>
              <Text style={[styles.title, styles.titleItalic]}>service line.</Text>
              <Text style={styles.subhead}>
                Manager and on-floor team access. Use your hotel-issued email.
              </Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="name@hotel.com"
                  placeholderTextColor={Luxe.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={Luxe.muted}
                  style={styles.input}
                />
              </View>

              {needsTotp ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>2FA Code</Text>
                  <TextInput
                    value={totp}
                    onChangeText={setTotp}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="123 456"
                    placeholderTextColor={Luxe.muted}
                    style={styles.input}
                  />
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable onPress={submit} disabled={isLoading} style={styles.cta}>
                {isLoading ? (
                  <ActivityIndicator color="#1A1410" />
                ) : (
                  <Text style={styles.ctaText}>Sign in</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.replace('/(auth)/phone')} style={styles.altLink}>
                <Text style={styles.altLinkText}>I'm a guest — phone OTP</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  body: { paddingHorizontal: 24, paddingTop: 30 },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 44,
    lineHeight: 46,
    color: Luxe.ivory,
    letterSpacing: -1.4,
  },
  titleItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  subhead: {
    marginTop: 14,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
  },
  field: { marginTop: 22 },
  fieldLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    fontFamily: LuxeFonts.sans,
    fontSize: 15,
    color: Luxe.ivory,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  error: {
    marginTop: 14,
    fontFamily: LuxeFonts.mono,
    fontSize: 12,
    color: '#E27A6E',
    letterSpacing: 0.4,
  },
  cta: {
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: '#1A1410',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  altLink: { marginTop: 20, alignSelf: 'center' },
  altLinkText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
});
