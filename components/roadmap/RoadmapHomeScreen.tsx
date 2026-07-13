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
import { ExercisePane } from '@/components/roadmap/ExercisePane';
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
  type LearningPathSectionHeader,
} from '@/lib/roadmap/learningPathBuilder';
import type { LaidOutNode } from '@/lib/roadmap/mindMapLayout';
import { mindMapColors } from '@/lib/roadmap/mindMapLayout';
import { listExercises } from '@/services/exercises';
import {
  fetchRoadmapDetail,
  fetchUserRoadmaps,
  generateLesson,
  generateRoadmapMindMap,
  markLessonCompleted,
  markLessonSkipped,
  regenerateSection,
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
  const [exerciseSectionId, setExerciseSectionId] = useState<string | null>(null);
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

  const exercisesQuery = useQuery({
    queryKey: ['roadmap-exercises', id, 'all'],
    queryFn: () => listExercises(id!),
    enabled: Boolean(id),
  });

  const practiceCountByNodeId = useMemo(() => {
    const map = new Map<string, number>();
    const lessons = detailQuery.data?.lessons ?? [];
    const lessonIdToNode = new Map(lessons.map((l) => [l.id, l.node_id]));
    for (const ex of exercisesQuery.data?.exercises ?? []) {
      const nodeId = lessonIdToNode.get(ex.lesson_id);
      if (!nodeId) continue;
      map.set(nodeId, (map.get(nodeId) ?? 0) + 1);
    }
    return map;
  }, [detailQuery.data?.lessons, exercisesQuery.data?.exercises]);

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
    mutationFn: ({
      lessonId,
      force,
      rewriteSession,
    }: {
      lessonId: string;
      force?: boolean;
      rewriteSession?: boolean;
    }) =>
      generateLesson(id!, lessonId, {
        force: force || rewriteSession ? true : undefined,
        rewriteSession: rewriteSession || undefined,
      }),
    onSuccess: async (result, variables) => {
      setGenerateError(null);
      await queryClient.invalidateQueries({ queryKey: ['roadmap-detail', id] });
      const detail = queryClient.getQueryData(['roadmap-detail', id]) as
        | { lessons?: Array<{ id: string; session_config?: { name?: string; hook?: string; meaning?: string } }> }
        | undefined;
      const refreshed = detail?.lessons?.find((l) => l.id === variables.lessonId);
      if (refreshed && selectedLesson?.id === variables.lessonId) {
        setSelectedLesson((prev) =>
          prev
            ? {
                ...prev,
                label: refreshed.session_config?.name ?? prev.label,
                sessionConfig: refreshed.session_config ?? prev.sessionConfig,
              }
            : prev,
        );
      }
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

  const regenerateSectionMutation = useMutation({
    mutationFn: async (section: LearningPathSectionHeader) => {
      const outline = await regenerateSection(id!, section.sectionId, {
        regenerateContent: false,
      });
      // Rebuild multimedia for each rewritten lesson (sequential so we don't stampede APIs).
      for (const lessonId of outline.lessonIds) {
        await generateLesson(id!, lessonId, { force: true });
      }
      return outline;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roadmap-detail', id] });
      showAlert('Section updated', 'Titles and lesson content were regenerated.');
    },
    onError: (error: Error) => {
      showAlert('Couldn’t regenerate section', error.message || 'Please try again.');
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
        practiceCount: practiceCountByNodeId.get(lessonId) ?? 0,
      });
    }
    return items;
  }, [selectedConcept, lessonById, lessonStatusByNodeId, practiceCountByNodeId]);

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
    skipLessonMutation.isPending ||
    regenerateSectionMutation.isPending;

  const onNodePress = (item: LearningPathNode) => {
    if (item.nodeKind === 'practice') {
      setExerciseSectionId(item.sectionId);
      setMode('exercise');
      return;
    }
    if (item.visualState === 'locked') {
      showAlert('Locked', 'This item is not available yet.');
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

  const onRegenerateMedia = () => {
    if (!selectedLesson || isSkipped) return;
    showAlert(
      'Regenerate media?',
      'Keeps this lesson title and rebuilds text, images, video, and audio.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate media',
          onPress: () => {
            setGenerateError(null);
            generateLessonMutation.mutate({ lessonId: selectedLesson.id, force: true });
          },
        },
      ],
    );
  };

  const onRegenerateWholeLesson = () => {
    if (!selectedLesson || isSkipped) return;
    showAlert(
      'Regenerate whole lesson?',
      'Rewrites the title, hook, and meaning, then rebuilds all lesson content and media.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate lesson',
          onPress: () => {
            setGenerateError(null);
            generateLessonMutation.mutate({
              lessonId: selectedLesson.id,
              force: true,
              rewriteSession: true,
            });
          },
        },
      ],
    );
  };

  const onRegenerateSection = (section: LearningPathSectionHeader) => {
    if (regenerateSectionMutation.isPending) return;
    showAlert(
      'Regenerate section?',
      `Rewrites “${section.name}” and its lesson titles, then rebuilds each lesson’s content. This can take a few minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate section',
          onPress: () => regenerateSectionMutation.mutate(section),
        },
      ],
    );
  };

  const onSectionMenu = (section: LearningPathSectionHeader) => {
    showAlert(section.name, undefined, [
      {
        text: 'Open concept map',
        onPress: () => openConceptMap(),
      },
      {
        text: 'Regenerate section',
        onPress: () => onRegenerateSection(section),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
          onSectionMenu={onSectionMenu}
          listRef={sessionsListRef}
          bottomInset={contentBottomInset}
          header={
            <RoadmapPathCard
              title={roadmap.title}
              subtitle={moduleSubtitle}
              completedLessons={pathProgress.completed}
              totalLessons={pathProgress.total}
              mode={mode}
              onModeChange={(next) => {
                if (next === 'exercise') setExerciseSectionId(null);
                setMode(next);
              }}
              onOpenSwitcher={() => setSwitcherOpen(true)}
              onOpenMenu={onOpenMenu}
              onViewSessions={scrollToSessions}
            />
          }
        />
      ) : (
        <ExercisePane
          roadmapId={roadmap.id}
          nodes={nodes}
          lessons={lessons}
          sectionFilterId={exerciseSectionId}
          bottomInset={contentBottomInset}
          header={
            <RoadmapPathCard
              title={roadmap.title}
              subtitle={moduleSubtitle}
              completedLessons={pathProgress.completed}
              totalLessons={pathProgress.total}
              mode={mode}
              onModeChange={(next) => {
                if (next === 'map') setExerciseSectionId(null);
                setMode(next);
              }}
              onOpenSwitcher={() => setSwitcherOpen(true)}
              onOpenMenu={onOpenMenu}
              onViewSessions={() => {
                setExerciseSectionId(null);
                setMode('map');
              }}
            />
          }
        />
      )}

      <BottomSheetOrModal
        visible={selectedLesson !== null && !playerOpen}
        onClose={() => setSelectedLesson(null)}
        sheetStyle={styles.sheet}
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{selectedLesson?.label}</Text>
        {selectedLesson?.sessionConfig?.hook ? (
          <Text style={styles.sheetHook}>{selectedLesson.sessionConfig.hook}</Text>
        ) : null}
        {selectedLesson?.sessionConfig?.meaning ? (
          <Text style={styles.sheetMeaning}>{selectedLesson.sessionConfig.meaning}</Text>
        ) : null}
        <Text style={styles.sheetStatus} testID="lesson-sheet-body">
          {isSkipped
            ? 'You skipped this lesson. It no longer counts toward section progress.'
            : generateLessonMutation.isPending || selectedLessonStatus === 'generating'
              ? 'Building your lesson with text, images, video, and audio…'
              : needsGenerate
                ? 'Generate this lesson to unlock text, images, video, and audio.'
                : 'Lesson ready — text, images, video, and audio included.'}
        </Text>
        {generateError ? <InlineError message={generateError} /> : null}
        {regenerateSectionMutation.isPending ? (
          <Text style={styles.sheetStatus}>Regenerating section…</Text>
        ) : null}
        {isSkipped ? null : generateLessonMutation.isPending ||
          selectedLessonStatus === 'generating' ? (
          <View style={styles.generatingRow}>
            <ActivityIndicator color={onboardingColors.primaryText} />
            <Text style={styles.sheetMeaning}>This can take up to a minute.</Text>
          </View>
        ) : (
          <View style={styles.sheetActions}>
            <Pressable
              style={styles.primaryCta}
              onPress={onGenerateOrStart}
              testID="lesson-generate-cta"
              disabled={sheetBusy}
            >
              <Text style={styles.primaryCtaText}>
                {canStart
                  ? selectedLessonStatus === 'completed'
                    ? 'Review lesson'
                    : 'Start lesson'
                  : selectedLessonStatus === 'failed'
                    ? 'Retry generate'
                    : 'Generate lesson'}
              </Text>
            </Pressable>
            {canRegenerate ? (
              <>
                <Pressable
                  style={styles.secondary}
                  onPress={onRegenerateMedia}
                  testID="lesson-regenerate-media-cta"
                  disabled={sheetBusy}
                >
                  <Text style={styles.secondaryText}>Regenerate media</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={onRegenerateWholeLesson}
                  testID="lesson-regenerate-whole-cta"
                  disabled={sheetBusy}
                >
                  <Text style={styles.secondaryText}>Regenerate whole lesson</Text>
                </Pressable>
              </>
            ) : null}
            {!sheetBusy ? (
              <Pressable
                style={styles.skipLink}
                onPress={onSkipLesson}
                testID="lesson-skip-cta"
              >
                <Text style={styles.skipLinkText}>Skip lesson</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        <Pressable
          style={styles.closeBtn}
          onPress={() => setSelectedLesson(null)}
          testID="lesson-close-cta"
        >
          <Text style={styles.closeBtnText}>Close</Text>
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
  exerciseBody: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: onboardingColors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
  },
  sheetTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    textAlign: 'center',
  },
  sheetHook: {
    color: onboardingColors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  sheetMeaning: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetStatus: {
    color: onboardingColors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  sheetActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  generatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: onboardingColors.text,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
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
  secondary: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  secondaryText: {
    color: onboardingColors.text,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipLinkText: {
    color: '#C04545',
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  closeBtn: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: spacing.xs,
    opacity: 0.85,
    paddingVertical: spacing.md,
  },
  closeBtnText: {
    color: onboardingColors.textMuted,
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
});
