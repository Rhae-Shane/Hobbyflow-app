import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  options: readonly string[];
  selectedValue: string;
  onChange: (value: string) => void;
};

export function SingleSelectList({ options, selectedValue, onChange }: Props) {
  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <Pressable
            key={option}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  label: {
    color: onboardingColors.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSelected: {
    color: onboardingColors.primaryText,
  },
});
