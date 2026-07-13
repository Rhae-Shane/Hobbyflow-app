import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { onboardingColors } from '@/constants/onboardingTokens';
import { fonts, radii, spacing } from '@/constants/tokens';
import {
  addPostComment,
  listPostComments,
  softDeletePostComment,
} from '@/services/posts';
import { showAlert } from '@/store/useAlertStore';
import { MAX_COMMENT_LENGTH, type PostComment } from '@/types/post.types';

dayjs.extend(relativeTime);

type Props = {
  visible: boolean;
  postId: string | null;
  currentUserId?: string | null;
  postAuthorId?: string | null;
  onClose: () => void;
  onCommentCountChange?: (postId: string, delta: number) => void;
};

export function CommentsSheet({
  visible,
  postId,
  currentUserId,
  postAuthorId,
  onClose,
  onCommentCountChange,
}: Props) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listPostComments({ postId, limit: 50 });
      setComments(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!visible || !postId) {
      setComments([]);
      setDraft('');
      setError(null);
      return;
    }
    void load();
  }, [visible, postId, load]);

  const send = async () => {
    if (!postId || sending) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const row = await addPostComment(postId, text);
      setComments((prev) => [...prev, row]);
      setDraft('');
      onCommentCountChange?.(postId, 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (comment: PostComment) => {
    const canDelete =
      currentUserId &&
      (currentUserId === comment.authorId || currentUserId === postAuthorId);
    if (!canDelete) return;

    showAlert('Delete comment?', 'This removes the comment for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await softDeletePostComment(comment.id);
              setComments((prev) => prev.filter((c) => c.id !== comment.id));
              if (postId) onCommentCountChange?.(postId, -1);
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Failed to delete');
            }
          })();
        },
      },
    ]);
  };

  return (
    <BottomSheetOrModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close comments">
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={onboardingColors.primaryText} style={{ marginVertical: 24 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={
              comments.length === 0 ? styles.listEmpty : styles.listContent
            }
            ListEmptyComponent={
              <Text style={styles.empty}>No comments yet — say something.</Text>
            }
            renderItem={({ item }) => {
              const canDelete =
                Boolean(currentUserId) &&
                (currentUserId === item.authorId || currentUserId === postAuthorId);
              return (
                <View style={styles.commentRow}>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentHandle}>@{item.username}</Text>
                    <Text style={styles.commentText}>{item.body}</Text>
                    <Text style={styles.commentTime}>{dayjs(item.createdAt).fromNow()}</Text>
                  </View>
                  {canDelete ? (
                    <Pressable
                      onPress={() => confirmDelete(item)}
                      accessibilityLabel="Delete comment"
                    >
                      <Text style={styles.delete}>Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(t) => setDraft(t.slice(0, MAX_COMMENT_LENGTH))}
            placeholder="Add a comment…"
            placeholderTextColor={onboardingColors.textMuted}
            multiline
            maxLength={MAX_COMMENT_LENGTH}
            editable={!sending}
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}
            onPress={() => void send()}
            disabled={!draft.trim() || sending}
          >
            <Text style={styles.sendText}>{sending ? '…' : 'Post'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetOrModal>
  );
}

const styles = StyleSheet.create({
  root: {
    maxHeight: 520,
    minHeight: 280,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  close: {
    color: onboardingColors.primaryText,
    fontFamily: fonts.bodyBold,
  },
  list: {
    flexGrow: 0,
    maxHeight: 320,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listEmpty: {
    paddingVertical: spacing.lg,
  },
  empty: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentHandle: {
    color: onboardingColors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  commentText: {
    color: onboardingColors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  delete: {
    color: '#B42318',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  error: {
    color: '#B42318',
    fontFamily: fonts.body,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: onboardingColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: onboardingColors.text,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    maxHeight: 88,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    backgroundColor: onboardingColors.primary,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: onboardingColors.primaryText,
    fontFamily: fonts.bodyBold,
  },
});
