import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AskChatTranscript } from '@/components/ask/AskChatTranscript';
import { AskFadeIn } from '@/components/ask/AskFadeIn';
import { AskHistoryList } from '@/components/ask/AskHistoryList';
import { AskCoachLottie } from '@/components/ask/AskLottie';
import { AskPressable } from '@/components/ask/AskPressable';
import { AskSheetTopBar } from '@/components/ask/AskSheetTopBar';
import { ASK_QUICK_ACTIONS } from '@/components/ask/askQuickActions';
import { SendIcon } from '@/components/icons/AppIcons';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import { useAskAnythingChat } from '@/hooks/useAskAnythingChat';

type Props = {
  visible: boolean;
  onClose: () => void;
  activeHobbyHint?: string;
};

export function AskAnythingSheet({ visible, onClose, activeHobbyHint }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const chat = useAskAnythingChat({ activeHobbyHint });
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      chat.newChat();
      setDraft('');
      sheetY.setValue(48);
      sheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          friction: 9,
          tension: 68,
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // Reset only when opening the sheet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSend = async (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value) return;
    setDraft('');
    await chat.send(value);
  };

  const canSend = Boolean(draft.trim()) && !chat.sending;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetOpacity,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <View style={styles.ambientOrbA} />
          <View style={styles.ambientOrbB} />

          <View style={styles.handle} />
          <AskSheetTopBar
            title={chat.view === 'chatting' ? chat.title : null}
            onNewChat={() => {
              chat.newChat();
              setDraft('');
            }}
            onHistory={() => {
              void chat.openHistory();
            }}
            onClose={onClose}
          />

          {chat.view === 'history' ? (
            <AskHistoryList
              conversations={chat.conversations}
              activeId={chat.conversationId}
              onSelect={(id) => {
                void chat.selectChat(id);
              }}
              onDelete={(id) => {
                void chat.deleteChat(id);
              }}
              onNewChat={() => {
                chat.newChat();
                setDraft('');
              }}
            />
          ) : null}

          {chat.view === 'new' ? (
            <>
              <AskFadeIn style={styles.promo}>
                <AskCoachLottie size={52} />
                <View style={styles.bubble}>
                  <Text style={styles.bubbleEyebrow}>Your coach</Text>
                  <Text style={styles.bubbleText}>
                    Ask about your roadmaps, lessons, streak, pact, posts — I can look up your
                    HobbyFlow data.
                  </Text>
                </View>
              </AskFadeIn>

              <AskFadeIn delay={80}>
                <Text style={styles.heading}>How can I help you today?</Text>
              </AskFadeIn>

              <View style={styles.actions}>
                {ASK_QUICK_ACTIONS.map((action, index) => {
                  const Icon = action.Icon;
                  return (
                    <AskFadeIn key={action.id} delay={120 + index * 70}>
                      <AskPressable
                        style={styles.actionRow}
                        onPress={() => {
                          if (action.id === 'history') {
                            void chat.openHistory();
                            return;
                          }
                          if (action.seedMessage) {
                            void handleSend(action.seedMessage);
                          }
                        }}
                        accessibilityLabel={action.label}
                      >
                        <View style={styles.actionIconWrap}>
                          <Icon size={20} color={onboardingColors.text} />
                        </View>
                        <View style={styles.actionCopy}>
                          <Text style={styles.actionLabel}>{action.label}</Text>
                          <Text style={styles.actionHint}>{action.hint}</Text>
                        </View>
                      </AskPressable>
                    </AskFadeIn>
                  );
                })}
              </View>
            </>
          ) : null}

          {chat.view === 'chatting' ? (
            <AskChatTranscript messages={chat.messages} sending={chat.sending} />
          ) : null}

          {chat.error ? <Text style={styles.error}>{chat.error}</Text> : null}

          {chat.view !== 'history' ? (
            <View style={styles.inputRow}>
              <TextInput
                editable={!chat.sending}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => {
                  void handleSend();
                }}
                placeholder="Ask anything about your learning..."
                placeholderTextColor={onboardingColors.textMuted}
                style={styles.input}
                returnKeyType="send"
              />
              <AskPressable
                onPress={() => {
                  void handleSend();
                }}
                disabled={!canSend}
                style={[styles.sendBtn, !canSend && styles.sendDisabled]}
                accessibilityLabel="Send"
              >
                <SendIcon size={18} color="#FFFFFF" />
              </AskPressable>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(44, 36, 22, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: onboardingColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: spacing.md,
    maxHeight: '92%',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  ambientOrbA: {
    backgroundColor: 'rgba(124, 203, 250, 0.18)',
    borderRadius: 120,
    height: 180,
    left: -48,
    position: 'absolute',
    top: -60,
    width: 180,
  },
  ambientOrbB: {
    backgroundColor: 'rgba(237, 232, 223, 0.9)',
    borderRadius: 100,
    height: 140,
    position: 'absolute',
    right: -36,
    top: 80,
    width: 140,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D4CEC4',
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
    zIndex: 1,
  },
  promo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 1,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: onboardingColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleEyebrow: {
    color: onboardingColors.primaryText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bubbleText: {
    color: onboardingColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  heading: {
    color: onboardingColors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    zIndex: 1,
  },
  actions: {
    gap: spacing.sm,
    zIndex: 1,
  },
  actionRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: onboardingColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  actionIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F3EEE6',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  actionHint: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  error: {
    color: '#A14A3A',
    fontSize: 13,
    zIndex: 1,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    shadowColor: '#2C2416',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    zIndex: 1,
  },
  input: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: '#2C2416',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendDisabled: {
    opacity: 0.35,
  },
});
