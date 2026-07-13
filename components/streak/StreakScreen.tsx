import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DailyTaskCard } from '@/components/streak/DailyTaskCard';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { StreakHeroCard } from '@/components/streak/StreakHeroCard';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';

export function StreakScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const hydrate = useGamificationStore((s) => s.hydrate);
  const completeDailyTask = useGamificationStore((s) => s.completeDailyTask);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const longestStreak = useGamificationStore((s) => s.longestStreak);
  const streakSavers = useGamificationStore((s) => s.streakSavers);
  const activityDates = useGamificationStore((s) => s.activityDates);
  const saverUsedDates = useGamificationStore((s) => s.saverUsedDates);
  const todayTask = useGamificationStore((s) => s.todayTask);
  const isCompletingTask = useGamificationStore((s) => s.isCompletingTask);
  const rating = useGamificationStore((s) => s.rating);
  const leagueId = useGamificationStore((s) => s.leagueId);
  const leagues = useGamificationStore((s) => s.leagues);
  const hydratePact = usePactStore((s) => s.hydrate);
  const activePacts = usePactStore((s) => s.activePacts);

  const pactRanges = useMemo(
    () =>
      activePacts.map((pact) => ({
        startDate: pact.start_date,
        endDate: pact.end_date,
      })),
    [activePacts],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrate(user.id);
      void hydratePact(user.id);
    }, [hydrate, hydratePact, user?.id]),
  );

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <StreakHeroCard streakDays={currentStreak} />
        <StreakCalendar
          activityDates={activityDates}
          saverUsedDates={saverUsedDates}
          pactRanges={pactRanges}
        />

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
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.block,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: spacing.md,
  },
  leagueCardFull: {
    alignItems: 'flex-start',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.block,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  statValue: {
    color: dashboardColors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  saverCard: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.block,
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
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  saverMeta: {
    color: dashboardColors.textMuted,
    fontSize: 12,
  },
  saverCount: {
    color: dashboardColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTitle: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  sectionSub: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    marginTop: -8,
  },
});
