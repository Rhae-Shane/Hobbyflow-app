import { StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { findLeague } from '@/lib/gamification/leagues';
import type { LeagueRow } from '@/types/gamification.types';

type Props = {
  leagueId: string | null | undefined;
  leagues?: LeagueRow[];
  compact?: boolean;
};

export function LeagueBadge({ leagueId, leagues, compact }: Props) {
  const league = findLeague(leagueId, leagues);
  return (
    <View style={[styles.badge, { backgroundColor: `${league.color_hex}33`, borderColor: league.color_hex }]}>
      <Text style={[styles.text, { color: onboardingColors.text }, compact && styles.textCompact]}>
        {league.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
  textCompact: {
    fontSize: 11,
  },
});
