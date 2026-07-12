import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DailyTaskCard } from '@/components/streak/DailyTaskCard';
import { RankingList } from '@/components/streak/RankingList';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { StreakHeroCard } from '@/components/streak/StreakHeroCard';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { daysRemaining } from '@/lib/pact/pactMath';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';

export function StreakScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const hydrate = useGamificationStore((s) => s.hydrate);
  const refreshLeaderboard = useGamificationStore((s) => s.refreshLeaderboard);
  const completeDailyTask = useGamificationStore((s) => s.completeDailyTask);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const longestStreak = useGamificationStore((s) => s.longestStreak);
  const streakSavers = useGamificationStore((s) => s.streakSavers);
  const activityDates = useGamificationStore((s) => s.activityDates);
  const saverUsedDates = useGamificationStore((s) => s.saverUsedDates);
  const pactsFulfilled = useGamificationStore((s) => s.pactsFulfilled);
  const todayTask = useGamificationStore((s) => s.todayTask);
  const isCompletingTask = useGamificationStore((s) => s.isCompletingTask);
  const leaderboard = useGamificationStore((s) => s.leaderboard);
  const myRank = useGamificationStore((s) => s.myRank);
  const rating = useGamificationStore((s) => s.rating);
  const leagueId = useGamificationStore((s) => s.leagueId);
  const leagues = useGamificationStore((s) => s.leagues);
  const hydratePact = usePactStore((s) => s.hydrate);
  const activePact = usePactStore((s) => s.activePact);

  const pactRange = useMemo(
    () =>
      activePact
        ? { startDate: activePact.start_date, endDate: activePact.end_date }
        : null,
    [activePact],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrate(user.id);
      void hydratePact(user.id);
      void refreshLeaderboard();
    }, [hydrate, hydratePact, refreshLeaderboard, user?.id]),
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backGlyph}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Streak</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <StreakHeroCard streakDays={currentStreak} />
        <StreakCalendar
          activityDates={activityDates}
          saverUsedDates={saverUsedDates}
          pactRange={pactRange}
        />

        <Pressable
          style={styles.pactCard}
          onPress={() => router.push('/(app)/pact' as never)}
          accessibilityLabel="Open The Pact"
        >
          <Text style={styles.pactIcon}>🤝</Text>
          <View style={styles.pactBody}>
            <Text style={styles.pactTitle}>The Pact</Text>
            <Text style={styles.pactMeta} numberOfLines={2}>
              {activePact
                ? `${activePact.hobby_name ?? 'Hobby'} · ${daysRemaining(activePact.end_date)}d to deadline`
                : pactsFulfilled > 0
                  ? `${pactsFulfilled} kept · seal a new goal`
                  : 'Seal a goal with a deadline'}
            </Text>
          </View>
          <Text style={styles.pactChevron}>›</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={[styles.statCard, styles.leagueCardFull]}>
          <LeagueBadge leagueId={leagueId} leagues={leagues} />
          <Text style={styles.statLabel}>League</Text>
        </View>

        <View style={styles.saverCard}>
          <Text style={styles.saverIcon}>🛡️</Text>
          <View style={styles.saverBody}>
            <Text style={styles.saverTitle}>Streak Savers</Text>
            <Text style={styles.saverMeta}>
              {streakSavers} left · used automatically if you miss a day
            </Text>
          </View>
          <Text style={styles.saverCount}>{streakSavers}/3</Text>
        </View>

        <Text style={styles.sectionTitle}>Daily Task</Text>
        <Text style={styles.sectionSub}>Generate when ready · finish to raise your rating</Text>
        <DailyTaskCard
          task={todayTask}
          isCompleting={isCompletingTask}
          onComplete={() => {
            void completeDailyTask();
          }}
          onSeeToday={() => router.push('/(app)/daily-tasks' as never)}
          onOpenDailyTasks={() => router.push('/(app)/daily-tasks' as never)}
        />

        <Text style={styles.sectionTitle}>Ranking</Text>
        <Text style={styles.sectionSub}>Top learners by rating</Text>
        <RankingList entries={leaderboard} myRank={myRank} leagues={leagues} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backGlyph: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: spacing.md,
  },
  leagueCard: {
    justifyContent: 'center',
  },
  leagueCardFull: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  statValue: {
    color: onboardingColors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pactCard: {
    alignItems: 'center',
    backgroundColor: '#F7F3EA',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  pactIcon: {
    fontSize: 22,
  },
  pactBody: {
    flex: 1,
    gap: 2,
  },
  pactTitle: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pactMeta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  pactChevron: {
    color: onboardingColors.textMuted,
    fontSize: 22,
  },
  saverCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  saverIcon: {
    fontSize: 22,
  },
  saverBody: {
    flex: 1,
    gap: 2,
  },
  saverTitle: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  saverMeta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  saverCount: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  sectionSub: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    marginTop: -8,
  },
});
