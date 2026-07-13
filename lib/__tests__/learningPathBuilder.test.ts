import {
  buildLearningPath,
  lessonNodeIdsForSection,
  pickCurrentLessonId,
} from '@/lib/roadmap/learningPathBuilder';
import type { RoadmapLessonRow, RoadmapNodeRow } from '@/types/roadmap.types';

const sectionA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const sectionB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const lesson1 = '11111111-1111-1111-1111-111111111111';
const lesson2 = '22222222-2222-2222-2222-222222222222';
const lesson3 = '33333333-3333-3333-3333-333333333333';
const applied1 = '44444444-4444-4444-4444-444444444444';
const path1 = 'aaaaaaaa-1111-1111-1111-111111111111';
const path2 = 'aaaaaaaa-2222-2222-2222-222222222222';
const path3 = 'aaaaaaaa-3333-3333-3333-333333333333';
const pathApplied = 'aaaaaaaa-4444-4444-4444-444444444444';

function section(id: string, name: string, sectionIndex: number): RoadmapNodeRow {
  return {
    id,
    roadmap_id: 'r1',
    user_id: 'u1',
    type: 'Section',
    name,
    content: {},
    metadata: { sectionIndex },
  };
}

function lesson(
  id: string,
  name: string,
  sectionId: string,
  opts: { lessonIndex: number; sectionIndex: number; applied?: boolean },
): RoadmapNodeRow {
  return {
    id,
    roadmap_id: 'r1',
    user_id: 'u1',
    type: 'Lesson',
    name,
    content: {},
    metadata: {
      sectionId,
      lessonIndex: opts.lessonIndex,
      sectionIndex: opts.sectionIndex,
      ...(opts.applied ? { isAppliedLesson: true } : {}),
    },
  };
}

function pathRow(
  id: string,
  nodeId: string,
  pathOrder: number,
  status: RoadmapLessonRow['status'],
  name: string,
): RoadmapLessonRow {
  return {
    id,
    roadmap_id: 'r1',
    node_id: nodeId,
    user_id: 'u1',
    path_order: pathOrder,
    status,
    session_config: { name, hook: `Hook for ${name}`, meaning: `Meaning for ${name}` },
  };
}

