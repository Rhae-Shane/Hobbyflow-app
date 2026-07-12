import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { PostCard } from '@/components/feed/PostCard';
import { ScreenShell, TAB_SCROLL_BOTTOM_INSET } from '@/components/ui/ScreenShell';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
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

  const onCompose = () => {
    if (!username) {
      router.push('/(app)/claim-username' as never);
      return;
    }
    if (myTags.length === 0) {
      router.push('/(app)/roadmap-creation' as never);
      return;
    }
    router.push('/(app)/post/compose' as never);
  };

  const applyFilter = (next: TagFilter) => {
    setFilter(next);
    setLoading(true);
    void load('replace', next);
  };

  const emptyTitle =
    myTags.length === 0
      ? 'Add a hobby to see posts from learners like you.'
      : 'No posts for your hobbies yet — be the first.';

  const emptyCta = myTags.length === 0 ? 'Create a roadmap' : 'Create a post';

  return (
    <ScreenShell padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HobbyFlow</Text>
          <Text style={styles.title}>Feed</Text>
        </View>
        <Pressable style={styles.composeBtn} onPress={onCompose} accessibilityLabel="New post">
          <Text style={styles.composeGlyph}>＋</Text>
        </Pressable>
      </View>

      {myTags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            style={[styles.filterChip, filter.kind === 'all' && styles.filterChipActive]}
            onPress={() => applyFilter({ kind: 'all' })}
          >
            <Text
              style={[styles.filterText, filter.kind === 'all' && styles.filterTextActive]}
            >
              All my hobbies
            </Text>
          </Pressable>
          {myTags.map((tag) => {
            const active =
              filter.kind === 'tag' &&
              filter.tag.name.toLowerCase() === tag.name.toLowerCase();
            return (
              <Pressable
                key={`${tag.source}-${tag.hobbyId ?? tag.name}`}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => applyFilter({ kind: 'tag', tag })}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {loading ? (
        <ActivityIndicator color={dashboardColors.text} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: TAB_SCROLL_BOTTOM_INSET,
            gap: spacing.md,
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
              tintColor={dashboardColors.text}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => {
                  if (myTags.length === 0) {
                    router.push('/(app)/roadmap-creation' as never);
                    return;
                  }
                  onCompose();
                }}
              >
                <Text style={styles.emptyBtnText}>{emptyCta}</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={dashboardColors.text} style={{ marginVertical: 16 }} />
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
                  setError('Add this hobby to your profile to filter by it.');
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  eyebrow: {
    color: dashboardColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: dashboardColors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  composeBtn: {
    alignItems: 'center',
    backgroundColor: dashboardColors.cta,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  composeGlyph: {
    color: dashboardColors.ctaText,
    fontSize: 22,
    fontWeight: '800',
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.pill,
    borderWidth: 1,
    maxWidth: 160,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#F3EAF8',
    borderColor: '#D4B8E8',
  },
  filterText: {
    color: dashboardColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: dashboardColors.text,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 64,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: dashboardColors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: dashboardColors.ctaText,
    fontWeight: '800',
  },
  error: {
    color: '#B42318',
    padding: spacing.md,
    textAlign: 'center',
  },
});
