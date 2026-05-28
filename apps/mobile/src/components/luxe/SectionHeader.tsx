import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface SectionHeaderProps {
  kicker: string;
  title: string;
  right?: string;
  onRightPress?: () => void;
}

export function SectionHeader({ kicker, title, right, onRightPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? (
        onRightPress ? (
          <Pressable onPress={onRightPress} hitSlop={12} style={styles.rightPress}>
            <Text style={styles.right}>{right}</Text>
          </Pressable>
        ) : (
          <Text style={styles.right}>{right}</Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 28,
    marginBottom: 18,
    gap: 16,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 28,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  rightPress: { paddingBottom: 4 },
  right: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    color: Luxe.ivoryDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
