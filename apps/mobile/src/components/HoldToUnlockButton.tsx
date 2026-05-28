import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Luxe, LuxeFonts } from '../theme/luxe';

interface HoldToUnlockButtonProps {
  onUnlock: () => void;
  disabled?: boolean;
  label?: string;
  durationMs?: number;
}

export function HoldToUnlockButton({
  onUnlock,
  disabled = false,
  label = 'Hold to Unlock',
  durationMs = 1500,
}: HoldToUnlockButtonProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    return () => {
      anim.current?.stop();
    };
  }, []);

  const start = () => {
    if (disabled) return;
    completedRef.current = false;
    void Haptics.selectionAsync();
    anim.current?.stop();
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    });
    anim.current.start(({ finished }) => {
      if (finished && !completedRef.current) {
        completedRef.current = true;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      }
    });
  };

  const cancel = () => {
    anim.current?.stop();
    Animated.timing(progress, {
      toValue: 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  const widthPct = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      disabled={disabled}
      style={[styles.track, disabled && { opacity: 0.45 }]}
    >
      <Animated.View style={[styles.fill, { width: widthPct }]}>
        <LinearGradient
          colors={['rgba(212,168,87,0.30)', 'rgba(244,201,126,0.55)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={14} color={Luxe.obsidian} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,240,210,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,168,87,0.36)',
  },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  label: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: Luxe.ivory,
    textTransform: 'uppercase',
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Luxe.goldBright,
  },
});
