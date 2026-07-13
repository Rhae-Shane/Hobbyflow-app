import { useMemo, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandLogo } from '@/components/brand/BrandLogo';
import {
  CATEGORY_ILLUSTRATIONS,
  HOME_ILLUSTRATION_POOL,
  type DoodleProps,
} from '@/components/home/categoryIllustrations';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

type DoodleComp = ComponentType<DoodleProps>;

type Floater = {
  Comp: DoodleComp;
  top: number;
  left?: number;
  right?: number;
  size: number;
  color: string;
  opacity: number;
  rotate: string;
};

const ACCENT_COLORS = [
  theme.colors.accentDeep,
  theme.colors.navActive,
  '#5BB89A',
  theme.colors.accentOrange,
  theme.colors.heroDeep,
] as const;

function pickUnique<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

function buildFloaters(width: number): Floater[] {
  const doodles = pickUnique(
    [...new Set([...HOME_ILLUSTRATION_POOL, ...Object.values(CATEGORY_ILLUSTRATIONS)])],
    6,
  ) as DoodleComp[];

  const slots = [
    { top: 28, left: 8, size: 72 },
    { top: 36, right: 4, size: 78 },
    { top: 130, left: width * 0.02, size: 64 },
    { top: 118, right: width * 0.01, size: 70 },
    { top: 210, left: width * 0.12, size: 56 },
    { top: 200, right: width * 0.1, size: 58 },
  ];

  return slots.map((slot, i) => ({
    Comp: doodles[i % doodles.length]!,
    top: slot.top,
    left: slot.left,
    right: slot.right,
    size: slot.size,
    color: ACCENT_COLORS[i % ACCENT_COLORS.length]!,
    opacity: 0.55 + (i % 3) * 0.12,
    rotate: `${i % 2 === 0 ? -8 : 10}deg`,
  }));
}

/** Pre-login welcome — scattered Open Doodles–style hobby art + Get Started CTA. */
export function GetStartedScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const { hero, floaters } = useMemo(() => {
    const pool = [
      ...new Set([...HOME_ILLUSTRATION_POOL, ...Object.values(CATEGORY_ILLUSTRATIONS)]),
    ] as DoodleComp[];
    const heroPick = pool[Math.floor(Math.random() * pool.length)]!;
    return { hero: heroPick, floaters: buildFloaters(width) };
  }, [width]);

  const Hero = hero;

  return (
    <View style={styles.root}>
      <View style={styles.gridLayer} pointerEvents="none">
        {Array.from({ length: 14 }).map((_, row) => (
          <View key={`r-${row}`} style={[styles.gridRow, { top: row * 36 }]}>
            {Array.from({ length: 10 }).map((__, col) => (
              <View key={`c-${col}`} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.artStage, { height: Math.min(height * 0.48, 420) }]} pointerEvents="none">
        {floaters.map((item, index) => {
          const Comp = item.Comp;
          return (
            <View
              key={`floater-${index}`}
              style={[
                styles.floater,
                {
                  top: item.top,
                  left: item.left,
                  right: item.right,
                  opacity: item.opacity,
                  transform: [{ rotate: item.rotate }],
                },
              ]}
            >
              <Comp width={item.size} height={item.size} color={item.color} />
            </View>
          );
        })}

        <View style={styles.heroWrap}>
          <View style={styles.heroHalo} />
          <Hero width={180} height={180} color={theme.colors.text} />
        </View>
      </View>

      <View style={styles.copy}>
        <BrandLogo size={72} style={styles.brandLogo} />
        <Text style={styles.headline}>
          Go with your{'\n'}
          <Text style={styles.headlineAccent}>hobby</Text>
          {"'s flow"}
        </Text>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Roadmaps for any hobby</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get started"
          onPress={() => router.push('/(auth)/login' as never)}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
        <Text style={styles.legal}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
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
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
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
    height: 36,
    width: '10%',
  },
  artStage: {
    marginTop: spacing.xl,
    position: 'relative',
    width: '100%',
  },
  floater: {
    position: 'absolute',
    zIndex: 1,
  },
  heroWrap: {
    alignItems: 'center',
    bottom: 8,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  heroHalo: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    height: 200,
    position: 'absolute',
    width: 200,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  brandLogo: {
    marginBottom: spacing.xs,
  },
  headline: {
    color: theme.colors.text,
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -0.6,
    lineHeight: 44,
    textAlign: 'center',
  },
  headlineAccent: {
    color: theme.colors.accentDeep,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeDot: {
    backgroundColor: theme.colors.navActive,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  badgeText: {
    color: theme.colors.navActive,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radii.block,
    paddingVertical: 18,
  },
  ctaText: {
    color: theme.colors.ctaText,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
  },
  legal: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
