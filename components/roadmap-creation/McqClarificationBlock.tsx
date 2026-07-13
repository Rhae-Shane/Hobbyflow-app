import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { QuickReplyChips } from '@/components/roadmap-creation/QuickReplyChips';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

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
  const canSend =
    !disabled &&
    (multiSelect
      ? selectedChips.length > 0 || freeText.trim().length > 0
      : freeText.trim().length > 0);

  return (
    <View style={styles.block}>
      <QuickReplyChips
        options={quickReplies}
        multiSelect={multiSelect}
        selected={selectedChips}
        onSelect={onSelectChip}
        disabled={disabled}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Type your own answer…"
          placeholderTextColor={theme.colors.textMuted}
          value={freeText}
          onChangeText={onChangeFreeText}
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
          accessibilityLabel="Send answer"
        >
          <Text style={styles.sendGlyph}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
    marginTop: spacing.xs,
    width: '100%',
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.block,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
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
