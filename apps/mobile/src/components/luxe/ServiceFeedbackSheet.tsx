import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Luxe, LuxeFonts } from '../../theme/luxe';
import {
  sentimentForMood,
  type Order,
  type ServiceFeedbackInput,
  type ServiceFeedbackResult,
  type ServiceMood,
} from '../../stores/orders.store';

const MOODS: Array<{ value: ServiceMood; emoji: string; label: string }> = [
  { value: 1, emoji: '😞', label: 'Let me down' },
  { value: 2, emoji: '😕', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'It was fine' },
  { value: 4, emoji: '🙂', label: 'Lovely' },
  { value: 5, emoji: '😍', label: 'Exceptional' },
];

// Accent + framing shift with how the guest feels — the core of the
// emotion-aware system. Positive moods celebrate; negative moods apologise.
const POSITIVE_ACCENT = Luxe.amberGlow;
const NEGATIVE_ACCENT = '#E27A6E';

interface ServiceCopy {
  label: string;
  positiveTags: string[];
  negativeTags: string[];
}

const SERVICE_COPY: Record<string, ServiceCopy> = {
  food: {
    label: 'Room service',
    positiveTags: ['Delicious', 'Hot & fresh', 'Quick', 'Beautifully plated'],
    negativeTags: ['Arrived cold', 'Too slow', 'Wrong item', 'Portion small'],
  },
  housekeeping: {
    label: 'Housekeeping',
    positiveTags: ['Spotless', 'Fast', 'Discreet', 'Lovely touch'],
    negativeTags: ['Missed spots', 'Too slow', 'Disturbed me', 'Felt rushed'],
  },
  amenity: {
    label: 'Amenity request',
    positiveTags: ['Quick', 'Exactly right', 'Friendly'],
    negativeTags: ['Took too long', 'Wrong item', 'Never arrived'],
  },
  spa: {
    label: 'Spa & wellness',
    positiveTags: ['Deeply relaxing', 'Skilled', 'On time', 'Serene'],
    negativeTags: ['Felt rushed', 'Started late', 'Not as expected'],
  },
  recreation: {
    label: 'Recreation',
    positiveTags: ['Great fun', 'Spotless', 'Helpful staff'],
    negativeTags: ['Overcrowded', 'Poorly kept', 'Hard to book'],
  },
};

function copyFor(type: string): ServiceCopy {
  return (
    SERVICE_COPY[type] ?? {
      label: 'Your request',
      positiveTags: ['Great', 'Quick', 'Friendly'],
      negativeTags: ['Too slow', 'Not as expected', 'Disappointing'],
    }
  );
}

