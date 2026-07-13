import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getOptionIcon } from '@/components/onboarding/optionIcons';
import { theme } from '@/constants/theme';
import { fonts, radii, spacing } from '@/constants/tokens';
import { hapticSelection } from '@/utils/haptics';

export type ChipLayout = 'wrap' | 'list' | 'grid';

type Props = {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minSelection?: number;
  layout?: ChipLayout;
  resolveSelection?: (selected: string[], toggled: string) => string[];
};

export function MultiSelectChips({
  options,
  selected,
  onChange,
  minSelection = 0,
  layout = 'wrap',
  resolveSelection,
}: Props) {
  const toggle = (option: string) => {
    if (resolveSelection) {
      hapticSelection();
      onChange(resolveSelection(selected, option));
      return;
    }

    if (selected.includes(option)) {
      if (selected.length <= minSelection) return;
      hapticSelection();
      onChange(selected.filter((item) => item !== option));
      return;
    }
    hapticSelection();
    onChange([...selected, option]);
  };

  if (layout === 'wrap') {
    return (
      <View style={styles.wrap}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const Icon = getOptionIcon(option);
          return (
            <Pressable
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(option)}
            >
              <Icon width={22} height={22} color={theme.colors.text} />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (layout === 'grid') {
    return (
      <View style={styles.grid}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const Icon = getOptionIcon(option);
          return (
            <Pressable
              key={option}
              style={[styles.chipGrid, isSelected && styles.rowSelected]}
              onPress={() => toggle(option)}
            >
              <Icon width={32} height={32} color={theme.colors.text} />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
              <View style={[styles.check, isSelected && styles.checkSelected]}>
                {isSelected ? <View style={styles.checkDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const Icon = getOptionIcon(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => toggle(option)}
          >
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Icon width={36} height={36} color={theme.colors.text} />
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
              {option}
            </Text>
            <View style={[styles.check, isSelected && styles.checkSelected]}>
              {isSelected ? <View style={styles.checkDot} /> : null}
            </View>
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
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipGrid: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.tile,
    borderWidth: 1.5,
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    width: '48%',
  },
  chipSelected: {
    backgroundColor: theme.colors.navActiveSoft,
    borderColor: theme.colors.navActive,
  },
  chipText: {
    color: theme.colors.text,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    textAlign: 'center',
  },
  chipTextSelected: {
    fontFamily: fonts.bodyBold,
  },
  row: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.block,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: theme.colors.navActiveSoft,
    borderColor: theme.colors.navActive,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconWrapSelected: {
    backgroundColor: theme.colors.surface,
  },
  label: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  labelSelected: {
    fontFamily: fonts.bodyBold,
  },
  check: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkSelected: {
    backgroundColor: theme.colors.navActive,
    borderColor: theme.colors.navActive,
  },
  checkDot: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
