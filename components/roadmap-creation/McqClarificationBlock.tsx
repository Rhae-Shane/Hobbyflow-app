import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { QuickReplyChips } from '@/components/roadmap-creation/QuickReplyChips';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  quickReplies: { text: string }[];
  multiSelect: boolean;
  selectedChips: string[];
  freeText: string;
  onSelectChip: (text: string) => void;
  onChangeFreeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export function McqClarificationBlock({
  quickReplies,
  multiSelect,
  selectedChips,
  freeText,
  onSelectChip,
  onChangeFreeText,
  onSend,
  disabled = false,
}: Props) {
  const canSendMulti =
    multiSelect && (selectedChips.length > 0 || freeText.trim().length > 0) && !disabled;
  const canSendSingle = !multiSelect && freeText.trim().length > 0 && !disabled;

  return (
    <View style={styles.block}>
      <QuickReplyChips
        options={quickReplies}
        multiSelect={multiSelect}
        selected={selectedChips}
        onSelect={onSelectChip}
        disabled={disabled}
      />
      <TextInput
        style={styles.input}
        placeholder="Type your own answer…"
        placeholderTextColor={onboardingColors.textMuted}
        value={freeText}
        onChangeText={onChangeFreeText}
        editable={!disabled}
        multiline
      />
      {multiSelect ? (
        <Pressable
          style={[styles.sendButton, !canSendMulti && styles.sendDisabled]}
          onPress={onSend}
          disabled={!canSendMulti}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      ) : canSendSingle ? (
        <Pressable style={styles.sendButton} onPress={onSend} disabled={disabled}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: onboardingColors.primaryText,
    fontWeight: '700',
  },
});
