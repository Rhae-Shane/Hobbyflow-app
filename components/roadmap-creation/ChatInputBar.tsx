import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

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
        placeholderTextColor={theme.colors.textMuted}
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
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Text style={styles.sendGlyph}>↑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.block,
    borderWidth: 1.5,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  send: {
    alignItems: 'center',
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sendDisabled: {
    opacity: 0.28,
  },
  sendGlyph: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    lineHeight: 20,
  },
});
