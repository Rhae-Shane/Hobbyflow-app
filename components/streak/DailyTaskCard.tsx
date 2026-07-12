import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { DailyTaskRow } from '@/types/gamification.types';

type Props = {
  task: DailyTaskRow | null;
  isCompleting: boolean;
  onComplete: () => void;
  onSeeToday?: () => void;
  onOpenDailyTasks?: () => void;
};

function taskIcon(task: DailyTaskRow): string {
  if (task.task_type === 'complete_lesson') return '📖';
  if (task.task_type === 'practice_minutes') return '⏱️';
  return '✨';
}

export function DailyTaskCard({
  task,
  isCompleting,
  onComplete,
  onSeeToday,
  onOpenDailyTasks,
}: Props) {
  if (!task) {
    return (
      <View style={styles.card}>
        <View style={styles.body}>
          <Text style={styles.title}>No task yet today</Text>
          <Text style={styles.meta}>Tap to generate a personalised daily task</Text>
        </View>
        <Pressable
          style={styles.cta}
          onPress={onSeeToday ?? onOpenDailyTasks}
          accessibilityLabel="See today's task"
        >
          <Text style={styles.ctaText}>See today</Text>
        </Pressable>
      </View>
    );
  }

  const done = task.status === 'completed';
  const counts = task.counts_for_rating !== false;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{taskIcon(task)}</Text>
      </View>
      <Pressable style={styles.body} onPress={onOpenDailyTasks} disabled={!onOpenDailyTasks}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>
          {done
            ? counts
              ? `+${task.rating_awarded ?? task.rating_reward} rating earned`
              : 'Bonus task · no rating'
            : counts
              ? `+${task.rating_reward} rating · streak bonus on complete`
              : 'Bonus · completing won’t raise rating'}
        </Text>
      </Pressable>
      {done ? (
        <Pressable onPress={onOpenDailyTasks}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.cta} onPress={onComplete} disabled={isCompleting}>
          {isCompleting ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.ctaText}>Done</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E8F6FE',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  cta: {
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.pill,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  done: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
});
