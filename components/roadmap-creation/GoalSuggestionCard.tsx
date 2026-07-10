import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { GoalCardState } from '@/types/roadmapCreation.types';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  goalCard: GoalCardState;
  onChange: (patch: Partial<GoalCardState>) => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

const LEVELS: GoalCardState['suggestedLevel'][] = ['beginner', 'intermediate', 'advanced'];

export function GoalSuggestionCard({ goalCard, onChange, onConfirm, isLoading = false }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Here&apos;s what I&apos;m thinking:</Text>

      <Text style={styles.label}>Roadmap name</Text>
      <TextInput
        style={styles.input}
        value={goalCard.suggestedName}
        onChangeText={(suggestedName) => onChange({ suggestedName })}
        editable={!isLoading}
      />

      <Text style={styles.label}>Learning goal</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={goalCard.suggestedGoal}
        onChangeText={(suggestedGoal) => onChange({ suggestedGoal })}
        multiline
        editable={!isLoading}
      />

      <Text style={styles.label}>Background knowledge</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={goalCard.suggestedBackground}
        onChangeText={(suggestedBackground) => onChange({ suggestedBackground })}
        multiline
        editable={!isLoading}
      />

      <Text style={styles.label}>Experience level</Text>
      <View style={styles.levelRow}>
        {LEVELS.map((level) => {
          const selected = goalCard.suggestedLevel === level;
          return (
            <Pressable
              key={level}
              style={[styles.levelChip, selected && styles.levelChipSelected]}
              onPress={() => onChange({ suggestedLevel: level })}
              disabled={isLoading}
            >
              <Text style={[styles.levelText, selected && styles.levelTextSelected]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.cta, isLoading && styles.ctaDisabled]}
        onPress={onConfirm}
        disabled={isLoading}
      >
        <Text style={styles.ctaText}>LOOKS GOOD, CONTINUE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  heading: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: onboardingColors.background,
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  levelChip: {
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  levelChipSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  levelText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  levelTextSelected: {
    color: onboardingColors.primaryText,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
