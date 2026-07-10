import { StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  streakDays: number;
};

export function StreakHeroCard({ streakDays }: Props) {
  const mood = streakDays <= 0 ? 'sad' : streakDays < 7 ? 'happy' : 'fire';
  const glyph = mood === 'sad' ? '🌧️' : mood === 'happy' ? '🔥' : '🏆';
  const caption =
    streakDays <= 0
      ? "Complete today's task to start a streak"
      : streakDays === 1
        ? 'Nice — keep it going tomorrow'
        : 'You are on a roll';

  return (
    <View style={styles.card}>
      <View style={styles.textCol}>
        <Text style={styles.title}>
          You're on a <Text style={styles.accent}>{streakDays} Days</Text> Streak
        </Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <View style={[styles.mascot, mood === 'sad' && styles.mascotSad]}>
        <Text style={styles.mascotGlyph}>{glyph}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  accent: {
    color: '#E11D48',
  },
  caption: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  mascot: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 40,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  mascotSad: {
    backgroundColor: '#EEF2FF',
  },
  mascotGlyph: {
    fontSize: 34,
  },
});
