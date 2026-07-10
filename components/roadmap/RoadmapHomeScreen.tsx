import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { LearningPathScroll } from '@/components/roadmap/LearningPathScroll';
import { MindMapCanvas } from '@/components/roadmap/MindMapCanvas';
import {
  MindMapSidebar,
  type LinkedLessonItem,
} from '@/components/roadmap/MindMapSidebar';
import {
  RoadmapPathCard,
  type PathMode,
} from '@/components/roadmap/RoadmapPathCard';
import { InlineError } from '@/components/ui/InlineError';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import type { LearningPathNode } from '@/lib/roadmap/learningPathBuilder';
import type { LaidOutNode } from '@/lib/roadmap/mindMapLayout';
import { mindMapColors } from '@/lib/roadmap/mindMapLayout';
import {
  fetchRoadmapDetail,
  fetchUserRoadmaps,
  generateRoadmapMindMap,
} from '@/services/roadmaps';
import type { MindMapNode, RoadmapMindMap, RoadmapNodeRow, RoadmapRow } from '@/types/roadmap.types';

function findNode(root: MindMapNode, id: string): MindMapNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

type RoadmapHomeScreenProps = {
  /** When rendered inside tabs, pass the active roadmap id explicitly. */
  roadmapId?: string;
  /** Prefer over route replace when switching from the tab shell. */
  onRoadmapChange?: (roadmapId: string) => void;
  /** Extra bottom inset for the floating tab bar. */
  contentBottomInset?: number;
};

