import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { completeOnboarding } from '@/services/user';
import {
  hasCompletedPreferences,
  normalizeUserRole,
  type UserPreferences,
  type UserPreferencesRow,
} from '@/types/preferences.types';

const log = createLogger('preferences');

const PREFERENCES_COLUMNS =
  'user_id, top_goals, user_roles, age_range, accessibility_needs, learning_strengths, practice_environments, resource_budget, learning_styles, content_language, created_at, updated_at';

const LEGACY_PREFERENCES_COLUMNS =
  'user_id, top_goals, user_roles, learning_styles, content_language, created_at, updated_at';

export function rowToUserPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    topGoals: row.top_goals ?? [],
    userRole: normalizeUserRole(row.user_roles),
    ageRange: row.age_range ?? '',
    accessibilityNeeds: row.accessibility_needs ?? [],
    learningStrengths: row.learning_strengths ?? [],
    practiceEnvironments: row.practice_environments ?? [],
    resourceBudget: row.resource_budget ?? '',
    learningStyles: row.learning_styles ?? [],
    contentLanguage: row.content_language ?? 'en',
  };
}

export function userPreferencesToRow(
  userId: string,
  preferences: UserPreferences,
): Omit<UserPreferencesRow, 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    top_goals: preferences.topGoals,
    user_roles: preferences.userRole.trim() ? [preferences.userRole.trim()] : [],
    age_range: preferences.ageRange,
    accessibility_needs: preferences.accessibilityNeeds,
    learning_strengths: preferences.learningStrengths,
    practice_environments: preferences.practiceEnvironments,
    resource_budget: preferences.resourceBudget,
    learning_styles: preferences.learningStyles,
    content_language: preferences.contentLanguage,
  };
}

async function fetchPreferencesRow(
  userId: string,
  columns: string,
): Promise<UserPreferencesRow | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(columns)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserPreferencesRow | null) ?? null;
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const row = await fetchPreferencesRow(userId, PREFERENCES_COLUMNS);
    if (!row) return null;
    return rowToUserPreferences(row);
  } catch (error) {
    log.warn('Full preferences fetch failed, trying legacy columns', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    try {
      const legacyRow = await fetchPreferencesRow(userId, LEGACY_PREFERENCES_COLUMNS);
      if (!legacyRow) return null;
      return rowToUserPreferences({
        ...legacyRow,
        age_range: '',
        accessibility_needs: [],
        learning_strengths: [],
        practice_environments: [],
        resource_budget: '',
      });
    } catch (legacyError) {
      log.error('Failed to fetch preferences', {
        userId,
        error: legacyError instanceof Error ? legacyError.message : 'Unknown error',
      });
      throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
        cause: legacyError,
      });
    }
  }
}

export type SaveUserPreferencesResult = {
  /** True when all required preference fields are filled and onboarding was marked complete. */
  preferencesComplete: boolean;
};

/**
 * Upserts preferences. When the payload is fully filled, also sets
 * `users.completed_onboarding_at` (idempotent).
 */
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<SaveUserPreferencesResult> {
  log.debug('Saving user preferences', {
    userId,
    topGoals: preferences.topGoals.length,
    userRole: preferences.userRole,
    ageRange: preferences.ageRange,
    accessibilityNeeds: preferences.accessibilityNeeds.length,
    practiceEnvironments: preferences.practiceEnvironments.length,
    resourceBudget: preferences.resourceBudget,
    learningStrengths: preferences.learningStrengths.length,
    learningStyles: preferences.learningStyles.length,
  });

  const { error } = await supabase
    .from('user_preferences')
    .upsert(userPreferencesToRow(userId, preferences), { onConflict: 'user_id' });

  if (error) {
    log.error('Failed to save preferences', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  const preferencesComplete = hasCompletedPreferences(preferences);
  if (preferencesComplete) {
    await completeOnboarding(userId);
    log.info('User preferences saved and onboarding marked complete', { userId });
  } else {
    log.info('User preferences saved', { userId });
  }

  return { preferencesComplete };
}
