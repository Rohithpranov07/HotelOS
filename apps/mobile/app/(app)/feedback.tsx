import { useEffect, useRef, useState } from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useFeedbackStore,
  type CategoryRatings,
  type FeedbackResult,
  type Mood,
} from '../../src/stores/feedback.store';
import { useReservationStore } from '../../src/stores/reservation.store';
import { VoiceRecorder, playVoiceNote } from '../../src/lib/voiceRecorder';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

const MOODS: Array<{ value: Mood; emoji: string; label: string }> = [
  { value: 1, emoji: '😢', label: 'Very unhappy' },
  { value: 2, emoji: '😕', label: 'Unhappy' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Happy' },
  { value: 5, emoji: '😍', label: 'Loved it!' },
];

const MAX_RECORD_SECONDS = 60;

export default function FeedbackScreen() {
  useLuxeFonts();
  const router = useRouter();
  const params = useLocalSearchParams<{ reservationId?: string }>();
  const reservation = useReservationStore((s) => s.reservation);
  const submit = useFeedbackStore((s) => s.submit);
  const submitting = useFeedbackStore((s) => s.submitting);

  const [overall, setOverall] = useState<Mood | null>(null);
  const [categories, setCategories] = useState<CategoryRatings>({
    food: 0,
    housekeeping: 0,
    frontDesk: 0,
    concierge: 0,
  });
  const [comment, setComment] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (overall) {
      indicatorX.value = withSpring((overall - 1) * 64, { damping: 14 });
    }
  }, [overall]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const startRecording = async () => {
    if (!recorderRef.current) recorderRef.current = new VoiceRecorder();
    const ok = await recorderRef.current.start();
    if (!ok) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecording(true);
    setRecordSec(0);
    timerRef.current = setInterval(() => {
      setRecordSec((s) => {
        const next = s + 1;
        if (next >= MAX_RECORD_SECONDS) {
          void stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const uri = await recorderRef.current.stop();
    setRecording(false);
    if (uri) setVoiceUri(uri);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const playBack = async () => {
    if (!voiceUri || playing) return;
    setPlaying(true);
    await playVoiceNote(voiceUri, () => setPlaying(false));
  };

  const onSubmit = async () => {
    if (!overall) return;
    const reservationId = (params.reservationId as string) ?? reservation?.id ?? 'demo-reservation';
    const r = await submit({
      reservationId,
      overall,
      categories,
      comment: comment.trim() || undefined,
      voiceNoteUri: voiceUri ?? undefined,
    });
    setResult(r);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onShareToGoogle = () => {
    Linking.openURL('https://search.google.com/local/writereview?placeid=demo-place-id').catch(
      () => undefined,
    );
    router.replace('/(app)/home');
  };

  const onContactManager = () => {
    router.replace('/(app)/concierge');
  };

  if (result) {
    return <ResultView result={result} onGoogle={onShareToGoogle} onManager={onContactManager} onClose={() => router.replace('/(app)/home')} />;
  }

  const ready = overall !== null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassPill}>
            <Ionicons name="chevron-back" size={18} color={Luxe.ivory} />
          </Pressable>
          <Text style={styles.kicker}>Feedback</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>How was your stay?</Text>
          {reservation ? (
            <Text style={styles.subhead}>
              Hôtel Octave · {reservation.checkInDate} → {reservation.checkOutDate}
            </Text>
          ) : null}

          {/* Mood picker */}
          <View style={styles.moodSection}>
            <Text style={styles.sectionLabel}>Overall experience</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <MoodButton
                  key={m.value}
                  mood={m}
                  selected={overall === m.value}
                  onPress={() => {
                    setOverall(m.value);
                    void Haptics.selectionAsync();
                  }}
                />
              ))}
            </View>
            <View style={styles.indicatorTrack}>
              <Animated.View style={[styles.indicatorDot, indicatorStyle]} />
            </View>
            {overall ? (
              <Text style={styles.moodLabel}>{MOODS[overall - 1]!.label}</Text>
            ) : (
              <Text style={[styles.moodLabel, { color: Luxe.muted }]}>Pick a face above</Text>
            )}
          </View>

          {/* Category ratings */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Rate specific areas</Text>
            <CategoryRow
              label="Food & Beverage"
              value={categories.food}
              onChange={(v) => setCategories((c) => ({ ...c, food: v }))}
            />
            <CategoryRow
              label="Housekeeping"
              value={categories.housekeeping}
              onChange={(v) => setCategories((c) => ({ ...c, housekeeping: v }))}
            />
            <CategoryRow
              label="Front Desk"
              value={categories.frontDesk}
              onChange={(v) => setCategories((c) => ({ ...c, frontDesk: v }))}
            />
            <CategoryRow
              label="Concierge"
              value={categories.concierge}
              onChange={(v) => setCategories((c) => ({ ...c, concierge: v }))}
            />
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tell us more (optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="The staff were so helpful…"
              placeholderTextColor={Luxe.muted}
              multiline
              style={styles.commentInput}
            />
          </View>

          {/* Voice note */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Voice note (optional)</Text>
            <View style={styles.voiceRow}>
              {recording ? (
                <Pressable onPress={stopRecording} style={[styles.voiceBtn, styles.voiceRecording]}>
                  <View style={styles.voiceStop} />
                  <Text style={styles.voiceText}>
                    {formatTimer(recordSec)} · STOP
                  </Text>
                </Pressable>
              ) : voiceUri ? (
                <>
                  <Pressable onPress={playBack} style={styles.voiceBtn} disabled={playing}>
                    <Ionicons
                      name={playing ? 'pause' : 'play'}
                      size={18}
                      color={Luxe.goldBright}
                    />
                    <Text style={styles.voiceText}>{playing ? 'PLAYING…' : 'PLAY'}</Text>
                  </Pressable>
                  <Pressable onPress={() => setVoiceUri(null)} style={styles.voiceLink}>
                    <Text style={styles.voiceLinkText}>Remove</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={startRecording} style={styles.voiceBtn}>
                  <Ionicons name="mic" size={18} color={Luxe.goldBright} />
                  <Text style={styles.voiceText}>RECORD · UP TO 60S</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={!ready || submitting}
            style={[styles.submitBtn, (!ready || submitting) && { opacity: 0.4 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#1A1410" />
            ) : (
              <Text style={styles.submitText}>Submit feedback</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface MoodButtonProps {
  mood: { value: Mood; emoji: string; label: string };
  selected: boolean;
  onPress: () => void;
}

function MoodButton({ mood, selected, onPress }: MoodButtonProps) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(selected ? 1.3 : 1, { damping: 12 });
  }, [selected]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={onPress} style={styles.moodBtn} hitSlop={8}>
      <Animated.Text style={[styles.moodEmoji, style]}>{mood.emoji}</Animated.Text>
    </Pressable>
  );
}

interface CategoryRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function CategoryRow({ label, value, onChange }: CategoryRowProps) {
  return (
    <View style={styles.catRow}>
      <Text style={styles.catLabel}>{label}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => {
              onChange(n);
              void Haptics.selectionAsync();
            }}
            hitSlop={6}
          >
            <Ionicons
              name={n <= value ? 'star' : 'star-outline'}
              size={22}
              color={n <= value ? Luxe.goldBright : Luxe.titanium}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface ResultViewProps {
  result: FeedbackResult;
  onGoogle: () => void;
  onManager: () => void;
  onClose: () => void;
}

function ResultView({ result, onGoogle, onManager, onClose }: ResultViewProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.resultWrap}>
          {result.recommendation === 'google_review' ? (
            <>
              <Ionicons name="star" size={48} color={Luxe.goldBright} />
              <Text style={styles.resultTitle}>Thank you.</Text>
              <Text style={styles.resultBody}>
                You earned {result.pointsEarned} points. Would you share this on Google?
              </Text>
              <Pressable onPress={onGoogle} style={styles.submitBtn}>
                <Text style={styles.submitText}>Share on Google</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.skipBtn}>
                <Text style={styles.skipText}>Maybe later</Text>
              </Pressable>
            </>
          ) : result.recommendation === 'manager_contact' ? (
            <>
              <Ionicons name="heart-circle-outline" size={48} color="#E27A6E" />
              <Text style={styles.resultTitle}>We're sorry.</Text>
              <Text style={styles.resultBody}>
                We earned {result.pointsEarned} points for you, but more importantly — we'd like to
                make this right. Talk to our manager?
              </Text>
              <Pressable onPress={onManager} style={styles.submitBtn}>
                <Text style={styles.submitText}>Connect with manager</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.skipBtn}>
                <Text style={styles.skipText}>Not now</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={48} color={Luxe.goldBright} />
              <Text style={styles.resultTitle}>Got it.</Text>
              <Text style={styles.resultBody}>
                Thanks for the feedback. {result.pointsEarned} points credited to your account.
              </Text>
              <Pressable onPress={onClose} style={styles.submitBtn}>
                <Text style={styles.submitText}>Back home</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Luxe.obsidian },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 },
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
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
  moodSection: { marginTop: 28 },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: 320,
    alignSelf: 'center',
  },
  moodBtn: { width: 48, alignItems: 'center', justifyContent: 'center' },
  moodEmoji: { fontSize: 36 },
  indicatorTrack: {
    marginTop: 12,
    height: 4,
    width: 320,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: 'rgba(255,240,210,0.08)',
    paddingLeft: 22,
  },
  indicatorDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luxe.goldBright,
  },
  moodLabel: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
    textTransform: 'uppercase',
  },
  section: { marginTop: 32 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  catLabel: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivory },
  starRow: { flexDirection: 'row', gap: 6 },
  commentInput: {
    minHeight: 96,
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
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  voiceRecording: {
    backgroundColor: 'rgba(226,122,110,0.16)',
    borderColor: '#E27A6E',
  },
  voiceStop: { width: 12, height: 12, borderRadius: 2, backgroundColor: '#E27A6E' },
  voiceText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.goldBright,
  },
  voiceLink: {},
  voiceLinkText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: Luxe.titanium,
  },
  submitBtn: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: Luxe.goldBright,
  },
  submitText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: '#1A1410',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  resultTitle: {
    marginTop: 12,
    fontFamily: LuxeFonts.serif,
    fontSize: 36,
    color: Luxe.ivory,
    letterSpacing: -1.2,
  },
  resultBody: {
    fontFamily: LuxeFonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: Luxe.ivoryDim,
    textAlign: 'center',
    maxWidth: 320,
  },
  skipBtn: { marginTop: 8, paddingVertical: 12 },
  skipText: {
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },
});
