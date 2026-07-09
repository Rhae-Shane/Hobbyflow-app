import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';

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
        placeholderTextColor={colors.textMuted}
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
  customInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
