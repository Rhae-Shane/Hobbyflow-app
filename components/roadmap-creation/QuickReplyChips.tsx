import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  options: { text: string }[];
  multiSelect: boolean;
  selected: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function QuickReplyChips({
  options,
  multiSelect,
  selected,
  onSelect,
  disabled = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option.text);
        return (
          <Pressable
            key={option.text}
            disabled={disabled}
            style={[styles.chip, isSelected && styles.chipSelected, disabled && styles.disabled]}
            onPress={() => onSelect(option.text)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.text}
            </Text>
          </Pressable>
        );
      })}
      {!multiSelect ? (
        <Text style={styles.hint}>Or type your own answer below</Text>
      ) : (
        <Text style={styles.hint}>Select all that apply, add text, then send</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  chipText: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: onboardingColors.primaryText,
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
