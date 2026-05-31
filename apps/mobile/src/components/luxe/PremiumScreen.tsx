import { useCallback, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: ReactNode;
  /** Disable the gold scrim sweep at the top edge. */
  noScrim?: boolean;
};

const EASE_OUT_QUINT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_OUT_QUART = Easing.bezier(0.25, 1, 0.5, 1);

/**
 * Content entry choreography that re-runs every time the screen gains focus.
 * Designed for stacked Tabs where screens stay mounted between visits.
 */
export function PremiumScreen({ children, noScrim }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const scrim = useSharedValue(0);
  const scrimFade = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateY.value = 16;
      scrim.value = 0;
      scrimFade.value = 0;

      opacity.value = withTiming(1, { duration: 360, easing: EASE_OUT_QUART });
      translateY.value = withTiming(0, { duration: 420, easing: EASE_OUT_QUINT });
      scrim.value = withTiming(1, { duration: 520, easing: EASE_OUT_QUINT });
      scrimFade.value = withDelay(
        260,
        withTiming(1, { duration: 360, easing: EASE_OUT_QUART }),
      );
      return () => {};
    }, []),
  );

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scrim.value }],
    opacity: 1 - scrimFade.value,
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.fill, contentStyle]}>{children}</Animated.View>
      {!noScrim && (
        <Animated.View pointerEvents="none" style={[styles.scrimWrap, scrimStyle]}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(232,180,102,0.55)',
              'rgba(244,201,126,0.85)',
              'rgba(232,180,102,0.55)',
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.scrim}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  scrimWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  scrim: { flex: 1 },
});
