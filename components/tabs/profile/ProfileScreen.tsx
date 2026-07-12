import { ClaimUsernameSheet } from '@/components/profile/ClaimUsernameSheet';
import { EditBioLinksSheet } from '@/components/profile/EditBioLinksSheet';
import { HobbyTagsRow } from '@/components/profile/HobbyTagsRow';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { ProfilePostsGrid } from '@/components/profile/ProfilePostsGrid';
import { SocialLinksRow } from '@/components/profile/SocialLinksRow';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';
import { InlineError } from '@/components/ui/InlineError';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { findLeague, profileShareMessage } from '@/lib/gamification/leagues';
import { signOut } from '@/lib/auth';
import { toAuthError } from '@/lib/errors';
import { listFeed } from '@/services/posts';
import { fetchOwnHobbyTags } from '@/services/profileSearch';
import { fetchSocialLinks } from '@/services/socialLinks';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';
import type { FeedPost, SocialLink } from '@/types/post.types';
import type { PublicProfile } from '@/types/gamification.types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

const PROGRESS_LINKS = [
  { id: 'streak', label: 'My Streak', icon: '🔥', href: '/(app)/streak' },
  { id: 'daily-tasks', label: 'Daily Tasks', icon: '✅', href: '/(app)/daily-tasks' },
  { id: 'pact', label: 'The Pact', icon: '🤝', href: '/(app)/pact' },
  { id: 'search', label: 'Find learners', icon: '🔍', href: '/(app)/search' },
  { id: 'feed', label: 'Community Feed', icon: '◎', href: '/(app)/(tabs)/feed' },
  { id: 'weekly', label: 'Weekly Report', icon: '📅', href: '/(app)/(tabs)/courses' },
  { id: 'stats', label: 'Learning Stats', icon: '📊', href: '/(app)/(tabs)/courses' },
  { id: 'courses', label: 'Roadmap Stats', icon: '📖', href: '/(app)/(tabs)/courses' },
] as const;

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const profile = usePlanStore((s) => s.profile);
  const clearSession = usePlanStore((s) => s.clearSession);
  const clearPreferencesSession = usePreferencesStore((s) => s.clearSession);
  const clearUserSession = useUserStore((s) => s.clearSession);
  const username = useUserStore((s) => s.username);
  const bio = useUserStore((s) => s.bio);
  const clearGamification = useGamificationStore((s) => s.clearSession);
  const clearPact = usePactStore((s) => s.clearSession);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const rating = useGamificationStore((s) => s.rating);
  const pactsFulfilled = useGamificationStore((s) => s.pactsFulfilled);
  const leagueId = useGamificationStore((s) => s.leagueId);
  const leagues = useGamificationStore((s) => s.leagues);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [hobbyTags, setHobbyTags] = useState<PublicProfile['hobbyTags']>([]);

  const displayName = username
    ? `@${username}`
    : user?.email?.split('@')[0] || profile?.hobby || 'Learner';
  const initial = (username || displayName).replace('@', '').charAt(0).toUpperCase();
  const league = findLeague(leagueId, leagues);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let cancelled = false;
      void Promise.all([
        fetchSocialLinks(user.id),
        listFeed({ limit: 30, authorId: user.id }),
        fetchOwnHobbyTags(user.id),
      ])
        .then(([nextLinks, nextPosts, nextTags]) => {
          if (cancelled) return;
          setLinks(nextLinks);
          setPosts(nextPosts);
          setHobbyTags(nextTags);
        })
        .catch(() => {
          /* ignore soft failures on profile */
        });
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      clearSession();
      clearPreferencesSession();
      clearUserSession();
      clearGamification();
      clearPact();
      router.replace('/(auth)');
    } catch (error) {
      setSignOutError(toAuthError(error).message);
    } finally {
      setIsSigningOut(false);
    }
  };

  const onShare = async () => {
    if (!username) {
      setClaimOpen(true);
      return;
    }
    await Share.share({
      message: profileShareMessage(username, league.name, rating),
    });
  };

  const onEditProfile = () => {
    if (!username) {
      setClaimOpen(true);
      return;
    }
    setEditOpen(true);
  };

  const onNewPost = () => {
    if (!username) {
      setClaimOpen(true);
      return;
    }
    router.push('/(app)/post/compose' as never);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: spacing.md,
        paddingBottom: FLOATING_TAB_BAR_HEIGHT + 24,
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push('/(app)/search' as never)}
            accessibilityLabel="Search profiles"
          >
            <Text style={styles.settingsGlyph}>🔍</Text>
          </Pressable>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push('/(app)/preferences' as never)}
            accessibilityLabel="Settings"
          >
            <Text style={styles.settingsGlyph}>⚙</Text>
          </Pressable>
        </View>
      </View>

      {!username ? (
        <Pressable style={styles.claimBanner} onPress={() => setClaimOpen(true)}>
          <Text style={styles.claimTitle}>Claim your username</Text>
          <Text style={styles.claimSub}>Needed to post, appear in search, and share your profile.</Text>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <LeagueBadge leagueId={leagueId} leagues={leagues} />
        {bio ? <Text style={styles.bio}>{bio}</Text> : null}
        <HobbyTagsRow tags={hobbyTags} />
        <SocialLinksRow links={links} />
        <Pressable
          style={styles.statRow}
          onPress={() => router.push('/(app)/streak' as never)}
          accessibilityLabel="Open streak page"
        >
          <Text style={styles.statItem}>🔥 {currentStreak}d</Text>
          <View style={styles.statDivider} />
          <Text style={styles.statItem}>★ {rating}</Text>
          <View style={styles.statDivider} />
          <Text style={styles.statItem}>🤝 {pactsFulfilled} kept</Text>
        </Pressable>
        <View style={styles.actionRow}>
          <Pressable style={styles.editBtn} onPress={onEditProfile}>
            <Text style={styles.editText}>EDIT</Text>
          </Pressable>
          <Pressable style={styles.editBtn} onPress={() => void onShare()}>
            <Text style={styles.editText}>SHARE</Text>
          </Pressable>
          <Pressable style={styles.editBtn} onPress={onNewPost}>
            <Text style={styles.editText}>NEW POST</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Posts</Text>
      <ProfilePostsGrid posts={posts} emptyHint="Share your first hobby post." />

      <Text style={styles.sectionTitle}>My Progress</Text>
      <View style={styles.listCard}>
        {PROGRESS_LINKS.map((item, index) => (
          <Pressable
            key={item.id}
            style={[styles.listRow, index < PROGRESS_LINKS.length - 1 && styles.listRowBorder]}
            onPress={() => router.push(item.href as never)}
          >
            <Text style={styles.listIcon}>{item.icon}</Text>
            <Text style={styles.listLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      {signOutError ? <InlineError message={signOutError} /> : null}
      <Pressable style={styles.signOut} onPress={handleSignOut} disabled={isSigningOut}>
        <Text style={styles.signOutText}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>

      {user?.id ? (
        <>
          <ClaimUsernameSheet
            visible={claimOpen}
            userId={user.id}
            onClose={() => setClaimOpen(false)}
            onClaimed={() => setClaimOpen(false)}
          />
          <EditBioLinksSheet
            visible={editOpen}
            userId={user.id}
            onClose={() => setEditOpen(false)}
            onSaved={setLinks}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  settingsBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingsGlyph: {
    fontSize: 18,
  },
  claimBanner: {
    backgroundColor: '#E8F6FE',
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  claimTitle: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  claimSub: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#F7F3EA',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: onboardingColors.primaryText,
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  bio: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  statItem: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  statDivider: {
    backgroundColor: onboardingColors.border,
    height: 16,
    width: 1,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  editBtn: {
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  editText: {
    color: onboardingColors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomColor: onboardingColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listIcon: {
    fontSize: 18,
    width: 24,
  },
  listLabel: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    color: onboardingColors.textMuted,
    fontSize: 22,
  },
  signOut: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: onboardingColors.text,
    fontWeight: '700',
  },
});
