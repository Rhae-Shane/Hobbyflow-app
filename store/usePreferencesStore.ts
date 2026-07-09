import { create } from 'zustand';
import type { UserPreferences } from '@/types/preferences.types';

export type PreferencesHydrationStatus = 'idle' | 'loading' | 'done';

type PreferencesState = {
  preferences: UserPreferences | null;
  hydrationStatus: PreferencesHydrationStatus;
  setPreferences: (preferences: UserPreferences | null) => void;
  setHydrationStatus: (status: PreferencesHydrationStatus) => void;
  clearSession: () => void;
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  preferences: null,
  hydrationStatus: 'idle',
  setPreferences: (preferences) => set({ preferences }),
  setHydrationStatus: (hydrationStatus) => set({ hydrationStatus }),
  clearSession: () => set({ preferences: null, hydrationStatus: 'idle' }),
}));
