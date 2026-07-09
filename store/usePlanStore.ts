import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';
import { fetchUserHobbies } from '@/services/hobbies';
import { upsertUserPlan } from '@/services/userState';
import type { OnboardingProfile, Plan, Technique, TechniqueStatus } from '@/types/plan.types';
import type { HobbyRow } from '@/types/user.types';

const log = createLogger('plan-store');

export type CloudHydrationStatus = 'idle' | 'loading' | 'done';

export type HobbyPlanSnapshot = {
  plan: Plan | null;
  profile: OnboardingProfile | null;
  streakDays: number;
  interactionDates: string[];
};

type PlanState = {
  hobbies: HobbyRow[];
  activeHobbyId: string | null;
  hobbySnapshots: Record<string, HobbyPlanSnapshot>;
  plan: Plan | null;
  profile: OnboardingProfile | null;
  streakDays: number;
  interactionDates: string[];
  userId: string | null;
  cloudHydrationStatus: CloudHydrationStatus;
  setCloudHydrationStatus: (status: CloudHydrationStatus) => void;
  setUserId: (userId: string | null) => void;
  setHobbies: (hobbies: HobbyRow[]) => void;
  saveCurrentHobbySnapshot: () => void;
  applyHobbySnapshot: (hobbyId: string, snapshot: HobbyPlanSnapshot) => void;
  hydrateFromCloud: (payload: {
    hobbies: HobbyRow[];
    activeHobbyId: string | null;
    plan: Plan | null;
    profile: OnboardingProfile | null;
    streakDays: number;
    updatedAt: string;
  }) => void;
  clearSession: () => void;
  setPlan: (plan: Plan) => void;
  setProfile: (profile: OnboardingProfile) => void;
  recordInteraction: () => void;
  updateTechniqueStatus: (techniqueId: string, status: TechniqueStatus) => void;
  updateTechniqueNotes: (techniqueId: string, notes: string) => void;
  replaceTechnique: (techniqueId: string, replacement: Technique) => void;
  reset: () => void;
};

