import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '@hotel-os/ui';
import type { GuestProfile } from '../stores/auth.store';
import type { Reservation } from '../stores/reservation.store';

interface HomeHeaderProps {
  guest: GuestProfile;
  reservation: Reservation | null;
}

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHeader({ guest, reservation }: HomeHeaderProps) {
  const router = useRouter();
  const firstName = guest.fullName?.split(' ')[0] || 'Guest';
  const greeting =
    reservation?.status === 'checked_in'
      ? 'Welcome'
      : reservation?.status === 'checked_out'
        ? 'Thanks for staying'
        : greetingFor();
  const roomNumber = reservation?.status === 'checked_in' ? reservation.room?.roomNumber : null;

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greeting}>
          {greeting}, {firstName}
        </Text>
        {roomNumber ? (
          <Text style={styles.room}>Room {roomNumber}</Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => router.push('/(app)/account')}
        style={({ pressed }) => [styles.badge, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="trophy" size={14} color="#FFFFFF" />
        <View style={{ marginLeft: 6 }}>
          <Text style={styles.points}>{guest.loyaltyPoints.toLocaleString()}</Text>
          <Text style={styles.tier}>{guest.loyaltyTier}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.navy },
  room: { fontSize: 13, fontWeight: '600', color: Colors.teal, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  points: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 15 },
  tier: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