describe('learningPathBuilder', () => {
  const nodes: RoadmapNodeRow[] = [
    section(sectionA, 'Rhythm Basics', 0),
    section(sectionB, 'Limb Coordination', 1),
    lesson(lesson1, 'Keeping Time', sectionA, { lessonIndex: 0, sectionIndex: 0 }),
    lesson(lesson2, 'Note Values', sectionA, { lessonIndex: 1, sectionIndex: 0 }),
    lesson(applied1, 'Rhythm Basics', sectionA, {
      lessonIndex: 2,
      sectionIndex: 0,
      applied: true,
    }),
    lesson(lesson3, 'Hand Techniques', sectionB, { lessonIndex: 0, sectionIndex: 1 }),
  ];

  const lessons: RoadmapLessonRow[] = [
    pathRow(path1, lesson1, 0, 'pending_content', 'Keeping Time'),
    pathRow(path2, lesson2, 1, 'pending_content', 'Note Values'),
    pathRow(pathApplied, applied1, 2, 'pending_content', 'Rhythm Basics'),
    pathRow(path3, lesson3, 3, 'pending_content', 'Hand Techniques'),
  ];

  it('groups by section and orders by path_order', () => {
    const items = buildLearningPath({ nodes, lessons });
    const headers = items.filter((i) => i.kind === 'section_header');
    expect(headers).toHaveLength(2);
    expect(headers[0]).toMatchObject({
      name: 'Rhythm Basics',
      completedLessons: 0,
      totalLessons: 2,
      activeLessons: 2,
    });
    expect(headers[1]).toMatchObject({
      name: 'Limb Coordination',
      totalLessons: 1,
    });

    const labels = items
      .filter((i) => i.kind === 'path_node')
      .map((i) => (i.kind === 'path_node' ? i.label : ''));
    expect(labels).toEqual([
      'Keeping Time',
      'Note Values',
      'Rhythm Basics',
      'Section Review',
      'Hand Techniques',
      'Section Review',
    ]);
  });

  it('marks first incomplete regular lesson as current', () => {
    const items = buildLearningPath({ nodes, lessons });
    const current = items.filter(
      (i) => i.kind === 'path_node' && i.visualState === 'current',
    );
    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({
      kind: 'path_node',
      label: 'Keeping Time',
      nodeKind: 'lesson',
    });
  });

  it('prefers in_progress as current over earlier pending', () => {
    const withProgress: RoadmapLessonRow[] = [
      pathRow(path1, lesson1, 0, 'pending_content', 'Keeping Time'),
      pathRow(path2, lesson2, 1, 'in_progress', 'Note Values'),
      pathRow(pathApplied, applied1, 2, 'pending_content', 'Rhythm Basics'),
      pathRow(path3, lesson3, 3, 'pending_content', 'Hand Techniques'),
    ];
    const items = buildLearningPath({ nodes, lessons: withProgress });
    const current = items.find((i) => i.kind === 'path_node' && i.visualState === 'current');
    expect(current).toMatchObject({ label: 'Note Values' });
  });

  it('marks completed lessons and inserts locked section reviews', () => {
    const withDone: RoadmapLessonRow[] = [
      pathRow(path1, lesson1, 0, 'completed', 'Keeping Time'),
      pathRow(path2, lesson2, 1, 'pending_content', 'Note Values'),
      pathRow(pathApplied, applied1, 2, 'pending_content', 'Rhythm Basics'),
      pathRow(path3, lesson3, 3, 'pending_content', 'Hand Techniques'),
    ];
    const items = buildLearningPath({ nodes, lessons: withDone });
    const keeping = items.find(
      (i) => i.kind === 'path_node' && i.label === 'Keeping Time',
    );
    expect(keeping).toMatchObject({ visualState: 'completed' });

    const reviews = items.filter(
      (i) => i.kind === 'path_node' && i.nodeKind === 'section_review',
    );
    expect(reviews).toHaveLength(2);
    expect(reviews.every((r) => r.kind === 'path_node' && r.visualState === 'locked')).toBe(
      true,
    );
    expect(reviews[0]).toMatchObject({ subtitle: '0/2 sessions' });
  });

  it('tags applied lessons with Advanced Lesson subtitle', () => {
    const items = buildLearningPath({ nodes, lessons });
    const applied = items.find(
      (i) => i.kind === 'path_node' && i.nodeKind === 'applied',
    );
    expect(applied).toMatchObject({
      subtitle: 'Advanced Lesson',
      label: 'Rhythm Basics',
    });
  });

  it('excludes applied lessons from section progress totals', () => {
    const items = buildLearningPath({ nodes, lessons });
    const header = items.find(
      (i) => i.kind === 'section_header' && i.sectionId === sectionA,
    );
    expect(header).toMatchObject({ totalLessons: 2, completedLessons: 0, activeLessons: 2 });
  });

  it('excludes skipped lessons from current pick and active totals', () => {
    const withSkipped: RoadmapLessonRow[] = [
      pathRow(path1, lesson1, 0, 'skipped', 'Keeping Time'),
      pathRow(path2, lesson2, 1, 'pending_content', 'Note Values'),
      pathRow(pathApplied, applied1, 2, 'pending_content', 'Rhythm Basics'),
      pathRow(path3, lesson3, 3, 'pending_content', 'Hand Techniques'),
    ];
    const items = buildLearningPath({ nodes, lessons: withSkipped });
    const header = items.find(
      (i) => i.kind === 'section_header' && i.sectionId === sectionA,
    );
    expect(header).toMatchObject({
      totalLessons: 1,
      activeLessons: 1,
      completedLessons: 0,
    });

    const skippedNode = items.find(
      (i) => i.kind === 'path_node' && i.label === 'Keeping Time',
    );
    expect(skippedNode).toMatchObject({ visualState: 'skipped' });

    const current = items.find((i) => i.kind === 'path_node' && i.visualState === 'current');
    expect(current).toMatchObject({ label: 'Note Values' });
  });

  it('pickCurrentLessonId ignores skipped lessons', () => {
    const entries = [
      {
        node: lesson(lesson1, 'Keeping Time', sectionA, {
          lessonIndex: 0,
          sectionIndex: 0,
        }),
        lessonRow: pathRow(path1, lesson1, 0, 'skipped', 'Keeping Time'),
      },
      {
        node: lesson(lesson2, 'Note Values', sectionA, {
          lessonIndex: 1,
          sectionIndex: 0,
        }),
        lessonRow: pathRow(path2, lesson2, 1, 'pending_content', 'Note Values'),
      },
    ];
    expect(pickCurrentLessonId(entries)).toBe(path2);
  });

  it('pickCurrentLessonId ignores applied lessons', () => {
    const entries = [
      {
        node: lesson(applied1, 'Applied', sectionA, {
          lessonIndex: 0,
          sectionIndex: 0,
          applied: true,
        }),
        lessonRow: pathRow(pathApplied, applied1, 0, 'in_progress', 'Applied'),
      },
      {
        node: lesson(lesson1, 'Keeping Time', sectionA, {
          lessonIndex: 1,
          sectionIndex: 0,
        }),
        lessonRow: pathRow(path1, lesson1, 1, 'pending_content', 'Keeping Time'),
      },
    ];
    expect(pickCurrentLessonId(entries)).toBe(path1);
  });

  it('lessonNodeIdsForSection returns regular lesson node ids only', () => {
    expect(lessonNodeIdsForSection(nodes, sectionA).sort()).toEqual(
      [lesson1, lesson2].sort(),
    );
  });
});
