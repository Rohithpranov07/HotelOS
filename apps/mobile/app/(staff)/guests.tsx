import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStaffStore } from '../../src/stores/staff.store';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

interface GuestRow {
  id: string;
  name: string;
  roomNumber: string;
  tier: string;
}

export default function StaffGuestsScreen() {
  useLuxeFonts();
  const router = useRouter();
  const tasks = useStaffStore((s) => s.tasks);
  const fetchTasks = useStaffStore((s) => s.fetchTasks);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (tasks.length === 0) fetchTasks();
  }, [tasks.length, fetchTasks]);

  const guests = useMemo<GuestRow[]>(() => {
    const map = new Map<string, GuestRow>();
    for (const t of tasks) {
      if (!map.has(t.guest.id)) {
        map.set(t.guest.id, {
          id: t.guest.id,
          name: t.guest.name,
          roomNumber: t.guest.roomNumber,
          tier: t.guest.loyaltyTier,
        });
      }
    }
    return Array.from(map.values());
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!query.trim()) return guests;
    const q = query.toLowerCase();
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.roomNumber.includes(q) ||
        g.tier.toLowerCase().includes(q),
    );
  }, [guests, query]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Guests · In-house</Text>
          <Text style={styles.title}>{guests.length} in residence</Text>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={Luxe.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, room, or tier…"
            placeholderTextColor={Luxe.muted}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(staff)/guest', params: { id: item.id } })
              }
              style={styles.row}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  Room {item.roomNumber} · {item.tier}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Luxe.titanium} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No guests match.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  header: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 8 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 38,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  searchWrap: {
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  searchInput: {
    flex: 1,
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    padding: 0,
  },
  listContent: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 140 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Luxe.hairlineStrong,
  },
  name: { fontFamily: LuxeFonts.sansMedium, fontSize: 16, color: Luxe.ivory },
  meta: {
    marginTop: 4,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTitle: { fontFamily: LuxeFonts.serif, fontSize: 18, color: Luxe.muted },
});
