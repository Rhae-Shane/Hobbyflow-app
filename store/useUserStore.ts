import { create } from 'zustand';

export type UserHydrationStatus = 'idle' | 'loading' | 'done';

type UserState = {
  completedOnboardingAt: string | null;
  username: string | null;
  isProfilePublic: boolean;
  bio: string;
  hydrationStatus: UserHydrationStatus;
  setCompletedOnboardingAt: (value: string | null) => void;
  setUsername: (username: string | null) => void;
  setIsProfilePublic: (value: boolean) => void;
  setBio: (bio: string) => void;
  setProfileFields: (fields: {
    username?: string | null;
    isProfilePublic?: boolean;
    bio?: string;
  }) => void;
  setHydrationStatus: (status: UserHydrationStatus) => void;
  clearSession: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  completedOnboardingAt: null,
  username: null,
  isProfilePublic: true,
  bio: '',
  hydrationStatus: 'idle',
  setCompletedOnboardingAt: (completedOnboardingAt) => set({ completedOnboardingAt }),
  setUsername: (username) => set({ username }),
  setIsProfilePublic: (isProfilePublic) => set({ isProfilePublic }),
  setBio: (bio) => set({ bio }),
  setProfileFields: (fields) =>
    set((state) => ({
      username: fields.username !== undefined ? fields.username : state.username,
      isProfilePublic:
        fields.isProfilePublic !== undefined ? fields.isProfilePublic : state.isProfilePublic,
      bio: fields.bio !== undefined ? fields.bio : state.bio,
    })),
  setHydrationStatus: (hydrationStatus) => set({ hydrationStatus }),
  clearSession: () =>
    set({
      completedOnboardingAt: null,
      username: null,
      isProfilePublic: true,
      bio: '',
      hydrationStatus: 'idle',
    }),
}));

export function hasCompletedOnboarding(completedAt: string | null | undefined): boolean {
  return Boolean(completedAt);
}
