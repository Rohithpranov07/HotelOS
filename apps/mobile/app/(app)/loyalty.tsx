import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLoyaltyStore, type LoyaltyTransaction } from '../../src/stores/loyalty.store';
import { useLuxeFonts } from '../../src/lib/useLuxeFonts';
import { Luxe, LuxeFonts } from '../../src/theme/luxe';

export default function LoyaltyScreen() {
  useLuxeFonts();
  const router = useRouter();
  const summary = useLoyaltyStore((s) => s.summary);
  const isLoading = useLoyaltyStore((s) => s.isLoading);
  const statement = useLoyaltyStore((s) => s.statement);
  const isLoadingMore = useLoyaltyStore((s) => s.isLoadingMore);
  const hasMore = useLoyaltyStore((s) => s.statementHasMore);
  const fetchSummary = useLoyaltyStore((s) => s.fetchSummary);
  const fetchStatement = useLoyaltyStore((s) => s.fetchStatement);

  const progress = useSharedValue(0);

  useEffect(() => {
    fetchSummary();
    fetchStatement({ reset: true });
  }, [fetchSummary, fetchStatement]);

  useEffect(() => {
    if (summary) {
      progress.value = 0;
      progress.value = withDelay(300, withTiming(summary.tierProgressPct, { duration: 1200 }));
    }
  }, [summary?.tierProgressPct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  if (!summary || isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Luxe.goldBright} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassPill}>
            <Ionicons name="chevron-back" size={18} color={Luxe.ivory} />
          </Pressable>
          <Text style={styles.kicker}>My Rewards</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Tier card */}
          <View style={styles.tierCard}>
            <LinearGradient
              colors={['rgba(244,201,126,0.30)', 'rgba(139,111,71,0.10)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.tierBadge}>
              <Ionicons name="trophy" size={14} color={Luxe.goldBright} />
              <Text style={styles.tierBadgeText}>{summary.tier} MEMBER</Text>
            </View>
            <Text style={styles.pointsValue}>{summary.currentPoints.toLocaleString('en-IN')}</Text>
            <Text style={styles.pointsLabel}>
              points · ≈ ₹{summary.redemptionValue.toLocaleString('en-IN')} value
            </Text>

            {summary.nextTier ? (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, barStyle]} />
                </View>
                <Text style={styles.progressText}>
                  {summary.pointsToNextTier.toLocaleString('en-IN')} pts to {summary.nextTier}
                </Text>
              </View>
            ) : (
              <Text style={styles.progressText}>Top tier reached</Text>
            )}
          </View>

          {/* Stay highlights */}
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This stay</Text>
              <Text style={styles.statValue}>+{summary.thisStayEarned}</Text>
            </View>
            {summary.pointsExpiringSoon ? (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Expiring soon</Text>
                <Text style={[styles.statValue, { color: Luxe.amberGlow }]}>
                  {summary.pointsExpiringSoon.amount} · {summary.pointsExpiringSoon.expiryDate}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Benefits</Text>
            {summary.tierBenefits.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={Luxe.goldBright} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Challenges */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Challenges</Text>
            <View style={styles.challengeGrid}>
              {summary.challenges.map((c) => {
                const complete = c.progress >= c.target;
                return (
                  <View key={c.id} style={[styles.challengeCard, complete && styles.challengeDone]}>
                    <Ionicons
                      name={complete ? 'checkmark-circle' : c.icon}
                      size={20}
                      color={complete ? Luxe.goldBright : Luxe.ivory}
                    />
                    <Text style={[styles.challengeTitle, complete && { color: Luxe.muted }]}>
                      {c.title}
                    </Text>
                    <Text style={styles.challengeProgress}>
                      {complete ? 'COMPLETE' : `${c.progress}/${c.target}`}
                    </Text>
                    <Text style={styles.challengeReward}>+{c.rewardPoints} pts</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Statement */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Transaction history</Text>
            {statement.map((tx) => (
              <StatementRow key={tx.id} tx={tx} />
            ))}
            {hasMore ? (
              <Pressable
                onPress={() => fetchStatement()}
                disabled={isLoadingMore}
                style={styles.loadMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator color={Luxe.goldBright} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatementRow({ tx }: { tx: LoyaltyTransaction }) {
  const positive = tx.points >= 0;
  return (
    <View style={styles.txRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.txReason}>{tx.reason}</Text>
        <Text style={styles.txMeta}>
          {tx.type.toUpperCase()} · {new Date(tx.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.txPoints, positive ? styles.txEarn : styles.txSpend]}>
        {positive ? '+' : ''}
        {tx.points}
      </Text>
    </View>
  );
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },
  tierCard: {
    borderRadius: 26,
    overflow: 'hidden',
    padding: 22,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.24)',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(244,201,126,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,201,126,0.30)',
  },
  tierBadgeText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Luxe.goldBright,
  },
  pointsValue: {
    marginTop: 18,
    fontFamily: LuxeFonts.serif,
    fontSize: 56,
    lineHeight: 58,
    color: Luxe.ivory,
    letterSpacing: -2,
  },
  pointsLabel: {
    marginTop: 4,
    fontFamily: LuxeFonts.mono,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: Luxe.titanium,
  },
  progressWrap: { marginTop: 22 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,240,210,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Luxe.goldBright,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontFamily: LuxeFonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Luxe.ivoryDim,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  statItem: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(20,18,15,0.55)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,240,210,0.08)',
  },
  statLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: Luxe.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: LuxeFonts.serif,
    fontSize: 22,
    color: Luxe.ivory,
    letterSpacing: -0.6,
  },
  section: { marginTop: 28 },
  sectionLabel: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Luxe.gold,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  benefitText: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivory },
  challengeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  challengeCard: {
    width: '47%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#0C0A08',
    borderWidth: 0.5,
    borderColor: 'rgba(244,201,126,0.16)',
    gap: 6,
  },
  challengeDone: {
    backgroundColor: 'rgba(244,201,126,0.04)',
    opacity: 0.65,
  },
  challengeTitle: {
    fontFamily: LuxeFonts.sansSemibold,
    fontSize: 13,
    color: Luxe.ivory,
  },
  challengeProgress: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Luxe.titanium,
  },
  challengeReward: {
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Luxe.goldBright,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Luxe.hairlineStrong,
  },
  txReason: { fontFamily: LuxeFonts.sans, fontSize: 14, color: Luxe.ivory },
  txMeta: {
    marginTop: 3,
    fontFamily: LuxeFonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Luxe.muted,
  },
  txPoints: {
    fontFamily: LuxeFonts.serif,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  txEarn: { color: Luxe.goldBright },
  txSpend: { color: Luxe.titanium },
  loadMore: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Luxe.hairlineStrong,
  },
  loadMoreText: {
    fontFamily: LuxeFonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Luxe.ivoryDim,
    textTransform: 'uppercase',
  },
});
