import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Luxe, LuxeFonts } from '../../theme/luxe';
import { SlaCountdown, getSlaRemainingMinutes } from './SlaCountdown';
import type { StaffTask } from '../../stores/staff.store';

const TYPE_ICON: Record<string, keyof typeof import('@expo/vector-icons/build/Ionicons').default.glyphMap> = {
  food: 'restaurant-outline',
  beverage: 'wine-outline',
  housekeeping: 'sparkles-outline',
  laundry: 'shirt-outline',
  maintenance: 'construct-outline',
  concierge: 'chatbubble-ellipses-outline',
};

const TYPE_LABEL: Record<string, string> = {
  food: 'Food',
  beverage: 'Beverage',
  housekeeping: 'Housekeeping',
  laundry: 'Laundry',
  maintenance: 'Maintenance',
  concierge: 'Concierge',
};

interface TaskCardProps {
  task: StaffTask;
  onPress: () => void;
  onAccept: () => void;
  onReassign?: () => void;
}

export function TaskCard({ task, onPress, onAccept, onReassign }: TaskCardProps) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(i);
  }, []);

  const remaining = getSlaRemainingMinutes(task.slaDeadline);
  const breached = remaining !== null && remaining < 0;
  const urgent = remaining !== null && remaining < 10 && remaining >= 0;

  const ageMin = Math.max(0, Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 60_000));

  return (
    <Animated.View entering={FadeInDown.duration(280)}>
      <Pressable onPress={onPress} style={[styles.card, breached && styles.cardBreached, urgent && styles.cardUrgent]}>
        <View style={styles.headerRow}>
          <View style={styles.typeChip}>
            <Ionicons
              name={TYPE_ICON[task.type] ?? 'cube-outline'}
              size={12}
              color={Luxe.goldBright}
            />
            <Text style={styles.typeText}>{(TYPE_LABEL[task.type] ?? task.type).toUpperCase()}</Text>
          </View>
          {(urgent || breached) && <View style={[styles.dot, breached && styles.dotBreached]} />}
          <Text style={styles.room}>Room {task.guest.roomNumber}</Text>
        </View>

        <Text style={styles.description}>{task.description}</Text>

        <View style={styles.guestRow}>
          <Text style={styles.guestName}>{task.guest.name}</Text>
          <View style={styles.tierChip}>
            <Text style={styles.tierText}>{task.guest.loyaltyTier}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Received {ageMin}M AGO</Text>
          <SlaCountdown deadline={task.slaDeadline} compact />
        </View>

        <View style={styles.btnRow}>
          <Pressable onPress={onAccept} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {task.status === 'pending' ? 'Accept' : task.status === 'accepted' ? 'Start' : 'Open'}
            </Text>
          </Pressable>
          {onReassign && task.status === 'pending' ? (
            <Pressable onPress={onReassign} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Reassign</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C0A08',
    borderRadius: 22,
    padding: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
    marginBottom: 12,
  },
  cardUrgent: { borderColor: 'rgba(244,201,126,0.42)' },
  cardBreached: { borderColor: '#E27A6E' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  typeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: Luxe.goldBright,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Luxe.goldBright,
  },
  dotBreached: { backgroundColor: '#E27A6E' },
  room: {
    marginLeft: 'auto',
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.ivoryDim,
  },
  description: {
    fontFamily: LuxeFonts.serif,
    fontSize: 20,
    lineHeight: 24,
    color: Luxe.ivory,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  guestName: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 14,
    color: Luxe.ivory,
  },
  tierChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.20)',
  },
  tierText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: Luxe.gold,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  metaText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: Luxe.muted,
  },
  btnRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    color: '#1A1410',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  secondaryBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
