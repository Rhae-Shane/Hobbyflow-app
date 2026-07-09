import type { Technique } from '@/types/plan.types';
import {
  getActiveTechniques,
  getMasteredCount,
  getTodaysFocus,
  usePlanStore,
} from '@/store/usePlanStore';

jest.mock('@/services/userState', () => ({
  upsertUserPlan: jest.fn().mockResolvedValue({ hobbyId: 'hobby-1' }),
}));

jest.mock('@/services/hobbies', () => ({
  fetchUserHobbies: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/client', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/services/client';

const techniques: Technique[] = [
  {
    id: 't1',
    name: 'Opening principles',
    why: 'Why 1',
    order: 1,
    modality: 'video',
    estimatedMinutes: 20,
    searchQuery: 'q1',
    status: 'mastered',
  },
  {
    id: 't2',
    name: 'Forks',
    why: 'Why 2',
    order: 2,
    modality: 'video',
    estimatedMinutes: 15,
    searchQuery: 'q2',
    status: 'skipped',
  },
  {
    id: 't3',
    name: 'Pins',
    why: 'Why 3',
    order: 3,
    modality: 'article',
    estimatedMinutes: 10,
    searchQuery: 'q3',
    status: 'in_progress',
  },
  {
    id: 't4',
    name: 'Skewers',
    why: 'Why 4',
    order: 4,
    modality: 'video',
    estimatedMinutes: 25,
    searchQuery: 'q4',
    status: 'todo',
  },
];

describe('plan store helpers', () => {
  it('getTodaysFocus ignores mastered and skipped techniques', () => {
    expect(getTodaysFocus(techniques)?.id).toBe('t3');
  });

  it('computes progress as mastered over active techniques', () => {
    const active = getActiveTechniques(techniques);
    const mastered = getMasteredCount(techniques);

    expect(active).toHaveLength(3);
    expect(mastered).toBe(1);
    expect(mastered / active.length).toBeCloseTo(1 / 3);
  });
});

describe('usePlanStore actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlanStore.setState({
      hobbies: [],
      activeHobbyId: null,
      hobbySnapshots: {},
      plan: {
        planId: 'pln_test',
        hobby: 'Chess',
        goal: '',
        level: 'beginner',
        estimatedDuration: '2 weeks',
        generatedAt: '2026-07-09T10:00:00Z',
        techniques,
      },
      profile: null,
      streakDays: 0,
      interactionDates: [],
      userId: 'user-1',
    });
  });

  it('sets skipped status locally without calling the plan API', async () => {
    usePlanStore.getState().updateTechniqueStatus('t4', 'skipped');
    await new Promise<void>((resolve) => {
      queueMicrotask(() => resolve());
    });

    const updated = usePlanStore.getState().plan?.techniques.find((t) => t.id === 't4');
    expect(updated?.status).toBe('skipped');
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('replaces a technique in-place while preserving order', () => {
    const replacement: Technique = {
      id: 't3',
      name: 'Discovered attacks',
      why: 'Easier alternative',
      order: 99,
      modality: 'video',
      estimatedMinutes: 12,
      searchQuery: 'chess discovered attack',
      status: 'todo',
    };

    usePlanStore.getState().replaceTechnique('t3', replacement);

    const plan = usePlanStore.getState().plan;
    const replaced = plan?.techniques.find((t) => t.id === 't3');
    expect(replaced?.name).toBe('Discovered attacks');
    expect(replaced?.order).toBe(3);
    expect(plan?.techniques.map((t) => t.order)).toEqual([1, 2, 3, 4]);
  });
});
