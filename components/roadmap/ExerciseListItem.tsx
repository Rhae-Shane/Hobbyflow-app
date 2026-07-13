import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, spacing } from '@/constants/tokens';
import type { RoadmapExerciseRow } from '@/types/exercise.types';

type ExerciseListItemProps = {
  exercise: RoadmapExerciseRow;
  busy?: boolean;
  onToggleComplete: (exercise: RoadmapExerciseRow) => void;
  onRegenerate: (exercise: RoadmapExerciseRow) => void;
};

export function ExerciseListItem({
  exercise,
  busy = false,
  onToggleComplete,
  onRegenerate,
}: ExerciseListItemProps) {
  const done = exercise.status === 'complete';

  return (
    <View style={styles.row} testID={`exercise-item-${exercise.id}`}>
      <Pressable
        style={[styles.check, done && styles.checkDone]}
        onPress={() => onToggleComplete(exercise)}
        disabled={busy}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        testID={`exercise-toggle-${exercise.id}`}
      >
        <Text style={[styles.checkMark, done && styles.checkMarkDone]}>{done ? '✓' : ''}</Text>
      </Pressable>
      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]}>{exercise.title}</Text>
        <Text style={styles.instructions}>{exercise.instructions}</Text>
        <Pressable
          style={styles.regen}
          onPress={() => onRegenerate(exercise)}
          disabled={busy}
          testID={`exercise-regen-${exercise.id}`}
        >
          {busy ? (
            <ActivityIndicator size="small" color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.regenText}>Regenerate</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: onboardingColors.border,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: onboardingColors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: onboardingColors.chipBackground,
  },
  checkDone: {
    backgroundColor: onboardingColors.primary,
    borderColor: onboardingColors.primary,
  },
  checkMark: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: onboardingColors.primaryText,
  },
  checkMarkDone: {
    color: '#fff',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: onboardingColors.text,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: onboardingColors.textMuted,
  },
  instructions: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: onboardingColors.textMuted,
  },
  regen: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  regenText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: onboardingColors.primaryText,
  },
});
