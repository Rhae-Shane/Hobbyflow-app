import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MediaCarousel } from '@/components/feed/MediaCarousel';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { togglePostLike } from '@/services/posts';
import type { FeedPost, PostHobbyTag } from '@/types/post.types';

dayjs.extend(relativeTime);

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
  const likingRef = useRef(false);

  const confirmDelete = () => {
    Alert.alert('Delete post?', 'This removes it from the feed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.author}
          onPress={() => router.push(`/(app)/u/${post.username}` as never)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.handle}>@{post.username}</Text>
            <Text style={styles.time}>{dayjs(post.createdAt).fromNow()}</Text>
          </View>
        </Pressable>
        {isOwn ? (
          <Pressable onPress={confirmDelete} accessibilityLabel="Delete post">
            <Text style={styles.more}>···</Text>
          </Pressable>
        ) : null}
      </View>

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

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
                <Text style={[styles.tagText, viewerHas && styles.tagTextMine]} numberOfLines={1}>
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
          {extra > 0 ? <Text style={styles.tagMore}>+{extra}</Text> : null}
        </View>
      ) : null}

      <MediaCarousel media={post.media} />

      <View style={styles.actions}>
        <Pressable
          style={styles.actionBtn}
          onPress={onToggleLike}
          disabled={!currentUserId || liking}
          accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
        >
          <Text style={[styles.actionGlyph, post.likedByMe && styles.actionGlyphActive]}>
            {post.likedByMe ? '♥' : '♡'}
          </Text>
          <Text style={[styles.actionCount, post.likedByMe && styles.actionCountActive]}>
            {post.likeCount}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() => onOpenComments?.(post)}
          accessibilityLabel="Comments"
        >
          <Text style={styles.actionLabel}>Comment</Text>
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  author: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
  handle: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  time: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  more: {
    color: onboardingColors.textMuted,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  caption: {
    color: onboardingColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: onboardingColors.primaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextMine: {
    fontWeight: '800',
  },
  tagMore: {
    alignSelf: 'center',
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionGlyph: {
    color: onboardingColors.textMuted,
    fontSize: 20,
  },
  actionGlyphActive: {
    color: '#C62828',
  },
  actionLabel: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  actionCount: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  actionCountActive: {
    color: onboardingColors.text,
  },
});
