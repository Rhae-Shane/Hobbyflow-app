export type UserPreferences = {
  topGoals: string[];
  selectedTags: string[];
  userRoles: string[];
  learningStyles: string[];
  dailyGoal: string;
  contentLanguage: string;
};

/** Supabase `user_preferences` row (snake_case columns). */
export type UserPreferencesRow = {
  user_id: string;
  top_goals: string[];
  selected_tags: string[];
  user_roles: string[];
  learning_styles: string[];
  daily_goal: string;
  content_language: string;
  created_at: string;
  updated_at: string;
};

export function hasCompletedPreferences(preferences: UserPreferences | null | undefined): boolean {
  if (!preferences) return false;
  return (
    preferences.topGoals.length > 0 &&
    preferences.selectedTags.length > 0 &&
    preferences.userRoles.length > 0 &&
    preferences.learningStyles.length > 0 &&
    preferences.dailyGoal !== ''
  );
}

/** First wizard data step to resume from partial cloud save (skips interstitials). */
export function getPreferencesResumeStepIndex(preferences: UserPreferences | null): number {
  if (!preferences) return 0;
  if (preferences.userRoles.length === 0) return 0;
  if (preferences.topGoals.length === 0) return 1;
  if (preferences.learningStyles.length === 0) return 3;
  if (preferences.selectedTags.length === 0) return 5;
  if (!preferences.dailyGoal) return 8;
  return 9;
}

export function appendUniqueCustom(values: string[], custom: string): string[] {
  const trimmed = custom.trim();
  if (!trimmed) return values;
  const exists = values.some((v) => v.toLowerCase() === trimmed.toLowerCase());
  return exists ? values : [...values, trimmed];
}
