import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface ConciergeOrbProps {
  size?: number;
}

export function ConciergeOrb({ size = 92 }: ConciergeOrbProps) {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2750, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2750, useNativeDriver: true }),
      ]),
    ).start();
  }, [breath]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width: size, height: size, transform: [{ scale }] },
      ]}
    >
      {/* outer aura ring */}
      <View
        style={[
          styles.aura,
          {
            width: size + 18,
            height: size + 18,
            borderRadius: (size + 18) / 2,
          },
        ]}
      />
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* gold ring → dark core */}
          <RadialGradient id="ring" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0A0805" stopOpacity={1} />
            <Stop offset="40%" stopColor="#1A140E" stopOpacity={1} />
            <Stop offset="62%" stopColor="#7E5F31" stopOpacity={0.85} />
            <Stop offset="78%" stopColor="#D4A857" stopOpacity={1} />
            <Stop offset="92%" stopColor="#F4C97E" stopOpacity={1} />
            <Stop offset="100%" stopColor="#E8B466" stopOpacity={0.4} />
          </RadialGradient>
          {/* top-left highlight */}
          <RadialGradient id="highlight" cx="32%" cy="28%" r="38%">
            <Stop offset="0%" stopColor="#FFF1D0" stopOpacity={0.7} />
            <Stop offset="60%" stopColor="#FFF1D0" stopOpacity={0} />
          </RadialGradient>
          {/* dark inner core for contrast */}
          <RadialGradient id="core" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#1B150D" stopOpacity={1} />
            <Stop offset="80%" stopColor="#070504" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#ring)" />
        <Circle cx="50" cy="50" r="28" fill="url(#core)" />
        <Circle cx="50" cy="50" r="50" fill="url(#highlight)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  aura: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.20)',
  },
});
