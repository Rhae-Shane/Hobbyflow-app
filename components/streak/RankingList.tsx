import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LeagueBadge } from '@/components/profile/LeagueBadge';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { LeaderboardEntry, LeagueRow } from '@/types/gamification.types';

type Props = {
  entries: LeaderboardEntry[];
  myRank: number;
  leagues?: LeagueRow[];
};

export function RankingList({ entries, myRank, leagues }: Props) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      {myRank > 0 ? (
        <Text style={styles.myRank}>Your rank · #{myRank}</Text>
      ) : (
        <Text style={styles.myRank}>Complete a task to join the ranking</Text>
      )}

      {entries.length === 0 ? (
        <Text style={styles.empty}>No rankings yet — be the first.</Text>
      ) : (
        entries.map((entry, index) => {
          const content = (
            <>
              <Text style={styles.rank}>#{entry.rank}</Text>
              <View style={styles.body}>
                <Text style={styles.name}>
                  {entry.isMe ? `${entry.displayName} (you)` : entry.displayName}
                </Text>
                <Text style={styles.meta}>
                  {entry.rating} rating · {entry.currentStreak}d streak
                </Text>
              </View>
              <LeagueBadge leagueId={entry.leagueId} leagues={leagues} compact />
            </>
          );

          if (entry.username && !entry.isMe) {
            return (
              <Pressable
                key={entry.userId}
                style={[styles.row, index < entries.length - 1 && styles.rowBorder]}
                onPress={() => router.push(`/(app)/u/${entry.username}` as never)}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View
              key={entry.userId}
              style={[styles.row, index < entries.length - 1 && styles.rowBorder, entry.isMe && styles.rowMe]}
            >
              {content}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  myRank: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomColor: onboardingColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowMe: {
    backgroundColor: '#F7F3EA',
  },
  rank: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '800',
    width: 36,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  empty: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    padding: spacing.md,
  },
});
