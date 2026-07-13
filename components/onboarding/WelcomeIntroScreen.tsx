import { useEffect, useMemo, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  CATEGORY_ILLUSTRATIONS,
  HOME_ILLUSTRATION_POOL,
  type DoodleProps,
} from '@/components/home/categoryIllustrations';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import { getPreferencesResumeStepIndex } from '@/lib/preferencesWizardSteps';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import { hasCompletedPreferences } from '@/types/preferences.types';

type DoodleComp = ComponentType<DoodleProps>;

function displayName(username: string | null): string {
  if (!username) return 'there';
  const cleaned = username.replace(/^@/, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Post-login intro before preferences — speech-bubble hello + hobby doodle hero.
 */
export function WelcomeIntroScreen() {
  const router = useRouter();
  const username = useUserStore((s) => s.username);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const preferences = usePreferencesStore((s) => s.preferences);

  useEffect(() => {
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)' as never);
      return;
    }
    if (hasCompletedPreferences(preferences)) {
      router.replace('/(app)/(tabs)' as never);
      return;
    }
    // Resume mid-wizard without replaying this intro.
    if (getPreferencesResumeStepIndex(preferences) > 0) {
      router.replace('/(app)/preferences' as never);
    }
  }, [completedOnboardingAt, preferences, router]);

  const Hero = useMemo(() => {
    const pool = [
      ...new Set([...HOME_ILLUSTRATION_POOL, ...Object.values(CATEGORY_ILLUSTRATIONS)]),
    ] as DoodleComp[];
    return pool[Math.floor(Math.random() * pool.length)]!;
  }, []);

  const name = displayName(username);

  return (
    <View style={styles.root}>
      <View style={styles.gridLayer} pointerEvents="none">
        {Array.from({ length: 16 }).map((_, row) => (
          <View key={`r-${row}`} style={[styles.gridRow, { top: row * 40 }]}>
            {Array.from({ length: 8 }).map((__, col) => (
              <View key={`c-${col}`} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.brandRow}>
        <BrandLogo size={28} />
        <Text style={styles.brand}>HobbyFlow</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.rings}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringMid]} />
          <View style={styles.heroCircle}>
            <Hero width={120} height={120} color={theme.colors.text} />
          </View>
        </View>

        <View style={styles.bubble}>
          <View style={styles.bubbleTail} />
          <Text style={styles.bubbleTitle}>Hello, {name}!</Text>
          <Text style={styles.bubbleBody}>Tell us a few details about you.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to preferences"
          onPress={() => router.replace('/(app)/preferences' as never)}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  gridCell: {
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    width: '12.5%',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  brand: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  center: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rings: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    width: 220,
  },
  ring: {
    borderRadius: 999,
    borderWidth: 1.5,
    position: 'absolute',
  },
  ringOuter: {
    borderColor: 'rgba(91, 159, 232, 0.22)',
    height: 220,
    width: 220,
  },
  ringMid: {
    borderColor: 'rgba(91, 159, 232, 0.38)',
    height: 180,
    width: 180,
  },
  heroCircle: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: 999,
    height: 140,
    justifyContent: 'center',
    width: 140,
  },
  bubble: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.block,
    borderWidth: 1,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'relative',
    width: '100%',
  },
  bubbleTail: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    height: 14,
    left: '50%',
    marginLeft: -7,
    position: 'absolute',
    top: -7,
    transform: [{ rotate: '45deg' }],
    width: 14,
  },
  bubbleTitle: {
    color: theme.colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  bubbleBody: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radii.pill,
    paddingVertical: 18,
  },
  ctaText: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
});
