import { ClaimUsernameSheet } from '@/components/profile/ClaimUsernameSheet';
import { EditBioLinksSheet } from '@/components/profile/EditBioLinksSheet';
import { HobbyTagsRow } from '@/components/profile/HobbyTagsRow';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { ProfilePostsGrid } from '@/components/profile/ProfilePostsGrid';
import { SocialLinksRow } from '@/components/profile/SocialLinksRow';
import { ScreenShell, TAB_SCROLL_BOTTOM_INSET } from '@/components/ui/ScreenShell';
import { InlineError } from '@/components/ui/InlineError';
import { dashboardColors, dashboardRadii, quickActionPalette } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
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
    <ScreenShell padded={false}>
    <ScrollView
      contentContainerStyle={{
        paddingBottom: TAB_SCROLL_BOTTOM_INSET,
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HobbyFlow</Text>
          <Text style={styles.title}>Profile</Text>
        </View>
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
          <Pressable style={styles.primaryBtn} onPress={onNewPost}>
            <Text style={styles.primaryBtnText}>NEW POST</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Posts</Text>
      <ProfilePostsGrid posts={posts} emptyHint="Share your first hobby post." />

      <Text style={styles.sectionTitle}>My Progress</Text>
      <View style={styles.tileGrid}>
        {PROGRESS_LINKS.map((item, index) => {
          const palette = quickActionPalette[index % quickActionPalette.length];
          return (
            <Pressable
              key={item.id}
              style={[styles.tile, { backgroundColor: palette.background }]}
              onPress={() => router.push(item.href as never)}
            >
              <View style={[styles.tileIcon, { backgroundColor: palette.iconBg }]}>
                <Text style={styles.listIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.tileLabel}>{item.label}</Text>
            </Pressable>
          );
        })}
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
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  settingsBtn: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  settingsGlyph: {
    fontSize: 18,
  },
  claimBanner: {
    backgroundColor: '#F3EAF8',
    borderRadius: dashboardRadii.block,
    gap: 4,
    padding: spacing.md,
  },
  claimTitle: {
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  claimSub: {
    color: dashboardColors.textMuted,
    fontSize: 13,
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
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: dashboardColors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    color: dashboardColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  bio: {
    color: dashboardColors.textMuted,
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
    color: dashboardColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  statDivider: {
    backgroundColor: 'rgba(20,20,20,0.1)',
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
    backgroundColor: dashboardColors.background,
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  editText: {
    color: dashboardColors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: dashboardColors.ctaText,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    borderRadius: dashboardRadii.tile,
    gap: 10,
    padding: spacing.md,
    width: '47.5%',
  },
  tileIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  listIcon: {
    fontSize: 16,
  },
  tileLabel: {
    color: dashboardColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  signOut: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderRadius: dashboardRadii.block,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: dashboardColors.text,
    fontWeight: '700',
  },
});
