import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Luxe, LuxeFonts } from '../../theme/luxe';

const PHRASES = [
  'Calling the kitchen…',
  'Asking the chef…',
  "Pulling tonight's list…",
  'Almost ready…',
];

export function RefreshIndicator({ active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (active) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      const spinLoop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinLoop.start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();

      const phraseInterval = setInterval(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
      }, 1400);

      return () => {
        spinLoop.stop();
        pulseLoop.stop();
        clearInterval(phraseInterval);
      };
    }

    Animated.timing(fade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    spin.setValue(0);
    pulse.setValue(0);
    setPhraseIdx(0);
    return undefined;
  }, [active, spin, fade, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity: fade, paddingTop: insets.top + 12 }]}
    >
      <View style={styles.ringWrap}>
        {/* outer pulsing glow */}
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOpacity, transform: [{ scale }] },
          ]}
        />
        {/* rotating arc ring */}
        <Animated.View
          style={[styles.ring, { transform: [{ rotate }] }]}
        >
          <View style={styles.arc} />
          <View style={[styles.dot, styles.dotTop]} />
          <View style={[styles.dot, styles.dotRight]} />
        </Animated.View>
        {/* inner concierge core */}
        <View style={styles.core} />
      </View>
      <Text style={styles.phrase}>{PHRASES[phraseIdx]}</Text>
    </Animated.View>
  );
}

const RING_SIZE = 44;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    zIndex: 80,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: RING_SIZE + 14,
    height: RING_SIZE + 14,
    borderRadius: (RING_SIZE + 14) / 2,
    backgroundColor: 'rgba(244,201,126,0.25)',
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(244,201,126,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // arc: top-right quadrant in bright gold via stacking
  arc: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopColor: Luxe.amberGlow,
    borderRightColor: Luxe.amberGlow,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luxe.amberGlow,
    shadowColor: Luxe.amberGlow,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  dotTop: { top: -1, left: RING_SIZE / 2 - 2 },
  dotRight: { right: -1, top: RING_SIZE / 2 - 2 },
  core: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Luxe.amberGlow,
  },
  phrase: {
    marginTop: 10,
    fontFamily: LuxeFonts.serifItalic,
    fontSize: 13,
    color: Luxe.ivoryDim,
    letterSpacing: -0.1,
  },
});
