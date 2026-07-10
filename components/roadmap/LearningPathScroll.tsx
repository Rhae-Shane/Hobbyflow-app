import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LearningPathNodeView } from '@/components/roadmap/LearningPathNodeView';
import { LearningPathSectionBar } from '@/components/roadmap/LearningPathSectionBar';
import { spacing } from '@/constants/tokens';
import {
  buildLearningPath,
  type LearningPathNode,
} from '@/lib/roadmap/learningPathBuilder';
import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';

type Props = {
  nodes: RoadmapNodeRow[];
  lessons: RoadmapLessonRow[];
  onNodePress: (item: LearningPathNode) => void;
  onJournalPress: (sectionId: string) => void;
  bottomInset?: number;
};

export function LearningPathScroll({
  nodes,
  lessons,
  onNodePress,
  onJournalPress,
  bottomInset = 0,
}: Props) {
  const items = useMemo(() => buildLearningPath({ nodes, lessons }), [nodes, lessons]);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl * 2 + bottomInset }]}
      showsVerticalScrollIndicator={false}
      testID="learning-path-scroll"
    >
      {items.map((item) => {
        if (item.kind === 'section_header') {
          return (
            <LearningPathSectionBar
              key={`section-${item.sectionId}`}
              item={item}
              onJournalPress={onJournalPress}
            />
          );
        }
        return (
          <View key={item.id}>
            <LearningPathNodeView item={item} onPress={onNodePress} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl * 2,
  },
});
