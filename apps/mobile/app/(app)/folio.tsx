import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Colors, EmptyState, LoadingSpinner, Spacing } from '@hotel-os/ui';
import { useReservationStore, type FolioLineItem } from '../../src/stores/reservation.store';

const FOLIO_POLL_MS = 60_000;

const GROUP_LABEL: Record<FolioLineItem['type'], string> = {
  room: 'Room charges',
  food: 'Food & Beverage',
  laundry: 'Laundry',
  amenity: 'Amenities',
  other: 'Other',
};

const GROUP_ORDER: FolioLineItem['type'][] = ['room', 'food', 'laundry', 'amenity', 'other'];

export default function FolioScreen() {
  const router = useRouter();
  const reservation = useReservationStore((s) => s.reservation);
  const folio = useReservationStore((s) => s.folio);
  const fetchActiveReservation = useReservationStore((s) => s.fetchActiveReservation);
  const fetchFolio = useReservationStore((s) => s.fetchFolio);

  useFocusEffect(
    useCallback(() => {
      fetchActiveReservation();
    }, [fetchActiveReservation]),
  );

  useEffect(() => {
    if (!reservation?.id) return;
    fetchFolio(reservation.id);
    const t = setInterval(() => fetchFolio(reservation.id), FOLIO_POLL_MS);
    return () => clearInterval(t);
  }, [reservation?.id, fetchFolio]);

  const grouped = useMemo(() => {
    if (!folio) return null;
    const map = new Map<FolioLineItem['type'], FolioLineItem[]>();
    for (const item of folio.line_items) {
      const arr = map.get(item.type) ?? [];
      arr.push(item);
      map.set(item.type, arr);
    }
    return map;
  }, [folio]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Bill</Text>
        <View style={{ width: 26 }} />
      </View>

      {!folio && !reservation ? (
        <EmptyState
          title="No active reservation"
          message="Your folio will appear here once you have a stay."
        />
      ) : !folio ? (
        <LoadingSpinner fullscreen />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Balance due</Text>
            <Text style={styles.balanceValue}>{formatCurrency(folio.balance_due)}</Text>
            <View style={styles.balanceMeta}>
              <View>
                <Text style={styles.metaLabel}>Paid</Text>
                <Text style={styles.metaValue}>{formatCurrency(folio.paid_amount)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Total</Text>
                <Text style={styles.metaValue}>{formatCurrency(folio.total_amount)}</Text>
              </View>
            </View>
          </Card>

          {GROUP_ORDER.map((type) => {
            const items = grouped?.get(type);
            if (!items?.length) return null;
            const subtotal = items.reduce((a, b) => a + b.amount, 0);
            return (
              <Card key={type}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{GROUP_LABEL[type]}</Text>
                  <Text style={styles.groupSubtotal}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={{ marginTop: Spacing.sm, gap: 10 }}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.lineRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lineDesc}>{item.description}</Text>
                        <Text style={styles.lineDate}>{formatDate(item.date)}</Text>
                      </View>
                      <Text style={styles.lineAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}

          {folio.balance_due > 0 ? (
            <Button title="Pay now" onPress={() => {}} fullWidth size="lg" />
          ) : null}
          <Button
            title="Download invoice"
            variant="secondary"
            onPress={() => {}}
            fullWidth
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  balanceCard: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  balanceValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginTop: 4 },
  balanceMeta: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  metaValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 2 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  groupSubtotal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  lineDesc: { fontSize: 14, color: Colors.text },
  lineDate: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  lineAmount: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
