import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { FeedComposeCard } from '@/components/feed/FeedComposeCard';
import { PostCard } from '@/components/feed/PostCard';
import { ScreenShell, TAB_SCROLL_BOTTOM_INSET } from '@/components/ui/ScreenShell';
import { learnInPublic } from '@/constants/learnInPublic';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { listFeed, softDeletePost } from '@/services/posts';
import { fetchOwnHobbyTags } from '@/services/profileSearch';
import { useUserStore } from '@/store/useUserStore';
import type { FeedPost, PostHobbyTag } from '@/types/post.types';

type TagFilter = { kind: 'all' } | { kind: 'tag'; tag: PostHobbyTag };

export function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const postsRef = useRef<FeedPost[]>([]);
  const [myTags, setMyTags] = useState<PostHobbyTag[]>([]);
  const [filter, setFilter] = useState<TagFilter>({ kind: 'all' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [commentsPost, setCommentsPost] = useState<FeedPost | null>(null);

  const viewerTagNames = useMemo(
    () => new Set(myTags.map((t) => t.name.toLowerCase())),
    [myTags],
  );

  const updatePost = useCallback((postId: string, patch: Partial<FeedPost>) => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === postId ? { ...p, ...patch } : p));
      postsRef.current = next;
      return next;
    });
  }, []);

  const loadTags = useCallback(async () => {
    if (!user?.id) {
      setMyTags([]);
      return;
    }
    const tags = await fetchOwnHobbyTags(user.id);
    setMyTags(tags);
  }, [user?.id]);

  const load = useCallback(
    async (mode: 'replace' | 'append' = 'replace', nextFilter: TagFilter = filter) => {
      try {
        setError(null);
        const current = postsRef.current;
        const cursor =
          mode === 'append' && current.length
            ? {
                beforeCreatedAt: current[current.length - 1].createdAt,
                beforeId: current[current.length - 1].id,
              }
            : {};
        const rows = await listFeed({
          limit: 20,
          beforeCreatedAt: cursor.beforeCreatedAt ?? null,
          beforeId: cursor.beforeId ?? null,
          viewerScoped: true,
          tagFilter: nextFilter.kind === 'tag' ? nextFilter.tag.name : null,
        });
        setHasMore(rows.length >= 20);
        setPosts((prev) => {
          const next = mode === 'append' ? [...prev, ...rows] : rows;
          postsRef.current = next;
          return next;
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void (async () => {
        await loadTags();
        await load('replace');
      })();
    }, [load, loadTags]),
  );

  const applyFilter = (next: TagFilter) => {
    setFilter(next);
    setFilterOpen(false);
    setLoading(true);
    void load('replace', next);
  };

  const emptyTitle =
    myTags.length === 0 ? learnInPublic.emptyNoHobby : learnInPublic.emptyNoPosts;

  const emptyCta = myTags.length === 0 ? 'Create a roadmap' : null;

  return (
    <ScreenShell padded={false}>
      <BottomSheetOrModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        animationType="fade"
        maxHeight="70%"
        padded={false}
        sheetStyle={styles.modalCard}
      >
        <Text style={styles.modalTitle}>Select hobby</Text>
        <Pressable
          style={[
            styles.optionRow,
            filter.kind === 'all' && styles.optionRowActive,
          ]}
          onPress={() => applyFilter({ kind: 'all' })}
        >
          <Text
            style={[
              styles.optionText,
              filter.kind === 'all' && styles.optionTextActive,
            ]}
          >
            All my hobbies
          </Text>
          {filter.kind === 'all' ? (
            <Ionicons name="checkmark" size={18} color={theme.colors.text} />
          ) : null}
        </Pressable>
        {myTags.map((tag) => {
          const active =
            filter.kind === 'tag' &&
            filter.tag.name.toLowerCase() === tag.name.toLowerCase();
          return (
            <Pressable
              key={`${tag.source}-${tag.hobbyId ?? tag.name}`}
              style={[styles.optionRow, active && styles.optionRowActive]}
              onPress={() => applyFilter({ kind: 'tag', tag })}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {tag.name}
              </Text>
              {active ? (
                <Ionicons name="checkmark" size={18} color={theme.colors.text} />
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheetOrModal>

      {loading ? (
        <ActivityIndicator color={theme.colors.text} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: TAB_SCROLL_BOTTOM_INSET,
            paddingTop: spacing.sm,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void (async () => {
                  await loadTags();
                  await load('replace');
                })();
              }}
              tintColor={theme.colors.text}
            />
          }
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.guideline}>{learnInPublic.guideline}</Text>
              <FeedComposeCard
                availableTags={myTags}
                onOpenFilter={() => {
                  if (myTags.length === 0) {
                    setError(learnInPublic.needHobbyToFilter);
                    return;
                  }
                  setFilterOpen(true);
                }}
                onPosted={() => {
                  setRefreshing(true);
                  void load('replace');
                }}
                onNeedUsername={() => {
                  if (!username) {
                    router.push('/(app)/claim-username' as never);
                  }
                }}
                onNeedHobby={() => router.push('/(app)/roadmap-creation' as never)}
              />
              {filter.kind === 'tag' ? (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>Showing: {filter.tag.name}</Text>
                  <Pressable onPress={() => applyFilter({ kind: 'all' })} hitSlop={8}>
                    <Text style={styles.clearFilter}>Clear</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              {emptyCta ? (
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(app)/roadmap-creation' as never)}
                >
                  <Text style={styles.emptyBtnText}>{emptyCta}</Text>
                </Pressable>
              ) : null}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={theme.colors.text} style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={() => {
            if (loadingMore || !hasMore || posts.length === 0) return;
            setLoadingMore(true);
            void load('append');
          }}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id}
              viewerTagNames={viewerTagNames}
              onTagPress={(tag) => {
                if (!viewerTagNames.has(tag.name.toLowerCase())) {
                  setError(learnInPublic.needHobbyToTag);
                  return;
                }
                applyFilter({ kind: 'tag', tag });
              }}
              onLikeChange={(postId, liked, likeCount) =>
                updatePost(postId, { likedByMe: liked, likeCount })
              }
              onOpenComments={(post) => setCommentsPost(post)}
              onDelete={async (postId) => {
                if (!user?.id) return;
                await softDeletePost(postId, user.id);
              }}
              onDeleted={(postId) =>
                setPosts((prev) => {
                  const next = prev.filter((p) => p.id !== postId);
                  postsRef.current = next;
                  return next;
                })
              }
            />
          )}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <CommentsSheet
        visible={commentsPost != null}
        postId={commentsPost?.id ?? null}
        currentUserId={user?.id}
        postAuthorId={commentsPost?.authorId}
        onClose={() => setCommentsPost(null)}
        onCommentCountChange={(postId, delta) => {
          const current = postsRef.current.find((p) => p.id === postId);
          if (!current) return;
          updatePost(postId, {
            commentCount: Math.max(0, current.commentCount + delta),
          });
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  guideline: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: spacing.md + 4,
  },
  activeFilter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md + 4,
  },
  activeFilterText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  clearFilter: {
    color: theme.colors.navActive,
    fontSize: 13,
    fontWeight: '800',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  modalTitle: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  optionRowActive: {
    backgroundColor: theme.colors.navActiveSoft,
  },
  optionText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  optionTextActive: {
    fontFamily: fonts.bodyBold,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 48,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyBold,
  },
  error: {
    color: theme.colors.danger,
    fontFamily: fonts.body,
    padding: spacing.md,
    textAlign: 'center',
  },
});
