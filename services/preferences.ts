import { createLogger } from '@/lib/logger';
import { AppError, ErrorCodes, getKnownUserMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { UserPreferences, UserPreferencesRow } from '@/types/preferences.types';

const log = createLogger('preferences');

const PREFERENCES_COLUMNS =
  'user_id, top_goals, selected_tags, user_roles, learning_styles, daily_goal, content_language, created_at, updated_at';

export function rowToUserPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    topGoals: row.top_goals ?? [],
    selectedTags: row.selected_tags ?? [],
    userRoles: row.user_roles ?? [],
    learningStyles: row.learning_styles ?? [],
    dailyGoal: row.daily_goal ?? '',
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
    selected_tags: preferences.selectedTags,
    user_roles: preferences.userRoles,
    learning_styles: preferences.learningStyles,
    daily_goal: preferences.dailyGoal,
    content_language: preferences.contentLanguage,
  };
}

function isEmptyPreferences(preferences: UserPreferences): boolean {
  return (
    preferences.topGoals.length === 0 &&
    preferences.selectedTags.length === 0 &&
    preferences.userRoles.length === 0 &&
    preferences.learningStyles.length === 0 &&
    preferences.dailyGoal === '' &&
    preferences.contentLanguage === 'en'
  );
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(PREFERENCES_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    log.error('Failed to fetch preferences', { userId, error: error.message });
    throw new AppError(ErrorCodes.SYNC_FAILED, getKnownUserMessage(ErrorCodes.SYNC_FAILED), {
      cause: error,
    });
  }

  if (!data) {
    return null;
  }

  const preferences = rowToUserPreferences(data as UserPreferencesRow);
  return isEmptyPreferences(preferences) ? null : preferences;
}

export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  log.debug('Saving user preferences', {
    userId,
    topGoals: preferences.topGoals.length,
    selectedTags: preferences.selectedTags.length,
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

  log.info('User preferences saved', { userId });
}
