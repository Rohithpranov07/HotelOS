import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

export type SuggestionTone = 'amber' | 'bronze' | 'ink' | 'ivory';

export interface SuggestionItem {
  kicker: string;
  title: string;
  tone?: SuggestionTone;
  backgroundImage?: number;
}

interface SuggestionRailProps {
  items: SuggestionItem[];
  onPick: (item: SuggestionItem) => void;
}

const PALETTE: Record<SuggestionTone, [string, string, string]> = {
  amber: ['rgba(244,201,126,0.32)', '#1A1612', '#0C0A08'],
  bronze: ['rgba(139,111,71,0.28)', '#17140F', '#0C0A08'],
  ink: ['rgba(168,162,154,0.14)', '#14120E', '#0A0907'],
  ivory: ['rgba(245,239,224,0.12)', '#16130F', '#0C0A08'],
};

export function SuggestionRail({ items, onPick }: SuggestionRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      decelerationRate="fast"
      snapToInterval={166}
      snapToAlignment="start"
    >
      {items.map((it, i) => {
        const tone = it.tone ?? 'amber';
        const colors = PALETTE[tone];
        return (
          <Pressable key={`${it.title}-${i}`} onPress={() => onPick(it)} style={styles.card}>
            {it.backgroundImage ? (
              <>
                <Image
                  source={it.backgroundImage}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="high"
                  transition={180}
                  recyclingKey={`sugg-${it.title}`}
                />
                <LinearGradient
                  colors={['rgba(6,5,3,0.20)', 'rgba(6,5,3,0.55)', 'rgba(4,3,1,0.92)']}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={[colors[0], 'transparent']}
                  locations={[0, 0.7]}
                  start={{ x: 0.8, y: 0.2 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              <>
                <LinearGradient
                  colors={[colors[0], 'transparent']}
                  locations={[0, 0.7]}
                  start={{ x: 0.8, y: 0.2 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={[colors[1], colors[2]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
                />
              </>
            )}
            <Text style={styles.kicker}>{it.kicker}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {it.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 22, gap: 10 },
  card: {
    width: 156,
    height: 104,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.06)',
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 16.5,
    lineHeight: 18,
    color: Luxe.ivory,
    letterSpacing: -0.3,
  },
});