function toDateKey(date: Date = new Date()): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function computeStreakDays(interactionDates: string[]): number {
  if (interactionDates.length === 0) return 0;

  const unique = [...new Set(interactionDates)].sort((a, b) => b.localeCompare(a));
  const today = toDateKey();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  if (unique[0] !== today && unique[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const diffDays = dayjs(unique[i - 1]).diff(dayjs(unique[i]), 'day');
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function withRecordedInteraction(dates: string[]): { interactionDates: string[]; streakDays: number } {
  const today = toDateKey();
  const interactionDates = dates.includes(today) ? dates : [...dates, today];
  return { interactionDates, streakDays: computeStreakDays(interactionDates) };
}

function syncToCloud(
  getState: () => PlanState,
  setState: (partial: Partial<PlanState> | ((state: PlanState) => Partial<PlanState>)) => void,
) {
  const { userId, plan, profile, streakDays } = getState();
  if (!userId) return;

  void upsertUserPlan(userId, { plan, profile, streakDays })
    .then(({ hobbyId }) =>
      fetchUserHobbies(userId).then((hobbies) => {
        const active = hobbies.find((h) => h.id === hobbyId) ?? hobbies.find((h) => h.is_active);
        setState({
          hobbies,
          activeHobbyId: active?.id ?? hobbyId,
        });
      }),
    )
    .catch((err: unknown) => {
      log.warn('Cloud sync failed — local state kept', {
        userId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    });
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      hobbies: [],
      activeHobbyId: null,
      hobbySnapshots: {},
      plan: null,
      profile: null,
      streakDays: 0,
      interactionDates: [],
      userId: null,
      cloudHydrationStatus: 'idle',
      setCloudHydrationStatus: (cloudHydrationStatus) => set({ cloudHydrationStatus }),
      setUserId: (userId) => set({ userId }),
      setHobbies: (hobbies) => {
        const active = hobbies.find((h) => h.is_active) ?? hobbies[0] ?? null;
        set({ hobbies, activeHobbyId: active?.id ?? null });
      },
      saveCurrentHobbySnapshot: () =>
        set((state) => {
          if (!state.activeHobbyId) return state;
          return {
            hobbySnapshots: {
              ...state.hobbySnapshots,
              [state.activeHobbyId]: {
                plan: state.plan,
                profile: state.profile,
                streakDays: state.streakDays,
                interactionDates: state.interactionDates,
              },
            },
          };
        }),
      applyHobbySnapshot: (hobbyId, snapshot) =>
        set((state) => ({
          activeHobbyId: hobbyId,
          hobbies: state.hobbies.map((h) => ({ ...h, is_active: h.id === hobbyId })),
          plan: snapshot.plan,
          profile: snapshot.profile,
          streakDays: snapshot.streakDays,
          interactionDates: snapshot.interactionDates,
        })),
      hydrateFromCloud: ({ hobbies, activeHobbyId, plan, profile, streakDays, updatedAt }) =>
        set((state) => {
          const localPlan = state.plan;
          if (localPlan && plan && state.activeHobbyId === activeHobbyId) {
            const cloudTime = new Date(updatedAt).getTime();
            const localTime = new Date(localPlan.generatedAt).getTime();
            if (localTime > cloudTime) {
              queueMicrotask(() => syncToCloud(get, set));
              return { hobbies, activeHobbyId: activeHobbyId ?? state.activeHobbyId };
            }
          }

          const computed = computeStreakDays(state.interactionDates);

          return {
            hobbies,
            activeHobbyId,
            plan: plan ?? state.plan,
            profile: profile ?? state.profile,
            streakDays: Math.max(streakDays ?? 0, computed, state.streakDays),
          };
        }),
      clearSession: () =>
        set({
          hobbies: [],
          activeHobbyId: null,
          hobbySnapshots: {},
          plan: null,
          profile: null,
          streakDays: 0,
          interactionDates: [],
          userId: null,
          cloudHydrationStatus: 'idle',
        }),
      recordInteraction: () =>
        set((state) => {
          const next = withRecordedInteraction(state.interactionDates);
          queueMicrotask(() => syncToCloud(get, set));
          return next;
        }),
      setPlan: (plan) => {
        set({ plan });
        syncToCloud(get, set);
      },
      setProfile: (profile) => {
        set({ profile });
        syncToCloud(get, set);
      },
      updateTechniqueStatus: (techniqueId, status) =>
        set((state) => {
          if (!state.plan) return state;
          const interaction = withRecordedInteraction(state.interactionDates);
          const next = {
            ...interaction,
            plan: {
              ...state.plan,
              techniques: state.plan.techniques.map((t) =>
                t.id === techniqueId ? { ...t, status } : t,
              ),
            },
          };
          queueMicrotask(() => syncToCloud(get, set));
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
          queueMicrotask(() => syncToCloud(get, set));
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
          queueMicrotask(() => syncToCloud(get, set));
          return next;
        }),
      reset: () => {
        set({ plan: null, profile: null, streakDays: 0, interactionDates: [] });
        syncToCloud(get, set);
      },
    }),
    {
      name: 'hobbyflow-plan',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hobbies: state.hobbies,
        activeHobbyId: state.activeHobbyId,
        hobbySnapshots: state.hobbySnapshots,
        plan: state.plan,
        profile: state.profile,
        streakDays: state.streakDays,
        interactionDates: state.interactionDates,
        userId: state.userId,
      }),
    },
  ),
);

export function getActiveTechniques(techniques: Technique[]): Technique[] {
  return techniques.filter((t) => t.status !== 'skipped');
}

export function getMasteredCount(techniques: Technique[]): number {
  return techniques.filter((t) => t.status === 'mastered').length;
}

export function getSkippedCount(techniques: Technique[]): number {
  return techniques.filter((t) => t.status === 'skipped').length;
}

export function getRemainingTechniques(techniques: Technique[]): Technique[] {
  return getActiveTechniques(techniques).filter((t) => t.status !== 'mastered');
}

export function getDailyMinutes(timeBudget: OnboardingProfile['timeBudget'] | null | undefined): number {
  if (timeBudget === '15 min/day') return 15;
  if (timeBudget === '1 hr/day') return 60;
  return 30;
}

export function getEstimatedFinishDays(
  techniques: Technique[],
  timeBudget: OnboardingProfile['timeBudget'] | null | undefined,
): number {
  const remaining = getRemainingTechniques(techniques);
  if (remaining.length === 0) return 0;
  const remainingMinutes = remaining.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  return Math.ceil(remainingMinutes / getDailyMinutes(timeBudget));
}

export function getTodaysFocus(techniques: Technique[]): Technique | null {
  const next = techniques
    .filter((t) => t.status !== 'mastered' && t.status !== 'skipped')
    .sort((a, b) => a.order - b.order)[0];
  return next ?? null;
}
