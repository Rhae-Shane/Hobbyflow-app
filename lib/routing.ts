import { hasCompletedPreferences } from '@/types/preferences.types';

type PostAuthRoute = '/(app)/preferences' | '/(app)/onboarding' | '/(app)/(tabs)';

export function getPostAuthRoute(options: {
  completedOnboardingAt: string | null;
  hasPreferences: boolean;
  hasHobbies: boolean;
}): PostAuthRoute {
  if (options.completedOnboardingAt) {
    return '/(app)/(tabs)';
  }
  if (!options.hasPreferences) {
    return '/(app)/preferences';
  }
  if (!options.hasHobbies) {
    return '/(app)/onboarding';
  }
  return '/(app)/onboarding';
}

export { hasCompletedPreferences };