export function RoadmapHomeScreen({
  roadmapId,
  onRoadmapChange,
  contentBottomInset = 0,
}: RoadmapHomeScreenProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const id = roadmapId ?? routeId;

  const [mode, setMode] = useState<PathMode>('map');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [conceptOpen, setConceptOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [scale, setScale] = useState(1);
  const [mindMap, setMindMap] = useState<RoadmapMindMap | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LearningPathNode | null>(null);
  const generateAttempted = useRef(false);

  const detailQuery = useQuery({
    queryKey: ['roadmap-detail', id],
    queryFn: () => fetchRoadmapDetail(id!),
    enabled: Boolean(id),
  });

  const roadmapsQuery = useQuery({
    queryKey: ['user-roadmaps', user?.id],
    queryFn: () => fetchUserRoadmaps(user!.id),
    enabled: Boolean(user?.id) && switcherOpen,
  });

  const mindMapMutation = useMutation({
    mutationFn: (force?: boolean) => generateRoadmapMindMap(id!, { force }),
    onSuccess: (data) => {
      setMindMap(data.mindMap);
      setSelectedNodeId(data.mindMap.root.id);
      queryClient.invalidateQueries({ queryKey: ['roadmap-detail', id] });
    },
  });

  useEffect(() => {
    const existing = detailQuery.data?.roadmap.mindmap;
    if (existing?.root) {
      setMindMap(existing);
      setSelectedNodeId((prev) => prev ?? existing.root.id);
    }
  }, [detailQuery.data?.roadmap.mindmap]);

  const ensureMindMap = (force = false) => {
    if (!force && mindMap?.root) return;
    if (detailQuery.data?.roadmap.mindmap?.root && !force) {
      setMindMap(detailQuery.data.roadmap.mindmap);
      setSelectedNodeId(detailQuery.data.roadmap.mindmap.root.id);
      return;
    }
    mindMapMutation.mutate(force);
  };

  const openConceptMap = () => {
    setConceptOpen(true);
    ensureMindMap(false);
  };

  const lessonById = useMemo(() => {
    const map = new Map<string, RoadmapNodeRow>();
    for (const node of detailQuery.data?.nodes ?? []) {
      if (node.type === 'Lesson') map.set(node.id, node);
    }
    return map;
  }, [detailQuery.data?.nodes]);

  const lessonStatusByNodeId = useMemo(() => {
    const map = new Map<string, LinkedLessonItem['status']>();
    for (const lesson of detailQuery.data?.lessons ?? []) {
      map.set(lesson.node_id, lesson.status);
    }
    return map;
  }, [detailQuery.data?.lessons]);

  const selectedConcept =
    mindMap && selectedNodeId ? findNode(mindMap.root, selectedNodeId) : null;

  const linkedLessons: LinkedLessonItem[] = useMemo(() => {
    if (!selectedConcept) return [];
    const items: LinkedLessonItem[] = [];
    for (const lessonId of selectedConcept.lessonNodeIds) {
      const node = lessonById.get(lessonId);
      if (!node) continue;
      items.push({
        node,
        status: lessonStatusByNodeId.get(lessonId) ?? 'unknown',
        practiceCount: 0,
      });
    }
    return items;
  }, [selectedConcept, lessonById, lessonStatusByNodeId]);

  if (detailQuery.isLoading) {
    return <BootSpinner />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View style={styles.container}>
        <InlineError message="Couldn't load this roadmap." />
        <Pressable style={styles.secondary} onPress={() => router.replace('/(app)/(tabs)')}>
          <Text style={styles.secondaryText}>Back to tabs</Text>
        </Pressable>
      </View>
    );
  }

  const { roadmap, nodes, lessons } = detailQuery.data;

  const onNodePress = (item: LearningPathNode) => {
    if (item.visualState === 'locked' || item.nodeKind === 'section_review') {
      Alert.alert('Section review', 'Section review unlocks after you finish the lessons.');
      return;
    }
    setSelectedLesson(item);
  };

  const onOpenMenu = () => {
    Alert.alert(roadmap.title, undefined, [
      {
        text: 'Open concept map',
        onPress: () => openConceptMap(),
      },
      {
        text: 'Regenerate concept map',
        onPress: () => {
          generateAttempted.current = true;
          setConceptOpen(true);
          mindMapMutation.mutate(true);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSelectRoadmap = (next: RoadmapRow) => {
    setSwitcherOpen(false);
    if (next.id === id) return;
    if (onRoadmapChange) {
      onRoadmapChange(next.id);
      return;
    }
    router.replace(`/(app)/roadmap/${next.id}` as never);
  };

  return (
    <View style={[styles.container, contentBottomInset > 0 && { paddingBottom: contentBottomInset }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>HobbyFlow</Text>
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Text style={styles.statText}>🔥 0</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statText}>★ 0</Text>
          </View>
        </View>
      </View>

      <RoadmapPathCard
        title={roadmap.title}
        coverUri={null}
        mode={mode}
        onModeChange={setMode}
        onOpenSwitcher={() => setSwitcherOpen(true)}
        onOpenMenu={onOpenMenu}
      />

      {mode === 'map' ? (
        <LearningPathScroll
          nodes={nodes}
          lessons={lessons}
          onNodePress={onNodePress}
          onJournalPress={() => openConceptMap()}
          bottomInset={contentBottomInset}
        />
      ) : (
        <View style={styles.exerciseEmpty} testID="exercise-empty">
          <Text style={styles.exerciseTitle}>Exercises coming soon</Text>
          <Text style={styles.exerciseBody}>
            Practice sessions will appear here after lesson content is ready. No practices are
            created yet.
          </Text>
        </View>
      )}

      <Modal
        visible={selectedLesson !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLesson(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelectedLesson(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{selectedLesson?.label}</Text>
            {selectedLesson?.sessionConfig?.hook ? (
              <Text style={styles.sheetHook}>{selectedLesson.sessionConfig.hook}</Text>
            ) : null}
            {selectedLesson?.sessionConfig?.meaning ? (
              <Text style={styles.sheetMeaning}>{selectedLesson.sessionConfig.meaning}</Text>
            ) : null}
            <Text style={styles.sheetSoon}>
              Lesson content generation coming soon — you can explore the concept map from the
              journal button.
            </Text>
            <Pressable style={styles.secondary} onPress={() => setSelectedLesson(null)}>
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={switcherOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitcherOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSwitcherOpen(false)}>
          <Pressable style={styles.switcher} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Your roadmaps</Text>
            {roadmapsQuery.isLoading ? <ActivityIndicator /> : null}
            {(roadmapsQuery.data ?? []).map((r) => (
              <Pressable
                key={r.id}
                style={[styles.switchRow, r.id === id && styles.switchRowActive]}
                onPress={() => onSelectRoadmap(r)}
              >
                <Text style={styles.switchTitle}>{r.title}</Text>
              </Pressable>
            ))}
            {(roadmapsQuery.data ?? []).length === 0 && !roadmapsQuery.isLoading ? (
              <Text style={styles.exerciseBody}>No other roadmaps yet.</Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={conceptOpen}
        animationType="slide"
        onRequestClose={() => setConceptOpen(false)}
      >
        <View style={styles.conceptModal}>
          <View style={styles.conceptHeader}>
            <Pressable onPress={() => setConceptOpen(false)} hitSlop={8}>
              <Text style={styles.back}>← Close</Text>
            </Pressable>
            <Text style={styles.conceptTitle}>Concept map</Text>
          </View>

          {mindMapMutation.isPending && !mindMap ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={onboardingColors.primaryText} />
              <Text style={styles.mapLoadingText}>Building your concept map…</Text>
            </View>
          ) : null}

          {mindMapMutation.isError && !mindMap ? (
            <View style={styles.mapLoading}>
              <InlineError message="Couldn't generate the concept map." />
              <Pressable style={styles.secondary} onPress={() => mindMapMutation.mutate(true)}>
                <Text style={styles.secondaryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {mindMap ? (
            <>
              <MindMapCanvas
                root={mindMap.root}
                selectedId={selectedNodeId}
                collapsed={collapsed}
                scale={scale}
                onSelect={(node: LaidOutNode) => setSelectedNodeId(node.id)}
                onToggleCollapse={(nodeId) => {
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (next.has(nodeId)) next.delete(nodeId);
                    else next.add(nodeId);
                    return next;
                  });
                }}
              />
              <View style={styles.zoomBar}>
                <Pressable style={styles.zoomBtn} onPress={() => setScale(1)}>
                  <Text style={styles.zoomBtnText}>⊡</Text>
                </Pressable>
                <Pressable
                  style={styles.zoomBtn}
                  onPress={() => setScale((s) => Math.min(1.6, Number((s + 0.15).toFixed(2))))}
                >
                  <Text style={styles.zoomBtnText}>+</Text>
                </Pressable>
                <Pressable
                  style={styles.zoomBtn}
                  onPress={() => setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))))}
                >
                  <Text style={styles.zoomBtnText}>−</Text>
                </Pressable>
              </View>
              <MindMapSidebar
                title={selectedConcept?.label ?? mindMap.root.label}
                linkedLessons={linkedLessons}
                totalLinked={selectedConcept?.lessonNodeIds.length ?? 0}
              />
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statPill: {
    backgroundColor: mindMapColors.statusPill,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statText: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseEmpty: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  exerciseTitle: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  exerciseBody: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: {
    color: onboardingColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sheetHook: {
    color: onboardingColors.text,
    fontSize: 14,
    fontStyle: 'italic',
  },
  sheetMeaning: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  sheetSoon: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  switcher: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    gap: spacing.sm,
    margin: spacing.lg,
    marginTop: 'auto',
    marginBottom: 'auto',
    maxHeight: '70%',
    padding: spacing.lg,
  },
  switchRow: {
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
  },
  switchRowActive: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  switchTitle: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  conceptModal: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    paddingTop: spacing.md,
  },
  conceptHeader: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  back: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  conceptTitle: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  mapLoading: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mapLoadingText: {
    color: onboardingColors.textMuted,
    fontSize: 14,
  },
  zoomBar: {
    bottom: 332,
    gap: 6,
    position: 'absolute',
    right: 12,
    zIndex: 2,
  },
  zoomBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  zoomBtnText: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  secondary: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    color: onboardingColors.text,
    fontWeight: '700',
  },
});
