import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import { hapticSelection } from '@/utils/haptics';

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
            accessibilityRole={multiSelect ? 'checkbox' : 'button'}
            accessibilityState={{ selected: isSelected, disabled }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              disabled && styles.disabled,
              pressed && !disabled && styles.chipPressed,
            ]}
            onPress={() => {
              hapticSelection();
              onSelect(option.text);
            }}
          >
            <View
              style={[
                styles.radio,
                multiSelect && styles.checkbox,
                isSelected && styles.radioSelected,
              ]}
            >
              {isSelected ? <View style={[styles.radioDot, multiSelect && styles.checkDot]} /> : null}
            </View>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.text}
            </Text>
          </Pressable>
        );
      })}
      <Text style={styles.hint}>
        {multiSelect
          ? 'Select all that apply, or add your own answer below'
          : 'Tap an option, or type your own answer below'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.input,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    width: '100%',
  },
  chipSelected: {
    backgroundColor: theme.colors.navActiveSoft,
    borderColor: theme.colors.navActive,
  },
  chipPressed: {
    opacity: 0.88,
  },
  radio: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkbox: {
    borderRadius: 6,
  },
  radioSelected: {
    borderColor: theme.colors.navActive,
  },
  radioDot: {
    backgroundColor: theme.colors.navActive,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  checkDot: {
    borderRadius: 3,
    height: 10,
    width: 10,
  },
  chipText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  chipTextSelected: {
    color: theme.colors.text,
  },
  hint: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
