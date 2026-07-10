import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { DailyTaskRow } from '@/types/gamification.types';

type Props = {
  task: DailyTaskRow | null;
  isCompleting: boolean;
  onComplete: () => void;
};

export function DailyTaskCard({ task, isCompleting, onComplete }: Props) {
  if (!task) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>Add a hobby to unlock today's task.</Text>
      </View>
    );
  }

  const done = task.status === 'completed';

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{task.task_type === 'complete_lesson' ? '📖' : '⏱️'}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>+{task.rating_reward} rating · streak bonus on complete</Text>
      </View>
      {done ? (
        <Text style={styles.done}>Done</Text>
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
    minWidth: 64,
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
  empty: {
    color: onboardingColors.textMuted,
    fontSize: 14,
  },
});
