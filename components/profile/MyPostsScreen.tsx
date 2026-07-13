import { ProfilePostsGrid } from '@/components/profile/ProfilePostsGrid';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { learnInPublic } from '@/constants/learnInPublic';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { listFeed } from '@/services/posts';
import { useUserStore } from '@/store/useUserStore';
import type { FeedPost } from '@/types/post.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function MyPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const next = await listFeed({ limit: 60, authorId: user.id });
      setPosts(next);
    } catch {
      /* soft fail */
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void load().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onNewPost = () => {
    if (!username) {
      router.push('/(app)/claim-username' as never);
      return;
    }
    router.push('/(app)/(tabs)/feed' as never);
  };

  return (
    <ScreenShell padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.subtitle}>
              {posts.length === 1 ? '1 piece of work' : `${posts.length} pieces of work`}
            </Text>
          </View>
          <Pressable style={styles.newBtn} onPress={onNewPost}>
            <Text style={styles.newBtnText}>{learnInPublic.shareWork}</Text>
          </Pressable>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator color={theme.colors.text} style={{ marginTop: 32 }} />
        ) : (
          <ProfilePostsGrid posts={posts} emptyHint={learnInPublic.emptyShowcase} />
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  newBtn: {
    backgroundColor: theme.colors.cta,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newBtnText: {
    color: theme.colors.ctaText,
    fontSize: 13,
    fontWeight: '800',
  },
});
