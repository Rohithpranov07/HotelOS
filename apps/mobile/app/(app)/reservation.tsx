import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Badge, Button, Card, Colors, EmptyState, LoadingSpinner, Spacing } from '@hotel-os/ui';
import { useReservationStore, type Reservation, type ReservationStatus } from '../../src/stores/reservation.store';

const STATUS_TONE: Record<ReservationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  confirmed: 'info',
  pre_checked_in: 'success',
  checked_in: 'success',
  checked_out: 'default',
  cancelled: 'danger',
  no_show: 'danger',
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: 'Confirmed',
  pre_checked_in: 'Pre-checked in',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export default function ReservationScreen() {
  const router = useRouter();
  const reservation = useReservationStore((s) => s.reservation);
  const isLoading = useReservationStore((s) => s.isLoading);
  const fetchActiveReservation = useReservationStore((s) => s.fetchActiveReservation);

  useFocusEffect(
    useCallback(() => {
      fetchActiveReservation();
    }, [fetchActiveReservation]),
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Reservation</Text>
        <View style={{ width: 26 }} />
      </View>

      {!reservation && isLoading ? (
        <LoadingSpinner fullscreen />
      ) : !reservation ? (
        <EmptyState
          title="No active reservation"
          message="When you book a stay, the details will appear here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ReservationDetails reservation={reservation} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ReservationDetails({ reservation }: { reservation: Reservation }) {
  const router = useRouter();
  const nights = nightsBetween(reservation.checkInDate, reservation.checkOutDate);

  return (
    <View style={{ gap: Spacing.md }}>
      <Card>
        <View style={styles.statusRow}>
          <Badge label={STATUS_LABEL[reservation.status]} tone={STATUS_TONE[reservation.status]} />
          {reservation.pmsBookingRef ? (
            <Text style={styles.ref}>#{reservation.pmsBookingRef}</Text>
          ) : null}
        </View>
        <Text style={styles.roomType}>
          {reservation.room?.roomType ?? 'Room'}
          {reservation.room?.roomNumber ? ` · ${reservation.room.roomNumber}` : ''}
        </Text>
        <Text style={styles.muted}>
          {nights} night{nights === 1 ? '' : 's'}
          {reservation.room?.floor != null ? ` · Floor ${reservation.room.floor}` : ''}
        </Text>

        <View style={styles.divider} />

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.dateValue}>{formatLong(reservation.checkInDate)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.textTertiary} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.dateValue}>{formatLong(reservation.checkOutDate)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.guestRow}>
          <Text style={styles.label}>Guests</Text>
          <Text style={styles.guestValue}>
            {reservation.adults} adult{reservation.adults === 1 ? '' : 's'}
            {reservation.children > 0 ? `, ${reservation.children} children` : ''}
          </Text>
        </View>
        {reservation.ratePlan ? (
          <View style={styles.guestRow}>
            <Text style={styles.label}>Rate plan</Text>
            <Badge label={reservation.ratePlan.toUpperCase()} tone="info" />
          </View>
        ) : null}
      </Card>

      {reservation.room?.amenities?.length ? (
        <Card>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenityRow}>
            {reservation.room.amenities.map((a) => (
              <Badge key={a} label={prettifyAmenity(a)} tone="default" />
            ))}
          </View>
        </Card>
      ) : null}

      {reservation.specialRequests ? (
        <Card>
          <Text style={styles.sectionTitle}>Special requests</Text>
          <Text style={styles.requestText}>{reservation.specialRequests}</Text>
        </Card>
      ) : null}

      {reservation.status === 'confirmed' ? (
        <Button
          title="Complete check-in"
          onPress={() => {}}
          fullWidth
          size="lg"
        />
      ) : reservation.status === 'pre_checked_in' || reservation.status === 'checked_in' ? (
        <Button
          title="View mobile key"
          onPress={() => router.push('/(app)/key')}
          fullWidth
          size="lg"
        />
      ) : null}
    </View>
  );
}

function nightsBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

function formatLong(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function prettifyAmenity(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.navy },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' },
  roomType: { fontSize: 22, fontWeight: '700', color: Colors.navy, marginTop: 10 },
  muted: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  dateValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 4 },
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  guestValue: { fontSize: 14, fontWeight: '500', color: Colors.text },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: Spacing.sm },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  requestText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
