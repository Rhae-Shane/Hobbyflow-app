import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { upsertUserPlan } from '../api/userState';
import type { OnboardingProfile, Plan, Technique, TechniqueStatus } from '../types/plan.types';

type PlanState = {
  plan: Plan | null;
  profile: OnboardingProfile | null;
  streakDays: number;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  hydrateFromCloud: (payload: {
    plan: Plan | null;
    profile: OnboardingProfile | null;
    streakDays: number;
  }) => void;
  setPlan: (plan: Plan) => void;
  setProfile: (profile: OnboardingProfile) => void;
  updateTechniqueStatus: (techniqueId: string, status: TechniqueStatus) => void;
  updateTechniqueNotes: (techniqueId: string, notes: string) => void;
  replaceTechnique: (techniqueId: string, replacement: Technique) => void;
  reset: () => void;
};

function syncToCloud(getState: () => PlanState) {
  const { userId, plan, profile, streakDays } = getState();
  if (!userId) return;

  void upsertUserPlan(userId, { plan, profile, streakDays }).catch(() => {
    // Best-effort sync — local state remains source of truth offline.
  });
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: null,
      profile: null,
      streakDays: 0,
      userId: null,
      setUserId: (userId) => set({ userId }),
      hydrateFromCloud: ({ plan, profile, streakDays }) =>
        set((state) => ({
          plan: plan ?? state.plan,
          profile: profile ?? state.profile,
          streakDays: streakDays ?? state.streakDays,
        })),
      setPlan: (plan) => {
        set({ plan });
        syncToCloud(get);
      },
      setProfile: (profile) => {
        set({ profile });
        syncToCloud(get);
      },
      updateTechniqueStatus: (techniqueId, status) =>
        set((state) => {
          if (!state.plan) return state;
          const next = {
            plan: {
              ...state.plan,
              techniques: state.plan.techniques.map((t) =>
                t.id === techniqueId ? { ...t, status } : t,
              ),
            },
          };
          queueMicrotask(() => syncToCloud(get));
          return next;
        }),
      updateTechniqueNotes: (techniqueId, notes) =>
        set((state) => {
          if (!state.plan) return state;
          const next = {
            plan: {
              ...state.plan,
              techniques: state.plan.techniques.map((t) =>
                t.id === techniqueId ? { ...t, notes } : t,
              ),
            },
          };
          queueMicrotask(() => syncToCloud(get));
          return next;
        }),
      replaceTechnique: (techniqueId, replacement) =>
        set((state) => {
          if (!state.plan) return state;
          const order = state.plan.techniques.find((t) => t.id === techniqueId)?.order;
          const next = {
            plan: {
              ...state.plan,
              techniques: state.plan.techniques.map((t) =>
                t.id === techniqueId ? { ...replacement, order: order ?? t.order } : t,
              ),
            },
          };
          queueMicrotask(() => syncToCloud(get));
          return next;
        }),
      reset: () => {
        set({ plan: null, profile: null, streakDays: 0 });
        syncToCloud(get);
      },
    }),
    {
      name: 'hobbyflow-plan',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getActiveTechniques(techniques: Technique[]): Technique[] {
  return techniques.filter((t) => t.status !== 'skipped');
}

export function getMasteredCount(techniques: Technique[]): number {
  return techniques.filter((t) => t.status === 'mastered').length;
}

export function getTodaysFocus(techniques: Technique[]): Technique | null {
  const next = techniques
    .filter((t) => t.status !== 'mastered' && t.status !== 'skipped')
    .sort((a, b) => a.order - b.order)[0];
  return next ?? null;
}
