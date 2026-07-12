import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { radii, spacing } from '@/constants/tokens';

export type PathMode = 'map' | 'exercise';

type Props = {
  title: string;
  subtitle?: string;
  completedLessons: number;
  totalLessons: number;
  coverUri?: string | null;
  mode: PathMode;
  onModeChange: (mode: PathMode) => void;
  onOpenSwitcher: () => void;
  onOpenMenu: () => void;
  onViewSessions?: () => void;
};

export function RoadmapPathCard({
  title,
  subtitle = 'Your learning path',
  completedLessons,
  totalLessons,
  mode,
  onModeChange,
  onOpenSwitcher,
  onOpenMenu,
  onViewSessions,
}: Props) {
  const progress = totalLessons > 0 ? Math.min(1, completedLessons / totalLessons) : 0;

  return (
    <View style={styles.card} testID="roadmap-path-card">
      <View style={styles.topRow}>
        <Pressable
          style={styles.stackBadge}
          onPress={onOpenMenu}
          accessibilityLabel="Roadmap menu"
          testID="roadmap-menu"
        >
          <Text style={styles.stackIcon}>▤</Text>
        </Pressable>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modePill, mode === 'map' && styles.modePillActive]}
            onPress={() => onModeChange('map')}
            testID="mode-map"
          >
            <Text style={[styles.modePillText, mode === 'map' && styles.modePillTextActive]}>
              Lessons
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modePill, mode === 'exercise' && styles.modePillActive]}
            onPress={() => onModeChange('exercise')}
            testID="mode-exercise"
          >
            <Text
              style={[styles.modePillText, mode === 'exercise' && styles.modePillTextActive]}
            >
              Exercises
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroArt} pointerEvents="none">
        <View style={styles.heroRing}>
          <Text style={styles.heroGlyph}>◎</Text>
        </View>
      </View>

      <Pressable onPress={onOpenSwitcher} accessibilityLabel="Switch roadmap">
        <Text style={styles.title} numberOfLines={2}>
          Module: {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </Pressable>

      <View style={styles.progressTrack} testID="module-progress">
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <Pressable
        style={styles.cta}
        onPress={onViewSessions}
        testID="view-sessions-cta"
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>VIEW SESSIONS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: 28,
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stackBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.avatar,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stackIcon: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modePill: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modePillActive: {
    backgroundColor: '#FFFFFF',
  },
  modePillText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modePillTextActive: {
    color: onboardingColors.text,
    fontWeight: '800',
  },
  heroArt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  heroRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 48,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  heroGlyph: {
    color: onboardingColors.text,
    fontSize: 36,
    fontWeight: '300',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.75,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: 'rgba(91, 159, 232, 0.35)',
    borderRadius: radii.pill,
    height: 8,
    marginTop: spacing.xs,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.pill,
    height: '100%',
  },
  cta: {
    alignItems: 'center',
    backgroundColor: theme.colors.cta,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
    paddingVertical: 14,
  },
  ctaText: {
    color: theme.colors.ctaText,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
