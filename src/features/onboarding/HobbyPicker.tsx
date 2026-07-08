import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../shared/theme/tokens';

const HOBBIES = ['Chess', 'Guitar', 'Poker', 'Photography'] as const;

type Props = {
  value: string;
  onChange: (hobby: string) => void;
};

export function HobbyPicker({ value, onChange }: Props) {
  return (
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
