import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { LearningPathScroll } from '@/components/roadmap/LearningPathScroll';
import { LessonPlayerScreen } from '@/components/roadmap/LessonPlayerScreen';
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
import { fonts, radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { showAlert } from '@/store/useAlertStore';
import {
  buildLearningPath,
  type LearningPathNode,
} from '@/lib/roadmap/learningPathBuilder';
import type { LaidOutNode } from '@/lib/roadmap/mindMapLayout';
import { mindMapColors } from '@/lib/roadmap/mindMapLayout';
import {
  fetchRoadmapDetail,
  fetchUserRoadmaps,
  generateLesson,
  generateRoadmapMindMap,
  markLessonCompleted,
  markLessonSkipped,
} from '@/services/roadmaps';
import type { LessonNodeContent } from '@/types/lessonContent.types';
import type { MindMapNode, RoadmapMindMap, RoadmapNodeRow, RoadmapRow } from '@/types/roadmap.types';
import { useGamificationStore } from '@/store/useGamificationStore';

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
  /** Hide brand + streak pills when a parent already shows chrome (detail stack). */
  showBrandBar?: boolean;
};

export function RoadmapHomeScreen({
  roadmapId,
  onRoadmapChange,
  contentBottomInset = 0,
  showBrandBar = true,
}: RoadmapHomeScreenProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const id = roadmapId ?? routeId;

  const [mode, setMode] = useState<PathMode>('map');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [conceptOpen, setConceptOpen] = useState(false);
  const [conceptEarlyAccess, setConceptEarlyAccess] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [scale, setScale] = useState(1);
  const [mindMap, setMindMap] = useState<RoadmapMindMap | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LearningPathNode | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const generateAttempted = useRef(false);
  const sessionsListRef = useRef<ScrollView>(null);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const rating = useGamificationStore((s) => s.rating);
  const onLessonCompleted = useGamificationStore((s) => s.onLessonCompleted);

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

  const generateLessonMutation = useMutation({
    mutationFn: ({ lessonId, force }: { lessonId: string; force?: boolean }) =>
      generateLesson(id!, lessonId, force ? { force: true } : undefined),
    onSuccess: async (result) => {
      setGenerateError(null);
      await queryClient.invalidateQueries({ queryKey: ['roadmap-detail', id] });
      if (result.status === 'success') {
        setPlayerOpen(true);
      } else if (result.status === 'failed') {
        setGenerateError(result.error?.message ?? 'Lesson generation failed');
      }
    },
    onError: (error: Error) => {
      setGenerateError(error.message || 'Lesson generation failed');
    },
  });

  const skipLessonMutation = useMutation({
    mutationFn: (lessonId: string) => markLessonSkipped(lessonId),
    onSuccess: async (ok) => {
      if (!ok) {
        showAlert('Couldn’t skip', 'Please try again in a moment.');
        return;
      }
      setSelectedLesson(null);
      await queryClient.invalidateQueries({ queryKey: ['roadmap-detail', id] });
    },
    onError: () => {
      showAlert('Couldn’t skip', 'Please try again in a moment.');
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
    if (conceptEarlyAccess) {
      ensureMindMap(false);
    }
  };

  const enterConceptEarlyAccess = () => {
    setConceptEarlyAccess(true);
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

  const pathProgress = useMemo(() => {
    const detail = detailQuery.data;
    if (!detail) return { completed: 0, total: 0 };
    const pathItems = buildLearningPath({ nodes: detail.nodes, lessons: detail.lessons });
    const headers = pathItems.filter(
      (i): i is Extract<(typeof pathItems)[number], { kind: 'section_header' }> =>
        i.kind === 'section_header',
    );
    return {
      completed: headers.reduce((sum, h) => sum + h.completedLessons, 0),
      total: headers.reduce((sum, h) => sum + h.totalLessons, 0),
    };
  }, [detailQuery.data]);

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

  const selectedLessonRow = selectedLesson
    ? lessons.find((l) => l.id === selectedLesson.id)
    : undefined;
  const selectedLessonStatus =
    selectedLessonRow?.status ?? selectedLesson?.lessonStatus ?? 'pending_content';
  const selectedNodeContent = selectedLesson?.nodeId
    ? (lessonById.get(selectedLesson.nodeId)?.content as LessonNodeContent | undefined)
    : undefined;
  const hasGeneratedPages = Boolean(
    selectedNodeContent &&
      Array.isArray(selectedNodeContent.pages) &&
      selectedNodeContent.pages.length > 0,
  );
  const isSkipped = selectedLessonStatus === 'skipped';
  const canRegenerate =
    selectedLessonStatus === 'ready' ||
    selectedLessonStatus === 'in_progress' ||
    selectedLessonStatus === 'completed' ||
    selectedLessonStatus === 'failed';
  const canStart =
    !isSkipped &&
    hasGeneratedPages &&
    (selectedLessonStatus === 'ready' ||
      selectedLessonStatus === 'in_progress' ||
      selectedLessonStatus === 'completed');
  const needsGenerate =
    !isSkipped &&
    (selectedLessonStatus === 'pending_content' ||
      selectedLessonStatus === 'failed' ||
      (!hasGeneratedPages && selectedLessonStatus !== 'generating'));
  const sheetBusy =
    generateLessonMutation.isPending ||
    selectedLessonStatus === 'generating' ||
    skipLessonMutation.isPending;

  const onNodePress = (item: LearningPathNode) => {
    if (item.visualState === 'locked' || item.nodeKind === 'section_review') {
      showAlert('Section review', 'Section review unlocks after you finish the lessons.');
      return;
    }
    setGenerateError(null);
    setPlayerOpen(false);
    setSelectedLesson(item);
  };

  const onGenerateOrStart = () => {
    if (!selectedLesson || isSkipped) return;
    if (canStart) {
      setPlayerOpen(true);
      return;
    }
    generateLessonMutation.mutate({ lessonId: selectedLesson.id });
  };

  const onRegenerateLesson = () => {
    if (!selectedLesson || isSkipped) return;
    showAlert(
      'Regenerate lesson?',
      'This rebuilds text, images, video, and audio for this lesson.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: () => {
            setGenerateError(null);
            generateLessonMutation.mutate({ lessonId: selectedLesson.id, force: true });
          },
        },
      ],
    );
  };

  const onSkipLesson = () => {
    if (!selectedLesson || isSkipped) return;
    showAlert(
      'Skip this lesson?',
      'It will be struck out of your path and won’t count toward progress. You can still open it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip lesson',
          style: 'destructive',
          onPress: () => {
            skipLessonMutation.mutate(selectedLesson.id);
          },
        },
      ],
    );
  };
  const onOpenMenu = () => {
    showAlert(roadmap.title, undefined, [
      {
        text: 'Open concept map',
        onPress: () => openConceptMap(),
      },
      {
        text: 'Regenerate concept map',
        onPress: () => {
          generateAttempted.current = true;
          setConceptEarlyAccess(true);
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

  const scrollToSessions = () => {
    setMode('map');
    // Drop past the featured module card into the session list.
    requestAnimationFrame(() => {
      sessionsListRef.current?.scrollTo({ y: 360, animated: true });
    });
  };

  const moduleSubtitle =
    typeof roadmap.intro?.intro === 'string' && roadmap.intro.intro.trim().length > 0
      ? roadmap.intro.intro.trim().slice(0, 48)
      : 'Your learning path';

  return (
    <View
      style={[
        styles.container,
        contentBottomInset > 0 && { paddingBottom: contentBottomInset },
        !showBrandBar && { paddingTop: spacing.xs },
      ]}
    >
      {showBrandBar ? (
        <View style={styles.topBar}>
          <Text style={styles.brand}>HobbyFlow</Text>
          <View style={styles.stats}>
            <View style={styles.statPill}>
              <Text style={styles.statText}>🔥 {currentStreak}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statText}>★ {rating}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {mode === 'map' ? (
        <LearningPathScroll
          nodes={nodes}
          lessons={lessons}
          onNodePress={onNodePress}
          onJournalPress={() => openConceptMap()}
          listRef={sessionsListRef}
          bottomInset={contentBottomInset}
          header={
            <RoadmapPathCard
              title={roadmap.title}
              subtitle={moduleSubtitle}
              completedLessons={pathProgress.completed}
              totalLessons={pathProgress.total}
              mode={mode}
              onModeChange={setMode}
              onOpenSwitcher={() => setSwitcherOpen(true)}
              onOpenMenu={onOpenMenu}
              onViewSessions={scrollToSessions}
            />
          }
        />
      ) : (
        <View style={styles.exercisePane}>
          <RoadmapPathCard
            title={roadmap.title}
            subtitle={moduleSubtitle}
            completedLessons={pathProgress.completed}
            totalLessons={pathProgress.total}
            mode={mode}
            onModeChange={setMode}
            onOpenSwitcher={() => setSwitcherOpen(true)}
            onOpenMenu={onOpenMenu}
            onViewSessions={() => setMode('map')}
          />
          <View style={styles.exerciseEmpty} testID="exercise-empty">
            <Text style={styles.exerciseTitle}>Exercises coming soon</Text>
            <Text style={styles.exerciseBody}>
              Practice sessions will appear here after lesson content is ready. No practices are
              created yet.
            </Text>
          </View>
        </View>
      )}

      <BottomSheetOrModal
        visible={selectedLesson !== null && !playerOpen}
        onClose={() => setSelectedLesson(null)}
        sheetStyle={styles.sheet}
      >
        <Text style={styles.sheetTitle}>{selectedLesson?.label}</Text>
        {selectedLesson?.sessionConfig?.hook ? (
          <Text style={styles.sheetHook}>{selectedLesson.sessionConfig.hook}</Text>
        ) : null}
        {selectedLesson?.sessionConfig?.meaning ? (
          <Text style={styles.sheetMeaning}>{selectedLesson.sessionConfig.meaning}</Text>
        ) : null}
        <Text style={styles.sheetSoon} testID="lesson-sheet-body">
          {isSkipped
            ? 'You skipped this lesson. It no longer counts toward section progress.'
            : generateLessonMutation.isPending || selectedLessonStatus === 'generating'
              ? 'Building your lesson with text, images, video, and audio…'
              : needsGenerate
                ? 'This lesson will be generated when you start it.'
                : 'Your lesson is ready — text, images, video, and audio included.'}
        </Text>
        {generateError ? <InlineError message={generateError} /> : null}
        {isSkipped ? null : generateLessonMutation.isPending ||
          selectedLessonStatus === 'generating' ? (
          <View style={styles.generatingRow}>
            <ActivityIndicator color={onboardingColors.primaryText} />
            <Text style={styles.sheetMeaning}>This can take up to a minute.</Text>
          </View>
        ) : (
          <Pressable
            style={styles.primaryCta}
            onPress={onGenerateOrStart}
            testID="lesson-generate-cta"
            disabled={sheetBusy}
          >
            <Text style={styles.primaryCtaText}>
              {canStart
                ? selectedLessonStatus === 'completed'
                  ? 'REVIEW LESSON'
                  : 'START LESSON'
                : selectedLessonStatus === 'failed'
                  ? 'RETRY GENERATE'
                  : 'GENERATE AND JUMP AHEAD'}
            </Text>
          </Pressable>
        )}
        {!isSkipped && canRegenerate && !generateLessonMutation.isPending ? (
          <Pressable
            style={styles.secondary}
            onPress={onRegenerateLesson}
            testID="lesson-regenerate-cta"
            disabled={sheetBusy}
          >
            <Text style={styles.secondaryText}>Regenerate content</Text>
          </Pressable>
        ) : null}
        {!isSkipped && !sheetBusy ? (
          <Pressable
            style={styles.destructiveBtn}
            onPress={onSkipLesson}
            testID="lesson-skip-cta"
          >
            <Text style={styles.destructiveBtnText}>Skip lesson</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondary} onPress={() => setSelectedLesson(null)}>
          <Text style={styles.secondaryText}>Close</Text>
        </Pressable>
      </BottomSheetOrModal>

      <BottomSheetOrModal
        visible={playerOpen && selectedLesson !== null}
        onClose={() => setPlayerOpen(false)}
        presentation="fullscreen"
      >
        {selectedNodeContent &&
        Array.isArray(selectedNodeContent.pages) &&
        selectedNodeContent.pages.length > 0 ? (
          <LessonPlayerScreen
            title={selectedLesson?.label ?? 'Lesson'}
            content={selectedNodeContent}
            onClose={() => {
              const lessonId = selectedLesson?.id;
              const hobbyId = roadmap.hobby_id;
              setPlayerOpen(false);
              setSelectedLesson(null);
              if (lessonId && selectedLessonStatus !== 'completed') {
                void markLessonCompleted(lessonId).then((ok) => {
                  if (ok) {
                    void queryClient.invalidateQueries({ queryKey: ['roadmap-detail', id] });
                    void onLessonCompleted(hobbyId);
                  }
                });
              }
            }}
          />
        ) : (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={onboardingColors.primaryText} />
            <Text style={styles.mapLoadingText}>Opening your lesson…</Text>
          </View>
        )}
      </BottomSheetOrModal>

      <BottomSheetOrModal
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        animationType="fade"
        maxHeight="70%"
        sheetStyle={styles.switcher}
      >
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
      </BottomSheetOrModal>

      <BottomSheetOrModal
        visible={conceptOpen}
        onClose={() => setConceptOpen(false)}
        presentation="fullscreen"
      >
        <View style={styles.conceptModal}>
          <View style={styles.conceptHeader}>
            <Pressable onPress={() => setConceptOpen(false)} hitSlop={8}>
              <Text style={styles.back}>← Close</Text>
            </Pressable>
            <View style={styles.conceptTitleRow}>
              <Text style={styles.conceptTitle}>Concept map</Text>
              <View style={styles.betaBadge}>
                <Text style={styles.betaBadgeText}>BETA</Text>
              </View>
            </View>
          </View>

          {!conceptEarlyAccess ? (
            <View style={styles.earlyAccess}>
              <View style={styles.earlyAccessBadge}>
                <Text style={styles.earlyAccessBadgeText}>BETA</Text>
              </View>
              <Text style={styles.earlyAccessTitle}>Concept map is in beta</Text>
              <Text style={styles.earlyAccessBody}>
                Explore an early preview of how ideas in your roadmap connect. Layout and
                details may still change.
              </Text>
              <Pressable
                style={styles.earlyAccessCta}
                onPress={enterConceptEarlyAccess}
                accessibilityRole="button"
                accessibilityLabel="See early access"
              >
                <Text style={styles.earlyAccessCtaText}>See early access</Text>
              </Pressable>
            </View>
          ) : (
            <>
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
            </>
          )}
        </View>
      </BottomSheetOrModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 22,
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
  exercisePane: {
    flex: 1,
    gap: spacing.md,
  },
  exerciseEmpty: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  exerciseTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 18,
    textAlign: 'center',
  },
  exerciseBody: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
  },
  sheetTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 20,
  },
  sheetHook: {
    color: onboardingColors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: 'italic',
  },
  sheetMeaning: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  sheetSoon: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  generatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.text,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  switcher: {
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  conceptTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm,
  },
  conceptTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  betaBadge: {
    borderColor: '#22C55E',
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  betaBadgeText: {
    color: '#16A34A',
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  earlyAccess: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  earlyAccessBadge: {
    borderColor: '#22C55E',
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  earlyAccessBadgeText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  earlyAccessTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    textAlign: 'center',
  },
  earlyAccessBody: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  earlyAccessCta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primaryText,
    borderRadius: radii.card,
    minWidth: 200,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  earlyAccessCtaText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 16,
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
    fontFamily: fonts.body,
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
  destructiveBtn: {
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  destructiveBtnText: {
    color: '#B91C1C',
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '700',
  },
});
