import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
};

export function ChatInputBar({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
}: Props) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={styles.bar}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={onboardingColors.textMuted}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        multiline
        onSubmitEditing={() => {
          if (canSend) onSend();
        }}
      />
      <Pressable
        style={[styles.send, !canSend && styles.sendDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>↑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  input: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  send: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: onboardingColors.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
});
