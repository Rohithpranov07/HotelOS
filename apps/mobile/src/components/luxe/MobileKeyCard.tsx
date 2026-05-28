import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Luxe, LuxeFonts, LuxeRadii } from '../../theme/luxe';

interface MobileKeyCardProps {
  suiteNumber: string;
  wing?: string;
  unlocked: boolean;
  onUnlock: () => void;
}

export function MobileKeyCard({ suiteNumber, wing = 'East wing', unlocked, onUnlock }: MobileKeyCardProps) {
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    anim.current?.stop();
    if (holding) {
      anim.current = Animated.timing(progress, {
        toValue: 1,
        duration: 950,
        useNativeDriver: false,
      });
      anim.current.start(({ finished }) => {
        if (finished) onUnlock();
      });
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 240,
        useNativeDriver: false,
      }).start();
    }
  }, [holding, onUnlock, progress]);

  const suiteHead = suiteNumber.slice(0, -2);
  const suiteTail = suiteNumber.slice(-2);

  const widthPct = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#1d1814', '#14110d', '#0e0c09']}
      locations={[0, 0.6, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <LinearGradient
        colors={['rgba(244,201,126,0.26)', 'transparent']}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.45 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topHairline} />
      <View style={styles.bottomHairline} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={styles.kickerRow}>
            <View style={styles.liveDot} />
            <Text style={styles.kicker}>Mobile Key · Active</Text>
          </View>
          <Text style={styles.suiteHeadline}>
            Suite <Text style={{ fontFamily: LuxeFonts.serifItalic, color: Luxe.goldBright }}>{suiteHead}{suiteTail}</Text>
          </Text>
          <Text style={styles.locationLine}>
            {suiteHead}
            <Text style={{ color: Luxe.ivoryDim }}>F</Text>
            {'  ·  '}
            {wing}
            {'  ·  NFC'}
          </Text>
        </View>

        {/* metallic chip */}
        <View style={styles.chipOuter}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#9A7A3F', '#E8B466']}
            locations={[0, 0.35, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.chipInner} />
          <View style={styles.chipDot} />
        </View>
      </View>

      {/* Hold to unlock */}
      <Pressable
        onPressIn={() => setHolding(true)}
        onPressOut={() => setHolding(false)}
        style={styles.unlockTrack}
      >
        <Animated.View style={[styles.unlockFill, { width: widthPct }]}>
          <LinearGradient
            colors={['rgba(212,168,87,0.20)', 'rgba(244,201,126,0.32)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={styles.unlockLabel}>
          {unlocked ? (
            <>
              <Ionicons name="checkmark" size={14} color={Luxe.goldBright} />
              <Text style={[styles.unlockText, { color: Luxe.goldBright }]}>Unlocked · Welcome back</Text>
            </>
          ) : (
            <>
              <Text style={styles.unlockText}>HOLD TO UNLOCK</Text>
              <View style={styles.unlockDotOuter}>
                <LinearGradient
                  colors={['#F4C97E', '#9A7A3F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </>
          )}
        </View>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 24,
    paddingBottom: 22,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(212,168,87,0.22)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.42)',
  },
  bottomHairline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(212,168,87,0.18)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Luxe.goldBright },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 2.2,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  suiteHeadline: {
    fontFamily: LuxeFonts.serif,
    fontSize: 44,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1,
  },
  locationLine: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.titanium,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  chipOuter: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.55)',
  },
  chipInner: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(20,18,15,0.3)',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A0908',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.6)',
  },
  unlockTrack: {
    marginTop: 26,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(212,168,87,0.28)',
    overflow: 'hidden',
  },
  unlockFill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  unlockLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  unlockText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    color: Luxe.ivory,
    textTransform: 'uppercase',
  },
  unlockDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
