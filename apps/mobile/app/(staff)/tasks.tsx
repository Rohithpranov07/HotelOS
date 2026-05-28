import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useStaffStore, type StaffTask, type TaskType } from '../../src/stores/staff.store';
import { TaskCard } from '../../src/components/staff/TaskCard';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';
import { subscribeStaffTasks } from '../../src/lib/socket';

const FILTERS: Array<{ key: 'all' | TaskType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'laundry', label: 'Laundry' },
];

export default function StaffTasksScreen() {
  useLuxeFonts();
  const router = useRouter();
  const staffUser = useAuthStore((s) => s.staffUser);
  const tasks = useStaffStore((s) => s.tasks);
  const filter = useStaffStore((s) => s.filter);
  const isLoading = useStaffStore((s) => s.isLoading);
  const fetchTasks = useStaffStore((s) => s.fetchTasks);
  const setFilter = useStaffStore((s) => s.setFilter);
  const updateTaskStatus = useStaffStore((s) => s.updateTaskStatus);
  const applyTaskEvent = useStaffStore((s) => s.applyTaskEvent);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!staffUser?.propertyId) return;
    const unsub = subscribeStaffTasks(staffUser.propertyId, {
      onTaskNew: (task) => {
        if (task && typeof task === 'object' && 'id' in task) {
          applyTaskEvent({ kind: 'new', task: task as StaffTask });
        }
      },
      onTaskStatus: (p) =>
        applyTaskEvent({
          kind: 'status',
          taskId: p.orderId,
          status: p.status as StaffTask['status'],
        }),
      onSlaWarning: (p) => applyTaskEvent({ kind: 'sla_warning', taskId: p.orderId }),
      onSlaBreach: (p) => applyTaskEvent({ kind: 'sla_breach', taskId: p.orderId }),
    });
    return unsub;
  }, [staffUser?.propertyId, applyTaskEvent]);

  const filtered = useMemo(() => {
    let out = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
    if (filter.type && filter.type !== 'all') out = out.filter((t) => t.type === filter.type);
    if (filter.mine) out = out.filter((t) => t.assignedToMe);
    return out.sort((a, b) => {
      const aT = a.slaDeadline ? new Date(a.slaDeadline).getTime() : Infinity;
      const bT = b.slaDeadline ? new Date(b.slaDeadline).getTime() : Infinity;
      return aT - bT;
    });
  }, [tasks, filter]);

  const pendingCount = filtered.filter((t) => t.status === 'pending').length;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Task Queue</Text>
          <Text style={styles.title}>
            {pendingCount > 0 ? `${pendingCount} pending` : 'All clear'}
          </Text>
          <Text style={styles.subhead}>
            {staffUser?.fullName ?? 'Staff'} · {staffUser?.role?.toUpperCase() ?? 'TEAM'}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilter({ mine: !filter.mine })}
            style={[styles.filterPill, filter.mine && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, filter.mine && styles.filterTextActive]}>
              {filter.mine ? 'Mine' : 'All staff'}
            </Text>
          </Pressable>
          <View style={styles.filterDivider} />
          {FILTERS.map((f) => {
            const active = (filter.type ?? 'all') === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter({ type: f.key })}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Luxe.goldBright}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nothing in the queue.</Text>
                <Text style={styles.emptySub}>New tasks arrive in real-time.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() =>
                router.push({ pathname: '/(staff)/task', params: { id: item.id } })
              }
              onAccept={() => {
                if (item.status === 'pending') updateTaskStatus(item.id, 'accepted');
                else if (item.status === 'accepted') updateTaskStatus(item.id, 'in_progress');
                else router.push({ pathname: '/(staff)/task', params: { id: item.id } });
              }}
              onReassign={() => {
                // For now, route to detail screen; full reassign UI is Phase 2.
                router.push({ pathname: '/(staff)/task', params: { id: item.id } });
              }}
            />
          )}
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
  subhead: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.titanium,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(244,201,126,0.16)',
    borderColor: 'rgba(244,201,126,0.40)',
  },
  filterText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
  filterTextActive: { color: Luxe.goldBright },
  filterDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: Luxe.hairlineStrong,
    marginHorizontal: 4,
  },
  listContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 140 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivoryDim,
    letterSpacing: -0.4,
  },
  emptySub: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.muted,
  },
});
