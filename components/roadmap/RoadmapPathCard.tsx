import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

export type PathMode = 'map' | 'exercise';

type Props = {
  title: string;
  coverUri?: string | null;
  mode: PathMode;
  onModeChange: (mode: PathMode) => void;
  onOpenSwitcher: () => void;
  onOpenMenu: () => void;
};

export function RoadmapPathCard({
  title,
  coverUri,
  mode,
  onModeChange,
  onOpenSwitcher,
  onOpenMenu,
}: Props) {
  return (
    <View style={styles.card} testID="roadmap-path-card">
      <View style={styles.topRow}>
        <View style={styles.thumb}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.thumbImage} />
          ) : (
            <Text style={styles.thumbPlaceholder}>HF</Text>
          )}
        </View>
        <Pressable style={styles.titleBlock} onPress={onOpenSwitcher} accessibilityLabel="Switch roadmap">
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>
        <Pressable
          onPress={onOpenMenu}
          accessibilityLabel="Roadmap menu"
          style={styles.menuBtn}
          testID="roadmap-menu"
        >
          <Text style={styles.menuDots}>⋮</Text>
        </Pressable>
      </View>

      <View style={styles.modes}>
        <Pressable
          style={[styles.mode, mode === 'map' && styles.modeActive]}
          onPress={() => onModeChange('map')}
          testID="mode-map"
        >
          <Text style={[styles.modeText, mode === 'map' && styles.modeTextActive]}>Map</Text>
        </Pressable>
        <Pressable
          style={[styles.mode, mode === 'exercise' && styles.modeActive]}
          onPress={() => onModeChange('exercise')}
          testID="mode-exercise"
        >
          <Text style={[styles.modeText, mode === 'exercise' && styles.modeTextActive]}>
            Exercise
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: '#E8F6FE',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  thumbPlaceholder: {
    color: onboardingColors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  titleBlock: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  chevron: {
    color: onboardingColors.textMuted,
    fontSize: 14,
  },
  menuBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  menuDots: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  modes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mode: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modeActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
  },
  modeText: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: onboardingColors.primaryText,
    fontWeight: '700',
  },
});