export function ServiceFeedbackSheet({
  order,
  onSubmit,
  onDismiss,
}: {
  order: Order | null;
  onSubmit: (input: ServiceFeedbackInput) => Promise<ServiceFeedbackResult>;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<ServiceMood | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<ServiceFeedbackResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!order) return;
    setMood(null);
    setTags([]);
    setNote('');
    setResult(null);
    setSubmitting(false);
  }, [order?.id]);

  const copy = copyFor(order?.type ?? '');
  const sentiment = mood ? sentimentForMood(mood) : null;
  const accent = sentiment === 'negative' ? NEGATIVE_ACCENT : POSITIVE_ACCENT;
  const serviceName = order?.items[0]?.name ?? copy.label;

  const visibleTags = useMemo(() => {
    if (!mood) return [];
    if (mood >= 4) return copy.positiveTags;
    if (mood <= 2) return copy.negativeTags;
    return [...copy.positiveTags.slice(0, 2), ...copy.negativeTags.slice(0, 2)];
  }, [mood, copy]);

  // Reset tag picks whenever the mood band flips, so stale chips don't linger.
  useEffect(() => {
    setTags([]);
  }, [mood && mood >= 4 ? 'pos' : mood && mood <= 2 ? 'neg' : 'neu']);

  const toggleTag = (t: string) => {
    void Haptics.selectionAsync();
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSubmit = async () => {
    if (!order || !mood || submitting) return;
    setSubmitting(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const r = await onSubmit({ orderId: order.id, mood, tags, note: note.trim() || undefined });
    setResult(r);
    setSubmitting(false);
  };

  return (
    <Modal
      visible={!!order}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grip} />
          {result ? (
            <ResultView
              result={result}
              serviceName={serviceName}
              onClose={onDismiss}
            />
          ) : (
            <>
              <Text style={[styles.kicker, { color: accent }]}>
                {copy.label} · just finished
              </Text>
              <Text style={styles.title}>How was {serviceName.toLowerCase()}?</Text>

              <View style={styles.moodRow}>
                {MOODS.map((m) => (
                  <MoodButton
                    key={m.value}
                    emoji={m.emoji}
                    selected={mood === m.value}
                    onPress={() => {
                      setMood(m.value);
                      void Haptics.selectionAsync();
                    }}
                  />
                ))}
              </View>
              {mood ? (
                <Text style={[styles.moodLabel, { color: accent }]}>
                  {MOODS[mood - 1]!.label}
                </Text>
              ) : (
                <Text style={[styles.moodLabel, { color: Luxe.muted }]}>
                  Tap how it felt
                </Text>
              )}

              {visibleTags.length > 0 && (
                <View style={styles.tagWrap}>
                  {visibleTags.map((t) => {
                    const active = tags.includes(t);
                    return (
                      <Pressable
                        key={t}
                        onPress={() => toggleTag(t)}
                        style={[
                          styles.tag,
                          active && { borderColor: accent, backgroundColor: `${accent}1F` },
                        ]}
                      >
                        <Text style={[styles.tagText, active && { color: accent }]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {mood !== null && (
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={
                    sentiment === 'negative'
                      ? 'Tell us what went wrong — we’ll make it right'
                      : 'Anything you’d like our team to know? (optional)'
                  }
                  placeholderTextColor={Luxe.muted}
                  style={styles.note}
                  multiline
                />
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={!mood || submitting}
                style={[styles.submit, (!mood || submitting) && { opacity: 0.4 }]}
              >
                <LinearGradient
                  colors={
                    sentiment === 'negative'
                      ? ['#E89A8E', '#C25A4C']
                      : ['#F4C97E', '#D4A857', '#9A7A3F']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.submitText}>
                  {submitting ? 'Sending…' : 'Send feedback'}
                </Text>
              </Pressable>

              <Pressable onPress={onDismiss} style={styles.skip} hitSlop={8}>
                <Text style={styles.skipText}>Not now</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MoodButton({
  emoji,
  selected,
  onPress,
}: {
  emoji: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(selected ? 1.35 : 1, { damping: 11 });
  }, [selected]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={onPress} style={styles.moodBtn} hitSlop={6}>
      <Animated.Text style={[styles.moodEmoji, style, !selected && { opacity: 0.55 }]}>
        {emoji}
      </Animated.Text>
    </Pressable>
  );
}

function ResultView({
  result,
  serviceName,
  onClose,
}: {
  result: ServiceFeedbackResult;
  serviceName: string;
  onClose: () => void;
}) {
  const recover = result.recommendation === 'recover';
  const accent = recover ? NEGATIVE_ACCENT : POSITIVE_ACCENT;
  const icon = recover
    ? 'heart-circle-outline'
    : result.recommendation === 'celebrate'
      ? 'sparkles'
      : 'checkmark-circle';
  const title = recover
    ? 'We’re sorry.'
    : result.recommendation === 'celebrate'
      ? 'Wonderful.'
      : 'Thank you.';
  const body = recover
    ? `Thank you for telling us about ${serviceName.toLowerCase()}. Our duty manager has been alerted and will reach out to make it right.`
    : result.recommendation === 'celebrate'
      ? `So glad you loved it. We’ve added ${result.pointsEarned} points to your stay — we’d be honoured if you shared a word.`
      : `Noted, and ${result.pointsEarned} points added to your stay. We’re always refining.`;

  return (
    <View style={styles.resultWrap}>
      <Ionicons name={icon} size={46} color={accent} />
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultBody}>{body}</Text>
      <Pressable onPress={onClose} style={styles.resultBtn}>
        <LinearGradient
          colors={recover ? ['#E89A8E', '#C25A4C'] : ['#F4C97E', '#D4A857', '#9A7A3F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.resultBtnText}>{recover ? 'We appreciate it' : 'You’re welcome'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,3,5,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Luxe.graphite,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.18)',
  },
  grip: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luxe.muted,
    marginBottom: 22,
  },
  kicker: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: LuxeFonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
    paddingHorizontal: 4,
  },
  moodBtn: { width: 50, alignItems: 'center', justifyContent: 'center' },
  moodEmoji: { fontSize: 34 },
  moodLabel: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 22,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: 'rgba(20,18,15,0.6)',
  },
  tagText: {
    fontFamily: LuxeFonts.sans,
    fontSize: 12.5,
    color: Luxe.ivoryDim,
  },
  note: {
    marginTop: 20,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Luxe.hairlineStrong,
    backgroundColor: Luxe.surfaceBottom,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: LuxeFonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: Luxe.ivory,
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: 22,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 14,
    color: '#1A1206',
    letterSpacing: 0.4,
  },
  skip: { marginTop: 14, alignSelf: 'center', paddingVertical: 6 },
  skipText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Luxe.titanium,
    textTransform: 'uppercase',
  },

  // RESULT
  resultWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 14 },
  resultTitle: {
    fontFamily: LuxeFonts.serif,
    fontSize: 30,
    color: Luxe.ivory,
    letterSpacing: -0.8,
    marginTop: 6,
  },
  resultBody: {
    fontFamily: LuxeFonts.sansLight,
    fontSize: 14,
    lineHeight: 21,
    color: Luxe.ivoryDim,
    textAlign: 'center',
    maxWidth: 320,
  },
  resultBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  resultBtnText: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13.5,
    color: '#1A1206',
    letterSpacing: 0.4,
  },
});
