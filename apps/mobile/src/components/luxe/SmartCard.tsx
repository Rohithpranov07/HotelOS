import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

interface SmartCardProps {
  kicker: string;
  title: string;
  body?: string;
  action?: string;
  glow?: 'gold' | 'ink' | 'bronze';
  live?: boolean;
  onPress?: () => void;
}

export function SmartCard({
  kicker,
  title,
  body,
  action,
  glow = 'gold',
  live,
  onPress,
}: SmartCardProps) {
  const glowColor =
    glow === 'gold'
      ? 'rgba(244,201,126,0.16)'
      : glow === 'ink'
        ? 'rgba(168,162,154,0.10)'
        : 'rgba(139,111,71,0.18)';
  return (
    <LinearGradient
      colors={[Luxe.surfaceTop, '#0C0A08']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <LinearGradient
        colors={[glowColor, 'transparent']}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <View style={styles.kickerRow}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text style={styles.kicker}>{kicker}</Text>
        </View>
        {action ? (
          <Pressable onPress={onPress} style={styles.actionPill}>
            <Text style={styles.actionText}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 22,
    paddingTop: 20,
    paddingBottom: 22,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Luxe.hairline,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Luxe.goldBright },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.32)',
    backgroundColor: 'rgba(244,201,126,0.06)',
  },
  actionText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.ivory,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 24,
    lineHeight: 28,
    color: Luxe.ivory,
    letterSpacing: -0.4,
    marginTop: 14,
  },
  body: {
    fontFamily: LuxeFonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Luxe.ivoryDim,
    marginTop: 10,
    letterSpacing: -0.1,
    maxWidth: 290,
  },
});
