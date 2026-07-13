import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { mindMapColors } from '@/lib/roadmap/mindMapLayout';
import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';

export type LinkedLessonItem = {
  node: RoadmapNodeRow;
  status: RoadmapLessonRow['status'] | 'unknown';
  practiceCount: number;
};

type Props = {
  title: string;
  linkedLessons: LinkedLessonItem[];
  totalLinked: number;
  onSelectLesson?: (lessonId: string) => void;
};

function statusLabel(status: LinkedLessonItem['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'skipped') return 'Skipped';
  if (status === 'in_progress') return 'In progress';
  if (status === 'ready') return 'Ready';
  if (status === 'generating') return 'Generating';
  if (status === 'failed') return 'Failed';
  return 'Not started';
}

export function MindMapSidebar({
  title,
  linkedLessons,
  totalLinked,
  onSelectLesson,
}: Props) {
  const completed = linkedLessons.filter((l) => l.status === 'completed').length;
  const practices = linkedLessons.reduce((sum, l) => sum + l.practiceCount, 0);
  const visible = linkedLessons.slice(0, 8);
  const more = Math.max(0, totalLinked - visible.length);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.pill}>
        <Text style={styles.pillText}>Not started</Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statLine}>
          {totalLinked} lessons · {completed} completed · 0 mastered
        </Text>
        <Text style={styles.statMuted}>{practices} practices</Text>
      </View>

      <Text style={styles.sectionLabel}>LINKED LESSONS {totalLinked}</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {visible.map(({ node, status, practiceCount }) => (
          <Pressable
            key={node.id}
            style={styles.lessonRow}
            onPress={() => onSelectLesson?.(node.id)}
          >
            <View style={styles.lessonText}>
              <Text style={styles.lessonName}>{node.name}</Text>
              {practiceCount > 0 ? (
                <Text style={styles.lessonMeta}>{practiceCount} practices</Text>
              ) : null}
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{statusLabel(status)}</Text>
            </View>
          </Pressable>
        ))}
        {more > 0 ? (
          <Text style={styles.more}>+{more} more lessons linked to this concept.</Text>
        ) : null}
        {totalLinked === 0 ? (
          <Text style={styles.more}>No lessons linked to this concept.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: mindMapColors.sidebar,
    borderColor: onboardingColors.border,
    borderTopWidth: 1,
    flex: 1,
    gap: spacing.sm,
    maxHeight: 320,
    padding: spacing.md,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: mindMapColors.statusPill,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    backgroundColor: '#F3F0E8',
    borderRadius: radii.card,
    gap: 2,
    padding: spacing.sm,
  },
  statLine: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  statMuted: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  sectionLabel: {
    color: onboardingColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: spacing.xs,
  },
  list: {
    flexGrow: 0,
  },
  lessonRow: {
    alignItems: 'center',
    borderBottomColor: onboardingColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  lessonText: {
    flex: 1,
    gap: 2,
  },
  lessonName: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  lessonMeta: {
    color: onboardingColors.textMuted,
    fontSize: 11,
  },
  statusBadge: {
    backgroundColor: mindMapColors.statusPill,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: onboardingColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  more: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
});
