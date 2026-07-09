import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';

type Props = {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minSelection?: number;
};

export function MultiSelectChips({ options, selected, onChange, minSelection = 0 }: Props) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      if (selected.length <= minSelection) return;
      onChange(selected.filter((item) => item !== option));
      return;
    }
    onChange([...selected, option]);
  };

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Pressable
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
