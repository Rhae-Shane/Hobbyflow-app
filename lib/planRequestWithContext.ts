import { buildPreferencesAiContext } from '@/constants/preferences';
import type { PlanRequestInput } from '@/lib/validation/planRequest.schema';
import type { UserPreferences } from '@/types/preferences.types';
import { hasCompletedPreferences } from '@/types/preferences.types';

export function buildPlanRequestWithContext(
  input: Pick<PlanRequestInput, 'hobby' | 'level' | 'goal' | 'timeBudget'>,
  preferences: UserPreferences | null | undefined,
): PlanRequestInput {
  if (!preferences || !hasCompletedPreferences(preferences)) {
    return input;
  }

  const learnerContext = buildPreferencesAiContext(preferences);
  return learnerContext ? { ...input, learnerContext } : input;
}
