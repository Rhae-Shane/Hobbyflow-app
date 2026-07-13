import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { dashboardColors, dashboardRadii } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import type { LeaderboardEntry } from '@/types/gamification.types';

type Props = {
  entries: LeaderboardEntry[];
  myRank: number;
};

const MEDAL = {
  1: { bg: '#FFF6D8', border: '#F0D78A', glyph: '🥇' },
  2: { bg: '#F2F4F7', border: '#D5DAE3', glyph: '🥈' },
  3: { bg: '#F8EDE4', border: '#E2C4AE', glyph: '🥉' },
} as const;

function streakTone(days: number): { bg: string; text: string } {
  if (days >= 14) return { bg: '#E6F7EE', text: '#1B7A4A' };
  if (days >= 7) return { bg: '#FFF4E0', text: '#B86A00' };
  if (days >= 3) return { bg: '#EAF4FF', text: '#1A73E8' };
  return { bg: '#F4F4F6', text: '#6B7280' };
}

function RankMark({ rank }: { rank: number }) {
  const medal = MEDAL[rank as 1 | 2 | 3];
  if (medal) {
    return (
      <View style={styles.medalWrap}>
        <Text style={styles.medalGlyph}>{medal.glyph}</Text>
        <Text style={styles.medalRank}>{rank}</Text>
      </View>
    );
  }
  return <Text style={styles.plainRank}>{rank}</Text>;
}

function initials(name: string): string {
  const cleaned = name.replace(/^@/, '').trim();
  return (cleaned.charAt(0) || '?').toUpperCase();
}

export function LeaderboardList({ entries, myRank }: Props) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.colHeader}>
        <Text style={[styles.colLabel, styles.colRank]}>RANK</Text>
        <Text style={[styles.colLabel, styles.colStudent]}>STUDENT</Text>
        <Text style={[styles.colLabel, styles.colRating]}>RATING</Text>
        <Text style={[styles.colLabel, styles.colStreak]}>STREAK</Text>
      </View>

      {myRank > 0 ? (
        <Text style={styles.myRank}>Your rank · #{myRank}</Text>
      ) : (
        <Text style={styles.myRank}>Complete a task to join the ranking</Text>
      )}

      {entries.length === 0 ? (
        <Text style={styles.empty}>No rankings for this filter yet.</Text>
      ) : (
        entries.map((entry) => {
          const medal = MEDAL[entry.rank as 1 | 2 | 3];
          const tone = streakTone(entry.currentStreak);
          const row = (
            <>
              <View style={styles.colRank}>
                <RankMark rank={entry.rank} />
              </View>
              <View style={[styles.colStudent, styles.studentCell]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(entry.displayName)}</Text>
                </View>
                <View style={styles.studentText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {entry.isMe ? `${entry.displayName} (you)` : entry.displayName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    Best {entry.longestStreak}d
                  </Text>
                </View>
              </View>
              <Text style={[styles.rating, styles.colRating]}>{entry.rating}</Text>
              <View style={styles.colStreak}>
                <View style={[styles.streakPill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.streakText, { color: tone.text }]}>
                    {entry.currentStreak}d
                  </Text>
                </View>
              </View>
            </>
          );

          const rowStyle = [
            styles.row,
            medal && { backgroundColor: medal.bg, borderColor: medal.border },
            entry.isMe && !medal && styles.rowMe,
          ];

          if (entry.username && !entry.isMe) {
            return (
              <Pressable
                key={entry.userId}
                style={rowStyle}
                onPress={() => router.push(`/(app)/u/${entry.username}` as never)}
              >
                {row}
              </Pressable>
            );
          }

          return (
            <View key={entry.userId} style={rowStyle}>
              {row}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  colHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  colLabel: {
    color: dashboardColors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  colRank: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  colStudent: {
    flex: 1,
    paddingRight: 8,
  },
  colRating: {
    textAlign: 'right',
    width: 56,
  },
  colStreak: {
    alignItems: 'flex-end',
    width: 64,
  },
  myRank: {
    color: dashboardColors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  empty: {
    color: dashboardColors.textMuted,
    fontSize: 14,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    backgroundColor: dashboardColors.surface,
    borderColor: 'rgba(20,20,20,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  rowMe: {
    borderColor: 'rgba(26,115,232,0.35)',
  },
  medalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalGlyph: {
    fontSize: 22,
    lineHeight: 24,
  },
  medalRank: {
    color: dashboardColors.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: -10,
  },
  plainRank: {
    color: dashboardColors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  studentCell: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#E8EEF8',
    borderRadius: dashboardRadii.avatar,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: dashboardColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  studentText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: dashboardColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: dashboardColors.textMuted,
    fontSize: 11,
  },
  rating: {
    color: dashboardColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  streakPill: {
    borderRadius: dashboardRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
