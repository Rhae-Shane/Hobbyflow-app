import { hasCompletedPreferences } from '@/types/preferences.types';

export type PostAuthRoute =
  | '/(app)/claim-username'
  | '/(app)/preferences'
  | '/(app)/roadmap-creation'
  | '/(app)/(tabs)';

/**
 * Post-auth navigation.
 * Username is required immediately after signup, before preferences / hobbies / tabs.
 */
export function getPostAuthRoute(options: {
  username: string | null;
  completedOnboardingAt: string | null;
  hasPreferences: boolean;
  hasHobbies: boolean;
}): PostAuthRoute {
  if (!options.username) {
    return '/(app)/claim-username';
  }
  if (options.completedOnboardingAt) {
    return '/(app)/(tabs)';
  }
  if (!options.hasPreferences) {
    return '/(app)/preferences';
  }
  if (!options.hasHobbies) {
    return '/(app)/roadmap-creation';
  }
  return '/(app)/roadmap-creation';
}

export { hasCompletedPreferences };
