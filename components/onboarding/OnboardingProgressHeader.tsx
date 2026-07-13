import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

type Props = {
  stepIndex: number;
  stepCount: number;
  onBack?: () => void;
  showBack?: boolean;
};

/** Top chrome: back · progress track · step counter. */
export function OnboardingProgressHeader({
  stepIndex,
  stepCount,
  onBack,
  showBack = true,
}: Props) {
  const current = Math.min(stepIndex + 1, stepCount);
  const progress = stepCount > 0 ? current / stepCount : 0;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        disabled={!showBack}
        onPress={onBack}
        hitSlop={12}
        style={[styles.side, !showBack && styles.sideHidden]}
      >
        {showBack ? <Text style={styles.backGlyph}>‹</Text> : null}
      </Pressable>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <Text style={styles.counter}>
        {current} / {stepCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  side: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sideHidden: {
    opacity: 0,
  },
  backGlyph: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    lineHeight: 32,
    marginTop: -2,
  },
  track: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: theme.colors.accentDeep,
    borderRadius: theme.radii.pill,
    height: '100%',
  },
  counter: {
    color: theme.colors.textMuted,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    minWidth: 44,
    textAlign: 'right',
  },
});
