import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import type { FeedPost } from '@/types/post.types';

type Props = {
  posts: FeedPost[];
  emptyHint?: string;
};

export function ProfilePostsGrid({ posts, emptyHint }: Props) {
  const router = useRouter();

  if (!posts.length) {
    return (
      <Text style={styles.empty}>
        {emptyHint ?? 'No posts yet.'}
      </Text>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post) => {
        const cover = post.media.find((m) => m.kind === 'image') ?? post.media[0];
        return (
          <Pressable
            key={post.id}
            style={styles.cell}
            onPress={() => router.push(`/(app)/post/${post.id}` as never)}
          >
            {cover?.kind === 'image' ? (
              <Image source={{ uri: cover.publicUrl }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  {cover?.kind === 'video' ? 'VIDEO' : cover?.kind === 'audio' ? 'AUDIO' : 'TEXT'}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    aspectRatio: 1,
    width: '32.5%',
  },
  image: {
    borderRadius: 8,
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: '#E8F3FF',
    borderColor: onboardingColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    color: onboardingColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  empty: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
});
