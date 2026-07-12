import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { DailyTaskRow, TodayDailyTasksResponse } from '@/types/gamification.types';

type Props = {
  bundle: TodayDailyTasksResponse | null;
  hasHobbies: boolean;
  isGenerating: boolean;
  isCompleting: boolean;
  error: string | null;
  onSeeToday: () => void;
  onRegenerate: () => void;
  onGenerateBonus: () => void;
  onComplete: (taskId: string) => void;
};

function TaskRow({
  task,
  isCompleting,
  onComplete,
  showRegenerate,
  regeneratesRemaining,
  onRegenerate,
  isGenerating,
}: {
  task: DailyTaskRow;
  isCompleting: boolean;
  onComplete: () => void;
  showRegenerate?: boolean;
  regeneratesRemaining?: number;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}) {
  const done = task.status === 'completed';
  const counts = task.counts_for_rating !== false;

  return (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskMeta}>
        {done
          ? counts
            ? `Completed · +${task.rating_awarded ?? 0} rating`
            : 'Completed · bonus (no rating)'
          : counts
            ? `Open · +${task.rating_reward} rating when done`
            : 'Open bonus · no rating on complete'}
      </Text>
      {!done ? (
        <View style={styles.actions}>
          <Pressable style={styles.primaryBtn} onPress={onComplete} disabled={isCompleting}>
            {isCompleting ? (
              <ActivityIndicator color={onboardingColors.primaryText} />
            ) : (
              <Text style={styles.primaryBtnText}>Mark done</Text>
            )}
          </Pressable>
          {showRegenerate && onRegenerate ? (
            <Pressable
              style={[styles.secondaryBtn, (regeneratesRemaining ?? 0) <= 0 && styles.btnDisabled]}
              onPress={onRegenerate}
              disabled={isGenerating || (regeneratesRemaining ?? 0) <= 0}
            >
              {isGenerating ? (
                <ActivityIndicator color={onboardingColors.text} />
              ) : (
                <Text style={styles.secondaryBtnText}>
                  Regenerate ({regeneratesRemaining ?? 0} left)
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function TodayTaskPanel({
  bundle,
  hasHobbies,
  isGenerating,
  isCompleting,
  error,
  onSeeToday,
  onRegenerate,
  onGenerateBonus,
  onComplete,
}: Props) {
  if (!hasHobbies) {
    return (
      <View style={styles.panel}>
        <Text style={styles.heading}>Today</Text>
        <Text style={styles.empty}>Finish onboarding with a hobby to unlock daily tasks.</Text>
      </View>
    );
  }

  const primary = bundle?.primary ?? null;
  const bonus = bundle?.bonus ?? [];

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Today</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!primary ? (
        <Pressable style={styles.seeToday} onPress={onSeeToday} disabled={isGenerating}>
          {isGenerating ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.seeTodayText}>See today’s task</Text>
          )}
        </Pressable>
      ) : (
        <TaskRow
          task={primary}
          isCompleting={isCompleting}
          onComplete={() => onComplete(primary.id)}
          showRegenerate={primary.status === 'open'}
          regeneratesRemaining={bundle?.regenerates_remaining}
          onRegenerate={onRegenerate}
          isGenerating={isGenerating}
        />
      )}

      {bonus.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          isCompleting={isCompleting}
          onComplete={() => onComplete(task.id)}
        />
      ))}

      {bundle?.can_generate_bonus ? (
        <Pressable style={styles.bonusBtn} onPress={onGenerateBonus} disabled={isGenerating}>
          {isGenerating ? (
            <ActivityIndicator color={onboardingColors.text} />
          ) : (
            <Text style={styles.bonusBtnText}>Generate another task (no rating)</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
  },
  heading: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: onboardingColors.textMuted,
    fontSize: 14,
  },
  error: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  seeToday: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.pill,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  seeTodayText: {
    color: onboardingColors.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 6,
    padding: spacing.md,
  },
  taskTitle: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  taskMeta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.pill,
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: onboardingColors.primaryText,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryBtn: {
    backgroundColor: '#F3F0EA',
    borderRadius: radii.pill,
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  bonusBtn: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingVertical: 12,
  },
  bonusBtnText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
