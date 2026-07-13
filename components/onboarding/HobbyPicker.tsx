import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

const HOBBIES = ['Chess', 'Guitar', 'Poker', 'Photography'] as const;

type Props = {
  value: string;
  onChange: (hobby: string) => void;
};

export function HobbyPicker({ value, onChange }: Props) {
  const isPreset = HOBBIES.some((h) => h.toLowerCase() === value.toLowerCase());
  const customValue = isPreset ? '' : value;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {HOBBIES.map((hobby) => {
          const selected = value.toLowerCase() === hobby.toLowerCase();
          return (
            <Pressable
              key={hobby}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(hobby)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{hobby}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={styles.customInput}
        placeholder="Or type another hobby..."
        placeholderTextColor={onboardingColors.textMuted}
        value={customValue}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderColor: onboardingColors.border,
    borderRadius: theme.radii.pill,
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
    fontFamily: fonts.bodySemiBold,
  },
  chipTextSelected: {
    color: onboardingColors.primaryText,
    fontFamily: fonts.bodyBold,
  },
  customInput: {
    backgroundColor: theme.colors.surface,
    borderColor: onboardingColors.border,
    borderRadius: theme.radii.input,
    borderWidth: 1,
    color: onboardingColors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
