import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser && styles.textUser]}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
    width: '100%',
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: theme.radii.block,
    borderColor: theme.colors.border,
    borderTopLeftRadius: theme.radii.block,
    borderTopRightRadius: theme.radii.block,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleUser: {
    backgroundColor: theme.colors.cta,
    borderBottomLeftRadius: theme.radii.block,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: theme.radii.block,
    borderTopRightRadius: theme.radii.block,
  },
  text: {
    color: theme.colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyMedium,
  },
});
