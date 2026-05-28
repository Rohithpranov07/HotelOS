import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@hotel-os/ui';
import { useRouter } from 'expo-router';
import { useReservationStore } from '../stores/reservation.store';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface QuickActionDef {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  toggleDnd?: boolean;
}

const QUICK_ACTIONS: QuickActionDef[] = [
  { id: 'food', label: 'Food', icon: 'restaurant-outline', href: '/(app)/services' },
  { id: 'clean', label: 'Housekeep', icon: 'sparkles-outline', href: '/(app)/services' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt-outline', href: '/(app)/services' },
  { id: 'concierge', label: 'Concierge', icon: 'chatbubble-ellipses-outline', href: '/(app)/concierge' },
  { id: 'key', label: 'Room Key', icon: 'key-outline', href: '/(app)/key' },
  { id: 'folio', label: 'My Bill', icon: 'document-text-outline', href: '/(app)/folio' },
  { id: 'amenity', label: 'Amenities', icon: 'cube-outline', href: '/(app)/services' },
  { id: 'dnd', label: 'Do Not Disturb', icon: 'notifications-off-outline', toggleDnd: true },
];

export function QuickActionGrid() {
  const router = useRouter();
  const reservation = useReservationStore((s) => s.reservation);
  const updateDnd = useReservationStore((s) => s.updateDnd);
  const dndOn = reservation?.isDnd ?? false;

  const handlePress = (a: QuickActionDef) => {
    if (a.toggleDnd) {
      updateDnd(!dndOn);
      return;
    }
    if (a.href) router.push(a.href as never);
  };

  return (
    <View style={styles.grid}>
      {QUICK_ACTIONS.map((a) => {
        const isActiveDnd = a.toggleDnd && dndOn;
        return (
          <Pressable
            key={a.id}
            onPress={() => handlePress(a)}
            style={({ pressed }) => [
              styles.tile,
              isActiveDnd && styles.tileActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name={a.icon}
              size={26}
              color={isActiveDnd ? '#FFFFFF' : Colors.teal}
            />
            <Text style={[styles.tileLabel, isActiveDnd && styles.tileLabelActive]} numberOfLines={2}>
              {a.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tile: {
    width: '23.5%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  tileActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  tileLabelActive: { color: '#FFFFFF' },
});
