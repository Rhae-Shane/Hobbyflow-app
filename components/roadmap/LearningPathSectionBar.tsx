import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import type { LearningPathSectionHeader } from '@/lib/roadmap/learningPathBuilder';

type Props = {
  item: LearningPathSectionHeader;
  expanded: boolean;
  onToggle: (sectionId: string) => void;
  /** Optional secondary action (concept map). */
  onJournalPress?: (sectionId: string) => void;
};

export function LearningPathSectionBar({
  item,
  expanded,
  onToggle,
  onJournalPress,
}: Props) {
  return (
    <Pressable
      style={[styles.bar, expanded && styles.barExpanded]}
      onPress={() => onToggle(item.sectionId)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${item.name}, ${item.completedLessons} of ${item.totalLessons} lessons`}
      testID={`section-bar-${item.sectionId}`}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {item.sectionIndex + 1}. {item.name}
        </Text>
        <Text style={styles.progress}>
          {item.completedLessons}/{item.totalLessons} lessons
        </Text>
      </View>

      {onJournalPress ? (
        <Pressable
          accessibilityLabel={`Open concept map for ${item.name}`}
          onPress={(e) => {
            e?.stopPropagation?.();
            onJournalPress(item.sectionId);
          }}
          style={styles.journal}
          testID={`section-journal-${item.sectionId}`}
          hitSlop={8}
        >
          <Text style={styles.journalIcon}>☰</Text>
        </Pressable>
      ) : null}

      <View style={styles.chevronCircle}>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>
          {expanded ? '▾' : '›'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 22,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  barExpanded: {
    backgroundColor: '#ECECEC',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  progress: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  journal: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  journalIcon: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  chevronCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.avatar,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  chevron: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  chevronOpen: {
    fontSize: 16,
  },
});
