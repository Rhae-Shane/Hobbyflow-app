import { hasCompletedPreferences } from '@/types/preferences.types';

type PostAuthRoute = '/(app)/preferences' | '/(app)/onboarding' | '/(app)/(tabs)';

export function getPostAuthRoute(options: {
  hasPreferences: boolean;
  hasPlan: boolean;
}): PostAuthRoute {
  if (!options.hasPreferences) {
    return '/(app)/preferences';
  }
  if (!options.hasPlan) {
    return '/(app)/onboarding';
  }
  return '/(app)/(tabs)';
}

export { hasCompletedPreferences };
