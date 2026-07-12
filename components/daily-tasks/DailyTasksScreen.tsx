import { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { DailyTaskHistoryList } from '@/components/daily-tasks/DailyTaskHistoryList';
import { TodayTaskPanel } from '@/components/daily-tasks/TodayTaskPanel';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { dashboardColors } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePlanStore } from '@/store/usePlanStore';

export function DailyTasksScreen() {
  const { user } = useAuth();
  const hobbies = usePlanStore((s) => s.hobbies);
  const hydrate = useGamificationStore((s) => s.hydrate);
  const refreshTodayTasks = useGamificationStore((s) => s.refreshTodayTasks);
  const refreshHistory = useGamificationStore((s) => s.refreshHistory);
  const generateTodayTask = useGamificationStore((s) => s.generateTodayTask);
  const completeDailyTask = useGamificationStore((s) => s.completeDailyTask);
  const todayBundle = useGamificationStore((s) => s.todayBundle);
  const historyItems = useGamificationStore((s) => s.historyItems);
  const historyMemberSince = useGamificationStore((s) => s.historyMemberSince);
  const isGeneratingTask = useGamificationStore((s) => s.isGeneratingTask);
  const isCompletingTask = useGamificationStore((s) => s.isCompletingTask);
  const lastTaskError = useGamificationStore((s) => s.lastTaskError);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrate(user.id).then(() => {
        void refreshTodayTasks();
        void refreshHistory();
      });
    }, [hydrate, refreshHistory, refreshTodayTasks, user?.id]),
  );

  const runGenerate = async (mode: 'primary' | 'regenerate' | 'bonus') => {
    const task = await generateTodayTask(mode);
    if (!task) {
      const message =
        useGamificationStore.getState().lastTaskError ?? 'Please try again in a moment.';
      Alert.alert('Couldn’t generate', message);
    }
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Generate today’s task when you’re ready. Skipping still counts toward your streak miss.
        </Text>

        <TodayTaskPanel
          bundle={todayBundle}
          hasHobbies={hobbies.length > 0}
          isGenerating={isGeneratingTask}
          isCompleting={isCompletingTask}
          error={lastTaskError}
          onSeeToday={() => {
            void runGenerate('primary');
          }}
          onRegenerate={() => {
            void runGenerate('regenerate');
          }}
          onGenerateBonus={() => {
            void runGenerate('bonus');
          }}
          onComplete={(taskId) => {
            void completeDailyTask(taskId).then((result) => {
              if (result && result.ratingAwarded > 0) {
                Alert.alert('Nice', `+${result.ratingAwarded} rating`);
              }
            });
          }}
        />

        <Text style={styles.sectionTitle}>History</Text>
        <Text style={styles.sectionSub}>Calendar since you joined · tap a day for details</Text>
        <DailyTaskHistoryList items={historyItems} memberSince={historyMemberSince} />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 40,
  },
  lead: {
    color: dashboardColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  sectionSub: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    marginTop: -8,
  },
});
