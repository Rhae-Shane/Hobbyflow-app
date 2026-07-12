import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LearningPathNodeView } from '@/components/roadmap/LearningPathNodeView';
import { LearningPathSectionBar } from '@/components/roadmap/LearningPathSectionBar';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { radii, spacing } from '@/constants/tokens';
import {
  buildLearningPath,
  type LearningPathNode,
  type LearningPathSectionHeader,
} from '@/lib/roadmap/learningPathBuilder';
import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';

type Props = {
  nodes: RoadmapNodeRow[];
  lessons: RoadmapLessonRow[];
  onNodePress: (item: LearningPathNode) => void;
  onJournalPress?: (sectionId: string) => void;
  /** Optional featured module card rendered below search. */
  header?: ReactNode;
  bottomInset?: number;
  listRef?: RefObject<ScrollView | null>;
};

type SectionGroup = {
  header: LearningPathSectionHeader;
  lessons: LearningPathNode[];
};

export function LearningPathScroll({
  nodes,
  lessons,
  onNodePress,
  onJournalPress,
  header,
  bottomInset = 0,
  listRef,
}: Props) {
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const didInitExpand = useRef(false);
  const internalRef = useRef<ScrollView>(null);
  const scrollRef = listRef ?? internalRef;

  const items = useMemo(() => buildLearningPath({ nodes, lessons }), [nodes, lessons]);

  const groups = useMemo(() => {
    const result: SectionGroup[] = [];
    let current: SectionGroup | null = null;

    for (const item of items) {
      if (item.kind === 'section_header') {
        current = { header: item, lessons: [] };
        result.push(current);
        continue;
      }
      if (current) current.lessons.push(item);
    }
    return result;
  }, [items]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((group) => ({
        ...group,
        lessons: group.lessons.filter(
          (node) =>
            node.label.toLowerCase().includes(q) ||
            (node.subtitle?.toLowerCase().includes(q) ?? false) ||
            group.header.name.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.lessons.length > 0 || group.header.name.toLowerCase().includes(q));
  }, [groups, query]);

  // Open the section that contains the current lesson (once), or the first section.
  useEffect(() => {
    if (didInitExpand.current || groups.length === 0) return;
    didInitExpand.current = true;
    const withCurrent = groups.find((g) =>
      g.lessons.some((l) => l.visualState === 'current'),
    );
    const initialId = withCurrent?.header.sectionId ?? groups[0]?.header.sectionId;
    if (initialId) setExpandedIds(new Set([initialId]));
  }, [groups]);

  // While searching, keep matching sections open.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    setExpandedIds(new Set(filteredGroups.map((g) => g.header.sectionId)));
  }, [query, filteredGroups]);

  const toggleSection = (sectionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl * 2 + bottomInset }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID="learning-path-scroll"
    >
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={onboardingColors.textMuted}
          style={styles.searchInput}
          testID="session-search"
          accessibilityLabel="Search sessions"
        />
      </View>

      {header}

      <View style={styles.list} testID="session-list">
        {filteredGroups.map((group) => {
          const expanded = expandedIds.has(group.header.sectionId);
          return (
            <View
              key={group.header.sectionId}
              style={styles.sectionBlock}
              testID={`section-dropdown-${group.header.sectionId}`}
            >
              <LearningPathSectionBar
                item={group.header}
                expanded={expanded}
                onToggle={toggleSection}
                onJournalPress={onJournalPress}
              />
              {expanded ? (
                <View style={styles.lessonList}>
                  {group.lessons.map((item, index) => (
                    <LearningPathNodeView
                      key={item.id}
                      item={item}
                      sessionIndex={index + 1}
                      onPress={onNodePress}
                    />
                  ))}
                  {group.lessons.length === 0 ? (
                    <Text style={styles.emptyNested}>No lessons in this section.</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
        {filteredGroups.length === 0 ? (
          <Text style={styles.empty}>No sessions match your search.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  searchIcon: {
    color: onboardingColors.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  list: {
    gap: spacing.sm,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  lessonList: {
    gap: 0,
    paddingLeft: spacing.sm,
    paddingTop: spacing.xs,
  },
  empty: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  emptyNested: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
