import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@hotel-os/ui';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(auth)/phone'), 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.logoWrap}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>H</Text>
        </View>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.brand}>
          Hotel OS
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.tagline}>
          Your stay, simplified.
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center' },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoMarkText: { color: '#FFFFFF', fontSize: 44, fontWeight: '700' },
  brand: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: 0.5 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6 },
});
