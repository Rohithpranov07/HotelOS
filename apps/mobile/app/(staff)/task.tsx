import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import { useStaffStore, type TaskStatus } from '../../src/stores/staff.store';
import { SlaCountdown } from '../../src/components/staff/SlaCountdown';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

export default function StaffTaskDetailScreen() {
  useLuxeFonts();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const task = useStaffStore((s) => s.tasks.find((t) => t.id === id));
  const updateTaskStatus = useStaffStore((s) => s.updateTaskStatus);

  const [noteDraft, setNoteDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewType | null>(null);

  useEffect(() => {
    if (!task) return;
    setNoteDraft(task.notes ?? '');
  }, [task?.id]);

  const advance = useCallback(
    async (next: TaskStatus, opts?: { completionPhotoUrl?: string }) => {
      if (!task) return;
      setSubmitting(true);
      try {
        await updateTaskStatus(task.id, next, {
          notes: noteDraft || undefined,
          completionPhotoUrl: opts?.completionPhotoUrl,
        });
        if (next === 'completed' || next === 'cancelled') {
          router.back();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [task, noteDraft, updateTaskStatus, router],
  );

  const openCompletionCamera = useCallback(async () => {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) return;
    }
    setCameraOpen(true);
  }, [permission, requestPermission]);

  const captureAndComplete = useCallback(async () => {
    if (!cameraRef.current || !task) return;
    setSubmitting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        quality: 0.5,
        skipProcessing: true,
      });
      const photoUrl = photo?.uri ?? `local://task/${task.id}/photo.jpg`;
      setCameraOpen(false);
      await advance('completed', { completionPhotoUrl: photoUrl });
    } finally {
      setSubmitting(false);
    }
  }, [task, advance]);

  if (!task) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Task not found.</Text>
            <Pressable onPress={() => router.back()} style={styles.backCta}>
              <Text style={styles.backCtaText}>Back to queue</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (cameraOpen) {
    return (
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" mode="picture" />
        <View pointerEvents="none" style={styles.cameraOverlay}>
          <Text style={styles.cameraHint}>Photograph the completed room</Text>
        </View>
        <View style={styles.cameraActions}>
          <Pressable onPress={() => setCameraOpen(false)} style={styles.cameraCancel}>
            <Text style={styles.cameraCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={captureAndComplete}
            disabled={submitting}
            style={styles.captureBtn}
          >
            {submitting ? <ActivityIndicator color="#1A1410" /> : <View style={styles.captureDot} />}
          </Pressable>
          <View style={{ width: 70 }} />
        </View>
      </View>
    );
  }

  const isHousekeeping = task.type === 'housekeeping';
  const callGuest = () => {
    if (task.guest.phone) Linking.openURL(`tel:${task.guest.phone}`);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassPill}>
            <Ionicons name="chevron-back" size={18} color={Luxe.ivory} />
          </Pressable>
          <SlaCountdown deadline={task.slaDeadline} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>{task.type.toUpperCase()} · ROOM {task.guest.roomNumber}</Text>
          <Text style={styles.title}>{task.description}</Text>

          <View style={styles.guestCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestName}>{task.guest.name}</Text>
              <Text style={styles.guestMeta}>
                {task.guest.loyaltyTier} · Room {task.guest.roomNumber}
                {task.guest.phone ? ` · ${task.guest.phone}` : ''}
              </Text>
            </View>
            {task.guest.phone ? (
              <Pressable onPress={callGuest} style={styles.iconPill}>
                <Ionicons name="call-outline" size={18} color={Luxe.goldBright} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(staff)/guest', params: { id: task.guest.id } })
              }
              style={styles.iconPill}
            >
              <Ionicons name="person-outline" size={18} color={Luxe.goldBright} />
            </Pressable>
          </View>

          {task.items?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Order items</Text>
              {task.items.map((it, i) => (
                <View key={`${it.name}-${i}`} style={[styles.itemRow, i > 0 && styles.itemRowDivided]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{it.name}</Text>
                    {it.notes ? <Text style={styles.itemNote}>{it.notes}</Text> : null}
                  </View>
                  <Text style={styles.itemQty}>×{it.quantity}</Text>
                  {it.unit_price ? (
                    <Text style={styles.itemPrice}>₹{(it.unit_price * it.quantity).toLocaleString('en-IN')}</Text>
                  ) : null}
                </View>
              ))}
              {task.totalAmount ? (
                <View style={[styles.itemRow, styles.itemRowDivided]}>
                  <Text style={[styles.itemName, { flex: 1 }]}>Total</Text>
                  <Text style={styles.totalAmt}>₹{task.totalAmount.toLocaleString('en-IN')}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add note</Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Allergies, room access, special handling…"
              placeholderTextColor={Luxe.muted}
              multiline
              style={styles.noteInput}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Status · {task.status.toUpperCase()}</Text>
            <View style={styles.statusRow}>
              <StatusDot label="Pending" active={task.status === 'pending'} />
              <StatusBar />
              <StatusDot label="Accepted" active={task.status === 'accepted'} />
              <StatusBar />
              <StatusDot
                label="In progress"
                active={task.status === 'in_progress' || task.status === 'completed'}
              />
              <StatusBar />
              <StatusDot label="Completed" active={task.status === 'completed'} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.actionsBar}>
          {task.status === 'pending' ? (
            <Pressable
              disabled={submitting}
              onPress={() => advance('accepted')}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? 'Accepting…' : 'Accept task'}
              </Text>
            </Pressable>
          ) : null}
          {task.status === 'accepted' ? (
            <Pressable
              disabled={submitting}
              onPress={() => advance('in_progress')}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Start work</Text>
            </Pressable>
          ) : null}
          {task.status === 'in_progress' ? (
            isHousekeeping ? (
              <Pressable
                disabled={submitting}
                onPress={openCompletionCamera}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Complete with photo</Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={submitting}
                onPress={() => advance('completed')}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Mark complete</Text>
              </Pressable>
            )
          ) : null}
          {task.status !== 'cancelled' && task.status !== 'completed' ? (
            <Pressable
              disabled={submitting}
              onPress={() => advance('cancelled')}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: active ? Luxe.goldBright : 'rgba(255,240,210,0.10)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: active ? 'transparent' : Luxe.hairlineStrong,
        }}
      />
      <Text
        style={{
          fontFamily: LuxeFonts.monoMedium,
          fontSize: 8.5,
          letterSpacing: 1.2,
          color: active ? Luxe.goldBright : Luxe.muted,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function StatusBar() {
  return (
    <View
      style={{
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: Luxe.hairlineStrong,
        marginHorizontal: 4,
        marginBottom: 18,
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  glassPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.12)',
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2.4,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 38,
    lineHeight: 42,
    color: Luxe.ivory,
    letterSpacing: -1.2,
    marginBottom: 22,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
  },
  guestName: { fontFamily: LuxeFonts.sansMedium, fontSize: 16, color: Luxe.ivory },
  guestMeta: {
    marginTop: 4,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  itemRowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  itemName: { fontFamily: LuxeFonts.sansMedium, fontSize: 14, color: Luxe.ivory },
  itemNote: {
    marginTop: 2,
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Luxe.muted,
  },
  itemQty: { fontFamily: LuxeFonts.mono, fontSize: 13, color: Luxe.ivoryDim },
  itemPrice: { fontFamily: LuxeFonts.mono, fontSize: 13, color: Luxe.ivoryDim },
  totalAmt: { fontFamily: LuxeFonts.serif, fontSize: 18, color: Luxe.ivory },
  noteInput: {
    minHeight: 84,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.10)',
    fontFamily: LuxeFonts.sans,
    fontSize: 14,
    color: Luxe.ivory,
    textAlignVertical: 'top',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  actionsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: 'rgba(8,7,10,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Luxe.goldBright,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: '#1A1410',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: 'rgba(255,240,210,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,240,210,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 12,
    color: Luxe.ivoryDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyTitle: { fontFamily: LuxeFonts.serif, fontSize: 22, color: Luxe.ivoryDim },
  backCta: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Luxe.goldBright,
  },
  backCtaText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 12,
    color: '#1A1410',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHint: {
    fontFamily: LuxeFonts.mono,
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cameraActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cameraCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraCancelText: {
    fontFamily: LuxeFonts.sansMedium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureDot: { width: 56, height: 56, borderRadius: 28, backgroundColor: Luxe.goldBright },
});
