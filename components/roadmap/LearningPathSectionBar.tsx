import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { LearningPathSectionHeader } from '@/lib/roadmap/learningPathBuilder';

type Props = {
  item: LearningPathSectionHeader;
  onJournalPress: (sectionId: string) => void;
};

export function LearningPathSectionBar({ item, onJournalPress }: Props) {
  return (
    <View style={styles.bar} testID={`section-bar-${item.sectionId}`}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          {item.sectionIndex + 1}. {item.name}
        </Text>
        <Text style={styles.progress}>
          {item.completedLessons}/{item.totalLessons} lessons
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`Open concept map for ${item.name}`}
        onPress={() => onJournalPress(item.sectionId)}
        style={styles.journal}
        testID={`section-journal-${item.sectionId}`}
      >
        <Text style={styles.journalIcon}>☰</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
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
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  journalIcon: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
