import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getOptionIcon } from '@/components/onboarding/optionIcons';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

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
        const Icon = getOptionIcon(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => onChange(option)}
          >
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Icon width={36} height={36} color={theme.colors.text} />
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
              {option}
            </Text>
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    width: '100%',
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
    fontSize: 16,
  },
  labelSelected: {
    fontFamily: fonts.bodyBold,
  },
  radio: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  radioSelected: {
    backgroundColor: theme.colors.navActive,
    borderColor: theme.colors.navActive,
  },
  radioDot: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
