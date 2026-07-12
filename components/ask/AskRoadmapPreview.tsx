import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import Svg, { Path } from 'react-native-svg';
import {
  askCompanionColors,
  askCompanionRadii,
} from '@/constants/askCompanionTokens';
import { toDateKey } from '@/lib/gamification/streakMath';
import { spacing } from '@/constants/tokens';

type RangeKey = 'day' | 'week' | 'month' | 'year';

type Props = {
  activityDates: string[];
  progressPercent?: number;
  roadmapTitle?: string | null;
};

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

const MILESTONES = [
  { id: 'start', label: 'Started', dayIndex: 0 },
  { id: 'routine', label: 'Routine built', dayIndex: 1 },
  { id: 'milestone', label: 'Lesson streak', dayIndex: 2 },
  { id: 'goal', label: 'Goal defined', dayIndex: 3 },
] as const;

function FlagIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4V20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M6 5H16L14 9L16 13H6" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function AskRoadmapPreview({
  activityDates,
  progressPercent = 0,
  roadmapTitle,
}: Props) {
  const [range, setRange] = useState<RangeKey>('week');
  const todayKey = toDateKey();
  const activeSet = useMemo(() => new Set(activityDates), [activityDates]);

  const days = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
    // Mon–Fri strip for the companion mock
    const monday = dayjs().startOf('day').subtract((dayjs().day() + 6) % 7, 'day');
    return labels.map((label, i) => {
      const d = monday.add(i, 'day');
      const key = d.format('YYYY-MM-DD');
      return {
        label,
        key,
        isToday: key === todayKey,
        hasActivity: activeSet.has(key),
      };
    });
  }, [activeSet, todayKey]);

  const pct = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const todayIndex = Math.max(
    0,
    days.findIndex((d) => d.isToday),
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Roadmap</Text>
          {roadmapTitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {roadmapTitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.ranges}>
          {RANGES.map((r) => (
            <Pressable key={r.key} onPress={() => setRange(r.key)}>
              <Text style={[styles.rangeText, range === r.key && styles.rangeActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.timelineWrap}>
        <View style={[styles.progressBubble, { left: `${(todayIndex / 4) * 82 + 4}%` }]}>
          <Text style={styles.progressText}>{pct}%</Text>
        </View>

        <View style={styles.milestonesRow}>
          {MILESTONES.map((m, i) => (
            <View
              key={m.id}
              style={[
                styles.milestone,
                i === todayIndex && styles.milestoneHot,
                i === 3 && styles.milestoneSoft,
              ]}
            >
              <FlagIcon color={askCompanionColors.text} />
              <Text style={styles.milestoneText} numberOfLines={1}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.line} />
        <View style={styles.daysRow}>
          {days.map((d) => (
            <View key={d.key} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  (d.hasActivity || d.isToday) && styles.dotFill,
                  d.isToday && styles.dotToday,
                ]}
              />
              <Text style={[styles.dayLabel, d.isToday && styles.dayToday]}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: askCompanionColors.surface,
    borderRadius: 24,
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    color: askCompanionColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: askCompanionColors.textMuted,
    fontSize: 12,
    marginTop: 2,
    maxWidth: 160,
  },
  ranges: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  rangeText: {
    color: askCompanionColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rangeActive: {
    color: askCompanionColors.text,
    fontWeight: '800',
  },
  timelineWrap: {
    gap: 10,
    paddingTop: 8,
  },
  progressBubble: {
    backgroundColor: askCompanionColors.cta,
    borderRadius: askCompanionRadii.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  milestonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 28,
  },
  milestone: {
    alignItems: 'center',
    backgroundColor: askCompanionColors.background,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  milestoneHot: {
    backgroundColor: askCompanionColors.milestone,
  },
  milestoneSoft: {
    backgroundColor: askCompanionColors.accentSoft,
  },
  milestoneText: {
    color: askCompanionColors.text,
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 72,
  },
  line: {
    backgroundColor: askCompanionColors.chipBorder,
    borderRadius: 2,
    height: 3,
    marginTop: 4,
    width: '100%',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    backgroundColor: askCompanionColors.chipBorder,
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  dotFill: {
    backgroundColor: askCompanionColors.heroDeep,
  },
  dotToday: {
    backgroundColor: askCompanionColors.cta,
  },
  dayLabel: {
    color: askCompanionColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  dayToday: {
    color: askCompanionColors.text,
    fontWeight: '800',
  },
});
