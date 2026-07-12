import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AskEmptyHistoryLottie } from '@/components/ask/AskLottie';
import { ChatBubbleIcon, TrashIcon } from '@/components/icons/AppIcons';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { AskConversationSummary } from '@/services/askAnythingApi';

type Props = {
  conversations: AskConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
};

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AskHistoryList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
}: Props) {
  if (conversations.length === 0) {
    return (
      <View style={styles.empty}>
        <AskEmptyHistoryLottie size={112} />
        <Text style={styles.emptyTitle}>No chats yet</Text>
        <Text style={styles.emptyBody}>Ask anything to start a new conversation.</Text>
        <Pressable onPress={onNewChat} style={styles.newBtn}>
          <Text style={styles.newBtnText}>New chat</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
      {conversations.map((row) => {
        const active = row.id === activeId;
        return (
          <View key={row.id} style={[styles.row, active && styles.rowActive]}>
            <Pressable style={styles.main} onPress={() => onSelect(row.id)}>
              <View style={styles.iconWrap}>
                <ChatBubbleIcon size={16} color={onboardingColors.text} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={1}>
                  {row.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {formatRelative(row.lastMessageAt)}
                  {row.preview ? ` · ${row.preview}` : ''}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel="Delete chat"
              onPress={() => {
                Alert.alert('Delete chat?', 'This removes it from your history.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(row.id),
                  },
                ]);
              }}
              style={styles.deleteBtn}
            >
              <TrashIcon size={15} color="#A14A3A" />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 360,
    zIndex: 1,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: onboardingColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowActive: {
    backgroundColor: 'rgba(220, 238, 255, 0.45)',
    borderRadius: 12,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  main: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#F3EEE6',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    zIndex: 1,
  },
  emptyTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyBody: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  newBtn: {
    backgroundColor: '#2C2416',
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
