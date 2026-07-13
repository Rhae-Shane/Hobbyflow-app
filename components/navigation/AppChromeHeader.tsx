import { type ReactNode, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { usePathname, useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import { learnInPublic } from '@/constants/learnInPublic';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useUserStore } from '@/store/useUserStore';

type ChromeConfig =
  | { variant: 'home' }
  | {
      variant: 'nav';
      title: string;
      showBack: boolean;
      closeStyle?: boolean;
      right?: 'streak-savers' | 'info' | null;
    };

function resolveChrome(pathname: string): ChromeConfig {
  if (pathname.includes('/leaderboard')) {
    return { variant: 'nav', title: 'Leaderboard', showBack: true, right: null };
  }
  if (pathname.includes('/streak')) {
    return { variant: 'nav', title: 'Streak', showBack: true, closeStyle: true, right: 'streak-savers' };
  }
  if (pathname.includes('/daily-tasks')) {
    return { variant: 'nav', title: 'Daily Tasks', showBack: true, right: null };
  }
  if (pathname.includes('/my-posts')) {
    return { variant: 'nav', title: learnInPublic.myShowcase, showBack: true, right: null };
  }
  if (pathname.includes('/post/')) {
    return { variant: 'nav', title: 'Post', showBack: true, right: null };
  }
  if (pathname.includes('/pact')) {
    return { variant: 'nav', title: 'The Pact', showBack: true, right: null };
  }
  if (pathname.includes('/search')) {
    return { variant: 'nav', title: learnInPublic.findPartners, showBack: true, right: null };
  }
  if (pathname.includes('/roadmap-preview')) {
    return { variant: 'nav', title: 'Preview', showBack: true, right: null };
  }
  if (pathname.includes('/explore')) {
    return { variant: 'nav', title: 'Explore Module', showBack: false, right: null };
  }
  if (pathname.includes('/roadmap/')) {
    return { variant: 'nav', title: 'Explore Module', showBack: true, right: null };
  }
  if (pathname.includes('/technique/')) {
    return { variant: 'nav', title: 'Technique', showBack: true, right: null };
  }
  if (pathname.includes('/u/')) {
    return { variant: 'nav', title: 'Profile', showBack: true, right: null };
  }
  if (pathname.includes('/courses')) {
    return { variant: 'nav', title: 'Courses', showBack: true, right: null };
  }
  if (pathname.includes('/profile')) {
    return { variant: 'nav', title: 'Profile', showBack: true, right: null };
  }
  if (pathname.includes('/feed')) {
    return { variant: 'nav', title: learnInPublic.title, showBack: true, right: null };
  }
  if (pathname.includes('/generate')) {
    return { variant: 'nav', title: 'Generate', showBack: false, right: null };
  }
  // Home / tabs index
  return { variant: 'home' };
}

function FlameIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c1.5 3 1 5.5-1 7 2.5-.2 5 1.5 5 5a6 6 0 1 1-11.5-2.3C6 10 8.5 8.5 9 6c1.2 1.5 2.2 1.8 3-3Z"
        fill="#FF8A3D"
      />
    </Svg>
  );
}

function StreakSaversBadge({ count }: { count: number }) {
  return (
    <View style={styles.saverBadge} testID="chrome-streak-savers">
      <View style={styles.shield}>
        <Text style={styles.shieldPlus}>+</Text>
      </View>
      <Text style={styles.saverCount}>{count}</Text>
    </View>
  );
}

function InfoButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.infoBtn}
      accessibilityLabel="Info"
      hitSlop={8}
      testID="chrome-info"
    >
      <Text style={styles.infoGlyph}>ⓘ</Text>
    </Pressable>
  );
}

function HomeChrome() {
  const router = useRouter();
  const { user } = useAuth();
  const username = useUserStore((s) => s.username);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const rating = useGamificationStore((s) => s.rating);

  const initial = (username?.replace(/^@/, '').charAt(0) || user?.email?.charAt(0) || 'H')
    .toUpperCase();

  return (
    <View style={styles.homeRow} testID="chrome-home">
      <Pressable
        style={styles.avatar}
        onPress={() => router.push('/(app)/(tabs)/profile' as never)}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        testID="chrome-avatar"
      >
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
      </Pressable>

      <View style={styles.homeBrand}>
        <Text style={styles.homeTitle} numberOfLines={1}>
          HobbyFlow
        </Text>
      </View>

      <View style={styles.stats}>
        <Pressable
          style={styles.statPill}
          onPress={() => router.push('/(app)/streak' as never)}
          accessibilityLabel={`Streak ${currentStreak}`}
          testID="chrome-streak"
        >
          <FlameIcon />
          <Text style={styles.statText}>{currentStreak}</Text>
        </Pressable>

        <Pressable
          style={styles.statPill}
          onPress={() => router.push('/(app)/leaderboard' as never)}
          accessibilityLabel={`XP ${rating}`}
          testID="chrome-xp"
        >
          <Text style={styles.xpGlyph}>★</Text>
          <Text style={styles.statText}>{rating}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Fixed top chrome:
 * - Home: profile avatar · title · streak + XP
 * - Other screens: back/close · title · optional right
 */
export function AppChromeHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const streakSavers = useGamificationStore((s) => s.streakSavers);
  const config = useMemo(() => resolveChrome(pathname), [pathname]);

  if (config.variant === 'home') {
    return (
      <View style={styles.wrap} testID="app-chrome-header">
        <HomeChrome />
      </View>
    );
  }

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(app)/(tabs)' as never);
  };

  let right: ReactNode = <View style={styles.sideSlot} />;
  if (config.right === 'streak-savers') {
    right = <StreakSaversBadge count={streakSavers} />;
  } else if (config.right === 'info') {
    right = <InfoButton onPress={() => router.push('/(app)/streak' as never)} />;
  }

  return (
    <View style={styles.wrap} testID="app-chrome-header">
      <View style={styles.row}>
        {config.showBack ? (
          <Pressable
            onPress={onBack}
            style={styles.sideBtn}
            accessibilityLabel={config.closeStyle ? 'Close' : 'Go back'}
            hitSlop={8}
            testID="chrome-back"
          >
            <Text style={[styles.sideGlyph, config.closeStyle && styles.closeGlyph]}>
              {config.closeStyle ? '×' : '←'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {config.title}
        </Text>

        <View style={styles.sideSlot}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  homeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 40,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#B8E4E0',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarText: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  homeBrand: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  homeTitle: {
    color: theme.colors.text,
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  stats: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    gap: 4,
    height: 36,
    paddingHorizontal: 10,
  },
  statText: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  xpGlyph: {
    color: '#E6A800',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  sideBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sideGlyph: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  closeGlyph: {
    fontSize: 28,
    lineHeight: 32,
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
  sideSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 40,
  },
  saverBadge: {
    alignItems: 'center',
    backgroundColor: '#E8F4FC',
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shield: {
    alignItems: 'center',
    backgroundColor: '#4DA3FF',
    borderRadius: 4,
    height: 16,
    justifyContent: 'center',
    width: 14,
  },
  shieldPlus: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 12,
  },
  saverCount: {
    color: '#4DA3FF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  infoBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  infoGlyph: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '400',
  },
});
