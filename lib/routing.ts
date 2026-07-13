import { hasCompletedPreferences } from '@/types/preferences.types';

export type PostAuthRoute =
  | '/(app)/claim-username'
  | '/(app)/welcome'
  | '/(app)/preferences'
  | '/(app)/roadmap-creation'
  | '/(app)/(tabs)';

/**
 * Post-auth navigation.
 * Username → welcome intro → preferences → roadmap creation → tabs.
 * Users who already finished (flag or existing hobbies) skip first-run screens.
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
  // Already onboarded — never send them through welcome / preferences again.
  if (options.completedOnboardingAt || options.hasHobbies) {
    return '/(app)/(tabs)';
  }
  if (!options.hasPreferences) {
    return '/(app)/welcome';
  }
  return '/(app)/roadmap-creation';
}

export { hasCompletedPreferences };
