import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AskChatTranscript } from '@/components/ask/AskChatTranscript';
import { AskCompanionHero } from '@/components/ask/AskCompanionHero';
import { AskHistoryList } from '@/components/ask/AskHistoryList';
import { AskPressable } from '@/components/ask/AskPressable';
import { AskRoadmapPreview } from '@/components/ask/AskRoadmapPreview';
import { AskSheetTopBar } from '@/components/ask/AskSheetTopBar';
import { AskSuggestionChips } from '@/components/ask/AskSuggestionChips';
import { ASK_SUGGESTION_CHIPS } from '@/components/ask/askQuickActions';
import { SendIcon } from '@/components/icons/AppIcons';
import {
  askCompanionColors,
  askCompanionRadii,
} from '@/constants/askCompanionTokens';
import { spacing } from '@/constants/tokens';
import { useAskAnythingChat } from '@/hooks/useAskAnythingChat';
import { useAuth } from '@/hooks/useAuth';
import { fetchRoadmapDetail, fetchUserRoadmaps } from '@/services/roadmaps';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';

type Props = {
  visible: boolean;
  onClose: () => void;
  activeHobbyHint?: string;
};

export function AskAnythingSheet({ visible, onClose, activeHobbyHint }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>('lessons');
  const inputRef = useRef<TextInput>(null);
  const chat = useAskAnythingChat({ activeHobbyHint });
  const sheetY = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const activityDates = useGamificationStore((s) => s.activityDates);
  const selectedRoadmapId = useRoadmapUiStore((s) => s.selectedRoadmapId);

  const roadmapsQuery = useQuery({
    queryKey: ['user-roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user!.id),
    enabled: Boolean(user?.id) && visible,
  });

  const activeRoadmap = useMemo(() => {
    const rows = roadmapsQuery.data ?? [];
    return (
      rows.find((r) => r.id === selectedRoadmapId) ??
      rows.find((r) => r.status === 'active') ??
      rows[0] ??
      null
    );
  }, [roadmapsQuery.data, selectedRoadmapId]);

  const detailQuery = useQuery({
    queryKey: ['roadmap-detail', activeRoadmap?.id],
    queryFn: () => fetchRoadmapDetail(activeRoadmap!.id),
    enabled: Boolean(activeRoadmap?.id) && visible && chat.view === 'new',
    staleTime: 60_000,
  });

  const progressPercent = useMemo(() => {
    const lessons = detailQuery.data?.lessons ?? [];
    if (lessons.length === 0) return 0;
    const done = lessons.filter((l) => l.status === 'completed').length;
    return (done / lessons.length) * 100;
  }, [detailQuery.data?.lessons]);

  useEffect(() => {
    if (visible) {
      chat.newChat();
      setDraft('');
      setActiveChip('lessons');
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

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const canSend = Boolean(draft.trim()) && !chat.sending;
  const suggestions = ASK_SUGGESTION_CHIPS.map((c) => ({
    id: c.id,
    label: c.label,
    seedMessage: c.seedMessage,
  }));

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
              paddingTop: Math.max(insets.top, 12),
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <AskSheetTopBar
            title={chat.view === 'chatting' && chat.title ? chat.title : 'Hobby Companion'}
            onBack={onClose}
            onMenu={() => {
              void chat.openHistory();
            }}
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.newContent}
              keyboardShouldPersistTaps="handled"
            >
              <AskCompanionHero
                onMicPress={focusInput}
                onAttachPress={() => {
                  void chat.openHistory();
                }}
                onMenuPress={() => {
                  void chat.openHistory();
                }}
              />

              <View style={styles.metaRow}>
                <Text style={styles.metaLeft}>✦ Ready to help</Text>
                <Text style={styles.metaRight}>Powered by HobbyFlow AI</Text>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  editable={!chat.sending}
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={() => {
                    void handleSend();
                  }}
                  placeholder="Ask me anything.."
                  placeholderTextColor={askCompanionColors.textMuted}
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

              <AskSuggestionChips
                suggestions={suggestions}
                activeId={activeChip}
                onSelect={(item) => {
                  setActiveChip(item.id);
                  if (item.id === 'history') {
                    void chat.openHistory();
                    return;
                  }
                  if (item.seedMessage) {
                    void handleSend(item.seedMessage);
                  }
                }}
              />

              <AskRoadmapPreview
                activityDates={activityDates}
                progressPercent={progressPercent}
                roadmapTitle={activeRoadmap?.title}
              />
            </ScrollView>
          ) : null}

          {chat.view === 'chatting' ? (
            <>
              <AskChatTranscript messages={chat.messages} sending={chat.sending} />
              {chat.error ? <Text style={styles.error}>{chat.error}</Text> : null}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  editable={!chat.sending}
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={() => {
                    void handleSend();
                  }}
                  placeholder="Ask me anything.."
                  placeholderTextColor={askCompanionColors.textMuted}
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
            </>
          ) : null}

          {chat.view === 'new' && chat.error ? (
            <Text style={styles.error}>{chat.error}</Text>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(20, 20, 20, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: askCompanionColors.background,
    borderTopLeftRadius: askCompanionRadii.sheet,
    borderTopRightRadius: askCompanionRadii.sheet,
    flex: 1,
    marginTop: 8,
    maxHeight: '96%',
    paddingHorizontal: spacing.md,
  },
  newContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLeft: {
    color: askCompanionColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  metaRight: {
    color: askCompanionColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: '#A14A3A',
    fontSize: 13,
    marginTop: spacing.xs,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: askCompanionColors.surface,
    borderColor: askCompanionColors.chipBorder,
    borderRadius: askCompanionRadii.input,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 6,
    paddingLeft: spacing.md,
    paddingVertical: 6,
  },
  input: {
    color: askCompanionColors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 42,
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: askCompanionColors.cta,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {
    opacity: 0.35,
  },
});
