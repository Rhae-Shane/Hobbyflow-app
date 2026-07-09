import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

export type ChipLayout = 'wrap' | 'list' | 'grid';

type Props = {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minSelection?: number;
  layout?: ChipLayout;
};

export function MultiSelectChips({
  options,
  selected,
  onChange,
  minSelection = 0,
  layout = 'wrap',
}: Props) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      if (selected.length <= minSelection) return;
      onChange(selected.filter((item) => item !== option));
      return;
    }
    onChange([...selected, option]);
  };

  const containerStyle =
    layout === 'list'
      ? styles.list
      : layout === 'grid'
        ? styles.grid
        : styles.wrap;

  const chipStyle =
    layout === 'list' ? styles.chipList : layout === 'grid' ? styles.chipGrid : styles.chip;

  return (
    <View style={containerStyle}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Pressable
            key={option}
            style={[chipStyle, isSelected && styles.chipSelected]}
            onPress={() => toggle(option)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  list: {
    gap: spacing.sm,
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipList: {
    alignItems: 'center',
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
  chipGrid: {
    alignItems: 'center',
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '48%',
  },
  chipSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
    shadowColor: onboardingColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  chipText: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipTextSelected: {
    color: onboardingColors.primaryText,
  },
});
