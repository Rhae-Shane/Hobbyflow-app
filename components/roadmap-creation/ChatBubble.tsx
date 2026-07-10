import { StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

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
    marginBottom: spacing.sm,
    width: '100%',
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: radii.card,
    maxWidth: '88%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: onboardingColors.primary,
  },
  text: {
    color: onboardingColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: onboardingColors.primaryText,
  },
});
