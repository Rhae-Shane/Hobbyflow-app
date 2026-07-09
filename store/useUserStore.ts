import { create } from 'zustand';

export type UserHydrationStatus = 'idle' | 'loading' | 'done';

type UserState = {
  completedOnboardingAt: string | null;
  hydrationStatus: UserHydrationStatus;
  setCompletedOnboardingAt: (value: string | null) => void;
  setHydrationStatus: (status: UserHydrationStatus) => void;
  clearSession: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  completedOnboardingAt: null,
  hydrationStatus: 'idle',
  setCompletedOnboardingAt: (completedOnboardingAt) => set({ completedOnboardingAt }),
  setHydrationStatus: (hydrationStatus) => set({ hydrationStatus }),
  clearSession: () => set({ completedOnboardingAt: null, hydrationStatus: 'idle' }),
}));

export function hasCompletedOnboarding(completedAt: string | null | undefined): boolean {
  return Boolean(completedAt);
}
