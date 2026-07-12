import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AskTypingIndicator } from '@/components/ask/AskTypingIndicator';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import type { AskChatMessage } from '@/services/askAnythingApi';

type Props = {
  messages: AskChatMessage[];
  sending?: boolean;
};

function MessageBubble({
  message,
  index,
}: {
  message: AskChatMessage;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: Math.min(index * 30, 180),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: Math.min(index * 30, 180),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const isUser = message.role === 'user';

  return (
    <Animated.View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {!isUser ? <Text style={styles.assistantLabel}>Coach</Text> : null}
      <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
        {message.content}
      </Text>
    </Animated.View>
  );
}

export function AskChatTranscript({ messages, sending }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((message, index) => (
        <MessageBubble key={`${message.role}-${index}`} message={message} index={index} />
      ))}
      {sending ? (
        <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
          <Text style={styles.assistantLabel}>Coach</Text>
          <AskTypingIndicator />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    maxHeight: 340,
    zIndex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '88%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCEEFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: onboardingColors.border,
    borderWidth: 1,
    gap: 4,
  },
  typingBubble: {
    minWidth: 72,
  },
  assistantLabel: {
    color: onboardingColors.primaryText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: onboardingColors.text,
  },
  assistantText: {
    color: onboardingColors.text,
  },
});
