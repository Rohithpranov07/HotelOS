import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pressable, ActivityIndicator } from 'react-native';
import { Colors, TextInput } from '@hotel-os/ui';
import { useAuthStore } from '../../src/stores/auth.store';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | undefined>();

  const goStaff = () => router.push('/(auth)/staff-login');

  const fullPhone = `+91${phone}`;
  const isValid = phone.length === 10;

  const handleSend = async () => {
    setError(undefined);
    if (!isValid) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    try {
      await sendOtp(fullPhone);
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send OTP';
      if (/rate/i.test(message)) {
        Alert.alert('Too many requests', 'Please wait a moment and try again.');
      } else {
        setError(message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to continue. We'll send you a one-time code.
          </Text>

          <View style={styles.phoneRow}>
            <View style={styles.country}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.dial}>+91</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210"
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
              error={error}
              textContentType="telephoneNumber"
              style={styles.flex}
            />
          </View>

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={handleSend}
            disabled={!isValid || isLoading}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 14,
              backgroundColor: '#0F6E56',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !isValid || isLoading ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                Send OTP
              </Text>
            )}
          </Pressable>
          <Text style={styles.legal}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
          <Pressable onPress={goStaff} hitSlop={8} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={{ color: Colors.teal, fontSize: 13, fontWeight: '500' }}>
              Staff member? Sign in here
            </Text>
          </Pressable>
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.navy },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, marginBottom: 32 },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  country: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
  },
  flag: { fontSize: 18, marginRight: 6 },
  dial: { fontSize: 15, fontWeight: '600', color: Colors.text },
  legal: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 12,
  },
});
