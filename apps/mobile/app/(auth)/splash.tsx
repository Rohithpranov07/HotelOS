import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';

const HKI_LOGO = require('../../assets/hki-icon.png');

export default function SplashScreen() {
  useLuxeFonts();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(auth)/login'), 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A130A', '#0A0807', Luxe.obsidian]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(244,201,126,0.30)', 'rgba(244,201,126,0.06)', 'transparent']}
        locations={[0, 0.4, 0.75]}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
        pointerEvents="none"
      />

      <Animated.View entering={FadeIn.duration(600)} style={styles.center}>
        <View style={styles.markFrame}>
          {/* gold frame glow */}
          <LinearGradient
            colors={['rgba(244,201,126,0.55)', 'rgba(154,122,63,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.markFrameGlow}
          />
          <View style={styles.markPlaque}>
            <ExpoImage
              source={HKI_LOGO}
              style={styles.markLogo}
              contentFit="contain"
              transition={220}
            />
          </View>
        </View>

        <Animated.Text
          entering={FadeInDown.delay(280).duration(620)}
          style={styles.kicker}
        >
          Kodaikanal · South India
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(380).duration(640)}
          style={styles.brand}
        >
          Hotel <Text style={styles.brandItalic}>OS</Text>
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(520).duration(640)}
          style={styles.tagline}
        >
          Your stay, made effortless.
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(820).duration(700)} style={styles.hairline} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    top: '15%',
    left: '5%',
    right: '5%',
    height: 420,
    borderRadius: 999,
  },
  center: { alignItems: 'center', paddingHorizontal: 32 },
  markFrame: {
    width: 132,
    height: 132,
    borderRadius: 28,
    padding: 2,
    marginBottom: 32,
    shadowColor: '#F4C97E',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  markFrameGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  markPlaque: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: '#F6EFE0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markLogo: {
    width: '100%',
    height: '100%',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 2.4,
    color: Luxe.titanium,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  brand: {
    fontFamily: LuxeFonts.serif,
    fontSize: 44,
    letterSpacing: -1.4,
    color: Luxe.ivory,
  },
  brandItalic: {
    fontFamily: LuxeFonts.serifItalic,
    color: Luxe.amberGlow,
  },
  tagline: {
    marginTop: 10,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13,
    color: Luxe.ivoryDim,
    letterSpacing: 0.4,
  },
  hairline: {
    marginTop: 36,
    width: 60,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.55)',
  },
});
