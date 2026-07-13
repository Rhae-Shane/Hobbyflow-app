import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { getPostById, softDeletePost, togglePostLike } from '@/services/posts';
import type { FeedPost, PostMedia } from '@/types/post.types';
import { hapticLight, hapticWarning } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Audio, ResizeMode, Video } from 'expo-av';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showAlert } from '@/store/useAlertStore';

dayjs.extend(relativeTime);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MEDIA_H = Math.min(SCREEN_H * 0.62, 560);

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function DetailMedia({ media }: { media: PostMedia[] }) {
  const [index, setIndex] = useState(0);
  const item = media[index] ?? null;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      void sound?.unloadAsync();
    };
  }, [sound]);

  if (!media.length) {
    return (
      <View style={[styles.mediaStage, styles.mediaEmpty]}>
        <Text style={styles.mediaEmptyText}>No media</Text>
      </View>
    );
  }

  const toggleAudio = async () => {
    if (!item || item.kind !== 'audio') return;
    if (playing && sound) {
      await sound.pauseAsync();
      setPlaying(false);
      return;
    }
    if (sound) {
      await sound.playAsync();
      setPlaying(true);
      return;
    }
    const { sound: next } = await Audio.Sound.createAsync({ uri: item.publicUrl });
    setSound(next);
    next.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) setPlaying(false);
    });
    await next.playAsync();
    setPlaying(true);
  };

  return (
    <View style={styles.mediaStage}>
      {item?.kind === 'image' ? (
        <Image
          source={{ uri: item.publicUrl }}
          style={styles.mediaFill}
          resizeMode="cover"
        />
      ) : null}
      {item?.kind === 'video' ? (
        <Video
          source={{ uri: item.publicUrl }}
          style={styles.mediaFill}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={false}
        />
      ) : null}
      {item?.kind === 'audio' ? (
        <Pressable style={styles.audioStage} onPress={() => void toggleAudio()}>
          <Ionicons
            name={playing ? 'pause-circle' : 'play-circle'}
            size={64}
            color={theme.colors.text}
          />
          <Text style={styles.audioLabel}>
            {item.durationMs != null
              ? `${Math.round(item.durationMs / 1000)}s audio`
              : 'Audio'}
          </Text>
        </Pressable>
      ) : null}

      {media.length > 1 ? (
        <View style={styles.dots}>
          {media.map((m, i) => (
            <Pressable
              key={m.id}
              style={[styles.dot, i === index && styles.dotActive]}
              onPress={() => setIndex(i)}
            />
          ))}
        </View>
      ) : null}

      {media.length > 1 ? (
        <>
          {index > 0 ? (
            <Pressable
              style={[styles.mediaNav, styles.mediaNavLeft]}
              onPress={() => setIndex((v) => Math.max(0, v - 1))}
            >
              <Ionicons name="chevron-back" size={22} color="#141414" />
            </Pressable>
          ) : null}
          {index < media.length - 1 ? (
            <Pressable
              style={[styles.mediaNav, styles.mediaNavRight]}
              onPress={() => setIndex((v) => Math.min(media.length - 1, v + 1))}
            >
              <Ionicons name="chevron-forward" size={22} color="#141414" />
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const likingRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const next = await getPostById(id);
      if (!next) {
        setError('Post not found.');
        setPost(null);
      } else {
        setPost(next);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggleLike = () => {
    if (!post || !user?.id || likingRef.current) return;
    likingRef.current = true;
    hapticLight();
    const prevLiked = post.likedByMe;
    const prevCount = post.likeCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    setPost({ ...post, likedByMe: nextLiked, likeCount: nextCount });

    void (async () => {
      try {
        const result = await togglePostLike(post.id);
        setPost((current) =>
          current
            ? { ...current, likedByMe: result.liked, likeCount: result.likeCount }
            : current,
        );
      } catch {
        setPost((current) =>
          current
            ? { ...current, likedByMe: prevLiked, likeCount: prevCount }
            : current,
        );
      } finally {
        likingRef.current = false;
      }
    })();
  };

  const onShare = async () => {
    if (!post) return;
    await Share.share({
      message: post.caption
        ? `${post.caption}\n\n— @${post.username} on HobbyFlow`
        : `Check out @${post.username}'s post on HobbyFlow`,
    });
  };

  const onDelete = () => {
    if (!post || !user?.id) return;
    showAlert('Delete post?', 'This removes it from the feed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          hapticWarning();
          void (async () => {
            await softDeletePost(post.id, user.id);
            router.back();
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenShell padded={false} style={styles.shell}>
        <ActivityIndicator color={theme.colors.text} style={{ marginTop: 48 }} />
      </ScreenShell>
    );
  }

  if (error || !post) {
    return (
      <ScreenShell padded={false} style={styles.shell}>
        <Text style={styles.errorText}>{error ?? 'Post not found.'}</Text>
      </ScreenShell>
    );
  }

  const isOwn = user?.id === post.authorId;

  return (
    <ScreenShell padded={false} style={styles.shell}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.reelFrame}>
          <View style={styles.mediaWrap}>
            <DetailMedia media={post.media} />

            <View style={styles.sideActions} pointerEvents="box-none">
              <Pressable
                style={styles.sideBtn}
                onPress={onToggleLike}
                accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
              >
                <View style={styles.sideIconWrap}>
                  <Ionicons
                    name={post.likedByMe ? 'heart' : 'heart-outline'}
                    size={28}
                    color={post.likedByMe ? '#E11D48' : theme.colors.text}
                  />
                </View>
                <Text style={styles.sideCount}>{formatCount(post.likeCount)}</Text>
              </Pressable>

              <Pressable
                style={styles.sideBtn}
                onPress={() => setCommentsOpen(true)}
                accessibilityLabel="Comments"
              >
                <View style={styles.sideIconWrap}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={26}
                    color={theme.colors.text}
                  />
                </View>
                <Text style={styles.sideCount}>{formatCount(post.commentCount)}</Text>
              </Pressable>

              <Pressable
                style={styles.sideBtn}
                onPress={() => void onShare()}
                accessibilityLabel="Share"
              >
                <View style={styles.sideIconWrap}>
                  <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text} />
                </View>
                <Text style={styles.sideCount}>Share</Text>
              </Pressable>

              {isOwn ? (
                <Pressable style={styles.sideBtn} onPress={onDelete} accessibilityLabel="Delete">
                  <View style={styles.sideIconWrap}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
                  </View>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.bottomMeta}>
            <Pressable
              style={styles.authorRow}
              onPress={() => router.push(`/(app)/u/${post.username}` as never)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {post.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.authorCopy}>
                <Text style={styles.handle}>@{post.username}</Text>
                <Text style={styles.time}>{dayjs(post.createdAt).fromNow()}</Text>
              </View>
            </Pressable>

            {post.caption ? (
              <Text style={styles.caption} numberOfLines={4}>
                <Text style={styles.captionHandle}>@{post.username} </Text>
                {post.caption}
              </Text>
            ) : null}

            {post.tags.length > 0 ? (
              <View style={styles.tags}>
                {post.tags.map((tag) => (
                  <View key={`${tag.source}-${tag.hobbyId ?? tag.name}`} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable onPress={() => setCommentsOpen(true)}>
              <Text style={styles.viewComments}>
                {post.commentCount > 0
                  ? `View all ${post.commentCount} comments`
                  : 'Add a comment…'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <CommentsSheet
        visible={commentsOpen}
        postId={post.id}
        currentUserId={user?.id}
        postAuthorId={post.authorId}
        onClose={() => setCommentsOpen(false)}
        onCommentCountChange={(_postId, delta) => {
          setPost((current) =>
            current
              ? {
                  ...current,
                  commentCount: Math.max(0, current.commentCount + delta),
                }
              : current,
          );
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  reelFrame: {
    backgroundColor: '#FFFFFF',
    minHeight: SCREEN_H * 0.75,
    position: 'relative',
  },
  mediaWrap: {
    position: 'relative',
  },
  mediaStage: {
    backgroundColor: '#F3F4F6',
    height: MEDIA_H,
    overflow: 'hidden',
    width: SCREEN_W,
  },
  mediaFill: {
    height: '100%',
    width: '100%',
  },
  mediaEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmptyText: {
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  audioStage: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  audioLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dots: {
    alignItems: 'center',
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 56,
  },
  dot: {
    backgroundColor: 'rgba(20,20,20,0.25)',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: theme.colors.text,
    width: 16,
  },
  mediaNav: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    top: '45%',
    width: 36,
  },
  mediaNavLeft: {
    left: 10,
  },
  mediaNavRight: {
    right: 58,
  },
  sideActions: {
    alignItems: 'center',
    bottom: 24,
    gap: 16,
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  sideBtn: {
    alignItems: 'center',
    gap: 4,
  },
  sideIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    width: 48,
  },
  sideCount: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomMeta: {
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: theme.colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  authorCopy: {
    flex: 1,
    gap: 1,
  },
  handle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  captionHandle: {
    fontWeight: '800',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: theme.colors.chipSelectedBackground,
    borderColor: theme.colors.primaryBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: theme.colors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  viewComments: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
  },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 48,
    textAlign: 'center',
  },
});
