import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';

export type PathNodeKind = 'lesson' | 'applied' | 'section_review';
export type PathNodeVisualState = 'current' | 'available' | 'locked' | 'completed';

export type LearningPathSectionHeader = {
  kind: 'section_header';
  sectionId: string;
  sectionIndex: number;
  name: string;
  completedLessons: number;
  totalLessons: number;
};

export type LearningPathNode = {
  kind: 'path_node';
  nodeKind: PathNodeKind;
  id: string;
  nodeId: string | null;
  /** Section this node belongs to (for Explore Module filters). */
  sectionId: string;
  label: string;
  subtitle?: string;
  visualState: PathNodeVisualState;
  pathOrder: number;
  staggerIndex: number;
  lessonStatus?: RoadmapLessonRow['status'];
  sessionConfig?: {
    name?: string;
    hook?: string;
    meaning?: string;
  };
};

export type LearningPathItem = LearningPathSectionHeader | LearningPathNode;

const STAGGER_PATTERN = [0, 1, 2, 1] as const;

function isAppliedLesson(node: RoadmapNodeRow): boolean {
  return node.metadata.isAppliedLesson === true;
}

function isIncomplete(status: RoadmapLessonRow['status']): boolean {
  return status !== 'completed';
}

/**
 * Pick the current lesson: prefer in_progress, else lowest path_order among
 * incomplete regular (non-applied) lessons.
 */
export function pickCurrentLessonId(
  lessons: Array<{ lessonRow: RoadmapLessonRow; node: RoadmapNodeRow }>,
): string | null {
  const regular = lessons.filter((l) => !isAppliedLesson(l.node) && isIncomplete(l.lessonRow.status));
  if (regular.length === 0) return null;

  const inProgress = regular
    .filter((l) => l.lessonRow.status === 'in_progress')
    .sort((a, b) => a.lessonRow.path_order - b.lessonRow.path_order);
  if (inProgress[0]) return inProgress[0].lessonRow.id;

  const sorted = [...regular].sort((a, b) => a.lessonRow.path_order - b.lessonRow.path_order);
  return sorted[0]?.lessonRow.id ?? null;
}

function visualStateForLesson(
  lessonId: string,
  status: RoadmapLessonRow['status'],
  currentId: string | null,
): PathNodeVisualState {
  if (status === 'completed') return 'completed';
  if (currentId === lessonId) return 'current';
  return 'available';
}

function staggerOffset(index: number): number {
  return STAGGER_PATTERN[index % STAGGER_PATTERN.length] ?? 0;
}

export type BuildLearningPathInput = {
  nodes: RoadmapNodeRow[];
  lessons: RoadmapLessonRow[];
};

/**
 * Build Inspo-style learning path items from Spec 13 roadmap detail.
 * Order: section header → lessons (by path_order) → applied (if any) → locked section review.
 */
export function buildLearningPath(input: BuildLearningPathInput): LearningPathItem[] {
  const sections = input.nodes
    .filter((n) => n.type === 'Section')
    .map((s) => ({
      id: s.id,
      name: s.name,
      sectionIndex: Number(s.metadata.sectionIndex ?? 0),
    }))
    .sort((a, b) => a.sectionIndex - b.sectionIndex);

  const lessonByNodeId = new Map(input.lessons.map((l) => [l.node_id, l]));

  const lessonEntries = input.nodes
    .filter((n) => n.type === 'Lesson')
    .map((node) => {
      const lessonRow = lessonByNodeId.get(node.id);
      if (!lessonRow) return null;
      return { node, lessonRow };
    })
    .filter((e): e is { node: RoadmapNodeRow; lessonRow: RoadmapLessonRow } => e !== null);

  const currentId = pickCurrentLessonId(lessonEntries);
  const items: LearningPathItem[] = [];
  let globalStagger = 0;

  for (const section of sections) {
    const inSection = lessonEntries
      .filter((e) => e.node.metadata.sectionId === section.id)
      .sort((a, b) => a.lessonRow.path_order - b.lessonRow.path_order);

    const regular = inSection.filter((e) => !isAppliedLesson(e.node));
    const applied = inSection.filter((e) => isAppliedLesson(e.node));

    const completedLessons = regular.filter((e) => e.lessonRow.status === 'completed').length;
    const totalLessons = regular.length;

    items.push({
      kind: 'section_header',
      sectionId: section.id,
      sectionIndex: section.sectionIndex,
      name: section.name,
      completedLessons,
      totalLessons,
    });

    for (const entry of regular) {
      items.push({
        kind: 'path_node',
        nodeKind: 'lesson',
        id: entry.lessonRow.id,
        nodeId: entry.node.id,
        sectionId: section.id,
        label: entry.lessonRow.session_config?.name ?? entry.node.name,
        visualState: visualStateForLesson(entry.lessonRow.id, entry.lessonRow.status, currentId),
        pathOrder: entry.lessonRow.path_order,
        staggerIndex: staggerOffset(globalStagger),
        lessonStatus: entry.lessonRow.status,
        sessionConfig: entry.lessonRow.session_config,
      });
      globalStagger += 1;
    }

    for (const entry of applied) {
      items.push({
        kind: 'path_node',
        nodeKind: 'applied',
        id: entry.lessonRow.id,
        nodeId: entry.node.id,
        sectionId: section.id,
        label: entry.lessonRow.session_config?.name ?? entry.node.name,
        subtitle: 'Advanced Lesson',
        visualState: visualStateForLesson(entry.lessonRow.id, entry.lessonRow.status, currentId),
        pathOrder: entry.lessonRow.path_order,
        staggerIndex: staggerOffset(globalStagger),
        lessonStatus: entry.lessonRow.status,
        sessionConfig: entry.lessonRow.session_config,
      });
      globalStagger += 1;
    }

    items.push({
      kind: 'path_node',
      nodeKind: 'section_review',
      id: `section-review-${section.id}`,
      nodeId: null,
      sectionId: section.id,
      label: 'Section Review',
      subtitle: '0/2 sessions',
      visualState: 'locked',
      pathOrder: Number.MAX_SAFE_INTEGER,
      staggerIndex: staggerOffset(globalStagger),
    });
    globalStagger += 1;
  }

  return items;
}

/** Lesson node ids belonging to a section (for Spec 14 journal focus). */
export function lessonNodeIdsForSection(
  nodes: RoadmapNodeRow[],
  sectionId: string,
): string[] {
  return nodes
    .filter(
      (n) =>
        n.type === 'Lesson' &&
        n.metadata.sectionId === sectionId &&
        n.metadata.isAppliedLesson !== true,
    )
    .map((n) => n.id);
}
