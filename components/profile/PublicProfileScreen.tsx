import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { HobbyTagsRow } from '@/components/profile/HobbyTagsRow';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { ProfilePostsGrid } from '@/components/profile/ProfilePostsGrid';
import { SocialLinksRow } from '@/components/profile/SocialLinksRow';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { findLeague, profileShareMessage } from '@/lib/gamification/leagues';
import { listFeed } from '@/services/posts';
import { fetchPublicProfile } from '@/services/profileSearch';
import { fetchSocialLinks } from '@/services/socialLinks';
import { useGamificationStore } from '@/store/useGamificationStore';
import type { PublicProfile } from '@/types/gamification.types';
import type { FeedPost, SocialLink } from '@/types/post.types';

export function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const leagues = useGamificationStore((s) => s.leagues);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!username) return;
      let cancelled = false;
      setLoading(true);
      setError(null);
      void fetchPublicProfile(String(username))
        .then(async (row) => {
          if (cancelled) return;
          setProfile(row);
          if (!row) {
            setError('Profile not found.');
            return;
          }
          const [nextLinks, nextPosts] = await Promise.all([
            fetchSocialLinks(row.userId),
            listFeed({ limit: 30, authorId: row.userId }),
          ]);
          if (cancelled) return;
          setLinks(nextLinks);
          setPosts(nextPosts);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [username]),
  );

  const onShare = async () => {
    if (!profile) return;
    const league = findLeague(profile.leagueId, leagues);
    await Share.share({
      message: profileShareMessage(profile.username, league.name, profile.rating),
    });
  };

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator color={dashboardColors.text} style={{ marginTop: 48 }} />
      ) : error || !profile ? (
        <Text style={styles.error}>{error ?? 'Not found'}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => {
              void onShare();
            }}
            style={styles.shareBtn}
            accessibilityLabel="Share profile"
          >
            <Text style={styles.shareGlyph}>↗ Share</Text>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.username.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.handle}>@{profile.username}</Text>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <LeagueBadge leagueId={profile.leagueId} leagues={leagues} />
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            <HobbyTagsRow tags={profile.hobbyTags} />
            <SocialLinksRow links={links} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.longestStreak}</Text>
              <Text style={styles.statLabel}>Longest</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.peakRating}</Text>
              <Text style={styles.statLabel}>Peak</Text>
            </View>
          </View>
          <Text style={styles.peak}>Starts at 699 · rises when you keep learning</Text>

          <Text style={styles.sectionTitle}>Posts</Text>
          <ProfilePostsGrid posts={posts} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: dashboardColors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 32,
  },
  shareBtn: {
    alignSelf: 'flex-end',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: dashboardRadii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareGlyph: {
    color: dashboardColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FFD6A8',
    borderRadius: dashboardRadii.avatar,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarText: {
    color: dashboardColors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  handle: {
    color: dashboardColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  displayName: {
    color: dashboardColors.textMuted,
    fontSize: 14,
  },
  bio: {
    color: dashboardColors.text,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    flex: 1,
    gap: 4,
    padding: spacing.md,
  },
  statValue: {
    color: dashboardColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  peak: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  error: {
    color: dashboardColors.textMuted,
    marginTop: 48,
    textAlign: 'center',
  },
});
