import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Luxe, LuxeFonts } from '../../theme/luxe';

type ActionKind = 'room-service' | 'concierge' | 'housekeeping' | 'payments';

export interface LuxeAction {
  kind: ActionKind;
  label: string;
  sub: string;
  badge?: string;
  onPress: () => void;
}

interface LuxeActionGridProps {
  items: LuxeAction[];
}

export function LuxeActionGrid({ items }: LuxeActionGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((a) => (
        <ActionTile key={a.kind} action={a} />
      ))}
    </View>
  );
}

function ActionTile({ action }: { action: LuxeAction }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={action.onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      unstable_pressDelay={130}
      style={[styles.tile, { transform: [{ scale: pressed ? 0.965 : 1 }] }]}
    >
      <LinearGradient
        colors={[Luxe.surfaceTop, '#0D0B08']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tileTopHairline} />
      <ActionVisual kind={action.kind} />
      {action.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{action.badge}</Text>
        </View>
      ) : null}
      <View style={styles.tileFooter}>
        <Text style={styles.tileLabel}>{action.label}</Text>
        <Text style={styles.tileSub}>{action.sub}</Text>
      </View>
    </Pressable>
  );
}

function ActionVisual({ kind }: { kind: ActionKind }) {
  if (kind === 'room-service') {
    return (
      <View style={StyleSheet.absoluteFill as ViewStyle}>
        <LinearGradient
          colors={['rgba(244,201,126,0.30)', 'transparent']}
          locations={[0, 0.55]}
          start={{ x: 0.78, y: 0.22 }}
          end={{ x: 0.2, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.absCircle, { width: 150, height: 150, right: -42, top: 18, backgroundColor: 'rgba(244,201,126,0.20)' }]} />
        <View style={[styles.absCircle, { width: 110, height: 110, right: -18, top: 40, borderWidth: 0.5, borderColor: 'rgba(244,201,126,0.32)' }]} />
        <View style={[styles.absCircle, { width: 60, height: 60, right: 6, top: 66, backgroundColor: 'rgba(244,201,126,0.30)' }]} />
      </View>
    );
  }
  if (kind === 'concierge') {
    return (
      <View style={StyleSheet.absoluteFill as ViewStyle}>
        <LinearGradient
          colors={['rgba(232,180,102,0.22)', 'transparent']}
          locations={[0, 0.6]}
          start={{ x: 0.5, y: 0.36 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.orbHalo]} />
        <View style={[styles.orbWrap]}>
          <LinearGradient
            colors={['#F4C97E', '#D4A857', '#8B6F47', '#F4C97E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.orbHighlight} />
        </View>
      </View>
    );
  }
  if (kind === 'housekeeping') {
    return (
      <View style={StyleSheet.absoluteFill as ViewStyle}>
        <LinearGradient
          colors={['rgba(168,162,154,0.16)', 'transparent']}
          locations={[0, 0.55]}
          start={{ x: 0.22, y: 0.3 }}
          end={{ x: 0.7, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.linenLayer,
              {
                left: 18 + i * 10,
                top: 22 + i * 12,
                width: 140 - i * 22,
                backgroundColor: `rgba(245,239,224,${0.11 - i * 0.022})`,
              },
            ]}
          />
        ))}
      </View>
    );
  }
  if (kind === 'payments') {
    return (
      <View style={StyleSheet.absoluteFill as ViewStyle}>
        <LinearGradient
          colors={['rgba(139,111,71,0.24)', 'transparent']}
          locations={[0, 0.6]}
          start={{ x: 0.78, y: 0.78 }}
          end={{ x: 0.3, y: 0.3 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.paymentCard, { right: -22, top: 36, transform: [{ rotate: '-10deg' }] }]}>
          <LinearGradient colors={['#2a241c', '#0c0a08']} style={StyleSheet.absoluteFill} />
        </View>
        <View style={[styles.paymentCard, { right: -10, top: 50, transform: [{ rotate: '-3deg' }], borderColor: 'rgba(244,201,126,0.30)' }]}>
          <LinearGradient colors={['#1c1812', '#0a0907']} style={StyleSheet.absoluteFill} />
          <View style={styles.cardChip} />
          <Text style={styles.cardNumber}>•••• 1604</Text>
        </View>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 22,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 188,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  tileTopHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(244,201,126,0.36)',
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(10,9,8,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.28)',
  },
  badgeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.goldBright,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tileFooter: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  tileLabel: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivory,
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  tileSub: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    color: Luxe.titanium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  absCircle: { position: 'absolute', borderRadius: 999 },
  orbHalo: {
    position: 'absolute',
    left: '50%',
    top: 22,
    marginLeft: -56,
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  orbWrap: {
    position: 'absolute',
    left: '50%',
    top: 36,
    marginLeft: -42,
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
  },
  orbHighlight: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,240,210,0.45)',
  },
  linenLayer: {
    position: 'absolute',
    height: 22,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(245,239,224,0.10)',
  },
  paymentCard: {
    position: 'absolute',
    width: 150,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(212,168,87,0.18)',
  },
  cardChip: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 18,
    height: 13,
    borderRadius: 3,
    backgroundColor: '#D4A857',
  },
  cardNumber: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    color: Luxe.gold,
    letterSpacing: 1.2,
  },
});
