import { ClaimUsernameSheet } from '@/components/profile/ClaimUsernameSheet';
import { EditBioLinksSheet } from '@/components/profile/EditBioLinksSheet';
import { HobbyTagsRow } from '@/components/profile/HobbyTagsRow';
import { SocialLinksRow } from '@/components/profile/SocialLinksRow';
import { InlineError } from '@/components/ui/InlineError';
import { ScreenShell, TAB_SCROLL_BOTTOM_INSET } from '@/components/ui/ScreenShell';
import { theme } from '@/constants/theme';
import { learnInPublic } from '@/constants/learnInPublic';
import { fonts, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { toAuthError } from '@/lib/errors';
import { findLeague, profileShareMessage } from '@/lib/gamification/leagues';
import { fetchOwnHobbyTags } from '@/services/profileSearch';
import { fetchSocialLinks } from '@/services/socialLinks';
import { useGamificationStore } from '@/store/useGamificationStore';
import { usePactStore } from '@/store/usePactStore';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useUserStore } from '@/store/useUserStore';
import type { PublicProfile } from '@/types/gamification.types';
import type { SocialLink } from '@/types/post.types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuRow, !last && styles.menuRowBorder]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? theme.colors.danger : theme.colors.text}
      />
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    </Pressable>
  );
}

function MenuCard({ children }: { children: ReactNode }) {
  return <View style={styles.menuCard}>{children}</View>;
}

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
  const rating = useGamificationStore((s) => s.rating);
  const leagueId = useGamificationStore((s) => s.leagueId);
  const leagues = useGamificationStore((s) => s.leagues);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [hobbyTags, setHobbyTags] = useState<PublicProfile['hobbyTags']>([]);

  const displayName = username
    ? username
    : user?.email?.split('@')[0] || profile?.hobby || 'Learner';
  const initial = displayName.replace('@', '').charAt(0).toUpperCase();
  const league = findLeague(leagueId, leagues);
  const needsUsername = !username;
  const needsBioOrLinks = Boolean(username) && !bio && links.length === 0;

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let cancelled = false;
      void Promise.all([fetchSocialLinks(user.id), fetchOwnHobbyTags(user.id)])
        .then(([nextLinks, nextTags]) => {
          if (cancelled) return;
          setLinks(nextLinks);
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
    router.push('/(app)/(tabs)/feed' as never);
  };

  const learningMenu: MenuItem[] = [
    {
      id: 'streak',
      label: 'My Streak',
      icon: 'flame-outline',
      onPress: () => router.push('/(app)/streak' as never),
    },
    {
      id: 'daily-tasks',
      label: 'Daily Tasks',
      icon: 'checkbox-outline',
      onPress: () => router.push('/(app)/daily-tasks' as never),
    },
    {
      id: 'pact',
      label: 'The Pact',
      icon: 'people-outline',
      onPress: () => router.push('/(app)/pact' as never),
    },
    {
      id: 'search',
      label: learnInPublic.findPartners,
      icon: 'search-outline',
      onPress: () => router.push('/(app)/search' as never),
    },
    {
      id: 'my-posts',
      label: learnInPublic.myShowcase,
      icon: 'grid-outline',
      onPress: () => router.push('/(app)/my-posts' as never),
    },
    {
      id: 'new-post',
      label: learnInPublic.shareWork,
      icon: 'add-circle-outline',
      onPress: onNewPost,
    },
  ];

  const accountMenu: MenuItem[] = [
    {
      id: 'share',
      label: 'Share profile',
      icon: 'share-outline',
      onPress: () => void onShare(),
    },
    {
      id: 'feedback',
      label: 'Share Feedback',
      icon: 'chatbubble-ellipses-outline',
      onPress: () =>
        void Linking.openURL(
          'mailto:hello@hobbyflow.app?subject=HobbyFlow%20feedback',
        ),
    },
    {
      id: 'sign-out',
      label: isSigningOut ? 'Signing out…' : 'Sign out',
      icon: 'log-out-outline',
      onPress: () => void handleSignOut(),
      danger: true,
    },
  ];

  return (
    <ScreenShell padded={false} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityBody}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {username ? <Text style={styles.handle}>@{username}</Text> : null}
            <Pressable onPress={onEditProfile} hitSlop={8}>
              <Text style={styles.editLink}>Edit Profile ›</Text>
            </Pressable>
          </View>
        </View>

        {needsUsername ? (
          <Pressable style={styles.ctaBanner} onPress={() => setClaimOpen(true)}>
            <View style={styles.ctaCopy}>
              <Text style={styles.ctaTitle}>Finish your profile!</Text>
              <Text style={styles.ctaSub}>Claim a username to post & share</Text>
              <Text style={styles.ctaAction}>Claim Username ›</Text>
            </View>
            <View style={styles.ctaArt}>
              <Text style={styles.ctaArtGlyph}>✦</Text>
            </View>
          </Pressable>
        ) : needsBioOrLinks ? (
          <Pressable style={styles.ctaBanner} onPress={onEditProfile}>
            <View style={styles.ctaCopy}>
              <Text style={styles.ctaTitle}>Finish your profile!</Text>
              <Text style={styles.ctaSub}>Add a bio & social links</Text>
              <Text style={styles.ctaAction}>Add Details ›</Text>
            </View>
            <View style={styles.ctaArt}>
              <Text style={styles.ctaArtGlyph}>✎</Text>
            </View>
          </Pressable>
        ) : null}

        {(bio || hobbyTags.length > 0 || links.length > 0) && (
          <View style={styles.aboutCard}>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
            <HobbyTagsRow tags={hobbyTags} />
            <SocialLinksRow links={links} />
          </View>
        )}

        <MenuCard>
          {learningMenu.map((item, index) => (
            <MenuRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              last={index === learningMenu.length - 1}
            />
          ))}
        </MenuCard>

        <MenuCard>
          {accountMenu.map((item, index) => (
            <MenuRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              danger={item.danger}
              last={index === accountMenu.length - 1}
            />
          ))}
        </MenuCard>

        {signOutError ? <InlineError message={signOutError} /> : null}

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
  scroll: {
    gap: spacing.md,
    paddingBottom: TAB_SCROLL_BOTTOM_INSET + 48,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 20,
  },
  identityCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.block,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.avatar,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 24,
  },
  identityBody: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 20,
  },
  handle: {
    color: theme.colors.textMuted,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  editLink: {
    color: theme.colors.textMuted,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    marginTop: 4,
  },
  ctaBanner: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActive,
    borderRadius: theme.radii.block,
    flexDirection: 'row',
    minHeight: 112,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  ctaCopy: {
    flex: 1,
    gap: 4,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 20,
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  ctaAction: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    marginTop: 8,
  },
  ctaArt: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: theme.radii.tile,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  ctaArtGlyph: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 28,
  },
  aboutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.block,
    gap: spacing.sm,
    padding: spacing.md,
  },
  bio: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.block,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  menuRowBorder: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  menuLabelDanger: {
    color: theme.colors.danger,
  },
});
