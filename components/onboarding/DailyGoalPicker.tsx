import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DAILY_GOAL_OPTIONS } from '@/lib/preferencesWizardSteps';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  selectedValue: string;
  onChange: (value: string) => void;
};

export function DailyGoalPicker({ selectedValue, onChange }: Props) {
  return (
    <View style={styles.list}>
      {DAILY_GOAL_OPTIONS.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.primary, isSelected && styles.textSelected]}>{option.label}</Text>
            <Text style={[styles.secondary, isSelected && styles.textSelected]}>
              {option.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  row: {
    alignItems: 'center',
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  primary: {
    color: onboardingColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  secondary: {
    color: onboardingColors.textMuted,
    fontSize: 15,
  },
  textSelected: {
    color: onboardingColors.primaryText,
  },
});
