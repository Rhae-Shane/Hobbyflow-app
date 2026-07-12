import { create } from 'zustand';

export type UserHydrationStatus = 'idle' | 'loading' | 'done';

type UserState = {
  completedOnboardingAt: string | null;
  username: string | null;
  bio: string;
  hydrationStatus: UserHydrationStatus;
  setCompletedOnboardingAt: (value: string | null) => void;
  setUsername: (username: string | null) => void;
  setBio: (bio: string) => void;
  setProfileFields: (fields: { username?: string | null; bio?: string }) => void;
  setHydrationStatus: (status: UserHydrationStatus) => void;
  clearSession: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  completedOnboardingAt: null,
  username: null,
  bio: '',
  hydrationStatus: 'idle',
  setCompletedOnboardingAt: (completedOnboardingAt) => set({ completedOnboardingAt }),
  setUsername: (username) => set({ username }),
  setBio: (bio) => set({ bio }),
  setProfileFields: (fields) =>
    set((state) => ({
      username: fields.username !== undefined ? fields.username : state.username,
      bio: fields.bio !== undefined ? fields.bio : state.bio,
    })),
  setHydrationStatus: (hydrationStatus) => set({ hydrationStatus }),
  clearSession: () =>
    set({
      completedOnboardingAt: null,
      username: null,
      bio: '',
      hydrationStatus: 'idle',
    }),
}));

export function hasCompletedOnboarding(completedAt: string | null | undefined): boolean {
  return Boolean(completedAt);
}
