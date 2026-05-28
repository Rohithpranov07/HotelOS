import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface CheckinChromeProps {
  step: 1 | 2 | 3;
  total?: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function CheckinChrome({ step, total = 3, title, subtitle, onBack }: CheckinChromeProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color={Luxe.ivoryDim} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.kicker}>Digital Check-in</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.stepRow}>
        <Text style={styles.stepText}>{`Step ${step} of ${total}`}</Text>
        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => {
            const filled = i + 1 <= step;
            return <View key={i} style={[styles.dot, filled && styles.dotFilled]} />;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 30,
    lineHeight: 34,
    color: Luxe.ivory,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: LuxeFonts.sansLight,
    fontSize: 13.5,
    lineHeight: 20,
    color: Luxe.ivoryDim,
  },
  stepRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: Luxe.muted,
    textTransform: 'uppercase',
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,240,210,0.16)',
  },
  dotFilled: { backgroundColor: Luxe.goldBright },
});
