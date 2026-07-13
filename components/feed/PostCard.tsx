import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { MediaCarousel } from '@/components/feed/MediaCarousel';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { togglePostLike } from '@/services/posts';
import { showAlert } from '@/store/useAlertStore';
import type { FeedPost, PostHobbyTag } from '@/types/post.types';
import { hapticLight, hapticWarning } from '@/utils/haptics';

dayjs.extend(calendar);

const CAPTION_PREVIEW = 140;
const MEDIA_RADIUS = 20;

type Props = {
  post: FeedPost;
  currentUserId?: string | null;
  viewerTagNames?: Set<string>;
  onTagPress?: (tag: PostHobbyTag) => void;
  onDeleted?: (postId: string) => void;
  onDelete?: (postId: string) => Promise<void>;
  onLikeChange?: (postId: string, liked: boolean, likeCount: number) => void;
  onOpenComments?: (post: FeedPost) => void;
};

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

function formatPostTime(iso: string): string {
  return dayjs(iso).calendar(null, {
    sameDay: '[Today,] h:mm A',
    lastDay: '[Yesterday,] h:mm A',
    lastWeek: 'ddd, h:mm A',
    sameElse: 'MMM D, h:mm A',
  });
}

export function PostCard({
  post,
  currentUserId,
  viewerTagNames,
  onTagPress,
  onDeleted,
  onDelete,
  onLikeChange,
  onOpenComments,
}: Props) {
  const router = useRouter();
  const isOwn = Boolean(currentUserId && currentUserId === post.authorId);
  const visibleTags = post.tags.slice(0, 4);
  const extra = post.tags.length - visibleTags.length;
  const [liking, setLiking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const likingRef = useRef(false);

  const displayName = post.displayName?.trim() || post.username;
  const initial = displayName.replace('@', '').charAt(0).toUpperCase();
  const caption = post.caption?.trim() ?? '';
  const needsMore = caption.length > CAPTION_PREVIEW;
  const shownCaption =
    !needsMore || expanded ? caption : `${caption.slice(0, CAPTION_PREVIEW).trimEnd()}…`;

  const confirmDelete = () => {
    showAlert('Delete post?', 'This removes it from the feed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          hapticWarning();
          void (async () => {
            if (!onDelete) return;
            await onDelete(post.id);
            onDeleted?.(post.id);
          })();
        },
      },
    ]);
  };

  const onToggleLike = () => {
    if (!currentUserId || likingRef.current) return;
    likingRef.current = true;
    setLiking(true);
    hapticLight();

    const prevLiked = post.likedByMe;
    const prevCount = post.likeCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    onLikeChange?.(post.id, nextLiked, nextCount);

    void (async () => {
      try {
        const result = await togglePostLike(post.id);
        onLikeChange?.(post.id, result.liked, result.likeCount);
      } catch {
        onLikeChange?.(post.id, prevLiked, prevCount);
      } finally {
        likingRef.current = false;
        setLiking(false);
      }
    })();
  };

  const onShare = () => {
    void Share.share({
      message: caption
        ? `${caption}\n\n— @${post.username} on HobbyFlow`
        : `Check out @${post.username}'s post on HobbyFlow`,
    });
  };

  const openMenu = () => {
    if (isOwn) {
      confirmDelete();
      return;
    }
    showAlert(`@${post.username}`, undefined, [
      { text: 'Share', onPress: onShare },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push(`/(app)/u/${post.username}` as never)}
          accessibilityLabel={`Open @${post.username}`}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>

        <Pressable
          style={styles.meta}
          onPress={() => router.push(`/(app)/u/${post.username}` as never)}
        >
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.subMeta}>
            <Text style={styles.time}>{formatPostTime(post.createdAt)}</Text>
            <Ionicons name="globe-outline" size={12} color={theme.colors.textMuted} />
          </View>
        </Pressable>

        <Pressable
          onPress={openMenu}
          accessibilityLabel="Post options"
          hitSlop={10}
          style={styles.menuBtn}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      {caption ? (
        <View style={styles.captionBlock}>
          <Text style={styles.caption}>
            {shownCaption}
            {needsMore && !expanded ? (
              <Text style={styles.seeMore} onPress={() => setExpanded(true)}>
                {' '}
                See More...
              </Text>
            ) : null}
          </Text>
        </View>
      ) : null}

      {post.tags.length > 0 ? (
        <View style={styles.tags}>
          {visibleTags.map((tag) => {
            const viewerHas = viewerTagNames?.has(tag.name.toLowerCase()) ?? false;
            return (
              <Pressable
                key={`${tag.source}-${tag.hobbyId ?? tag.name}`}
                style={styles.tagChip}
                onPress={() => onTagPress?.(tag)}
                disabled={!onTagPress}
              >
                <Text
                  style={[styles.tagText, viewerHas && styles.tagTextMine]}
                  numberOfLines={1}
                >
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
          {extra > 0 ? <Text style={styles.tagMore}>+{extra}</Text> : null}
        </View>
      ) : null}

      <MediaCarousel
        media={post.media}
        contentInset={spacing.md * 2}
        borderRadius={MEDIA_RADIUS}
        onPressItem={() => router.push(`/(app)/post/${post.id}` as never)}
      />

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <Pressable
            style={styles.actionBtn}
            onPress={onToggleLike}
            disabled={!currentUserId || liking}
            accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
          >
            <Ionicons
              name={post.likedByMe ? 'heart' : 'heart-outline'}
              size={22}
              color={post.likedByMe ? '#E11D48' : theme.colors.text}
            />
            <Text style={styles.actionCount}>{formatCount(post.likeCount)}</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => onOpenComments?.(post)}
            accessibilityLabel="Comments"
          >
            <Ionicons name="chatbubble-outline" size={21} color={theme.colors.text} />
            <Text style={styles.actionCount}>{formatCount(post.commentCount)}</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onShare} accessibilityLabel="Share">
            <Ionicons name="paper-plane-outline" size={21} color={theme.colors.text} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            hapticLight();
            setBookmarked((v) => !v);
          }}
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          hitSlop={8}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={theme.colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    elevation: 2,
    gap: spacing.sm + 2,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: theme.radii.avatar,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  menuBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 28,
  },
  captionBlock: {
    paddingTop: 2,
  },
  caption: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  seeMore: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radii.pill,
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextMine: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  tagMore: {
    alignSelf: 'center',
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  actionGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionCount: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
