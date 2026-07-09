import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAdd?: () => void;
  showAddButton?: boolean;
};

export function OtherInput({
  value,
  onChange,
  placeholder = 'Other (optional)',
  onAdd,
  showAddButton = false,
}: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, showAddButton && styles.inputWithButton]}
        placeholder={placeholder}
        placeholderTextColor={onboardingColors.textMuted}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onAdd}
        returnKeyType="done"
      />
      {showAddButton && onAdd ? (
        <Pressable
          accessibilityLabel="Add custom option"
          onPress={onAdd}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputWithButton: {
    flex: 1,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
});
