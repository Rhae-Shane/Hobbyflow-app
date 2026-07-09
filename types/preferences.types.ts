export type UserPreferences = {
  topGoals: string[];
  userRole: string;
  ageRange: string;
  accessibilityNeeds: string[];
  learningStrengths: string[];
  practiceEnvironments: string[];
  resourceBudget: string;
  learningStyles: string[];
  contentLanguage: string;
};

/** Supabase `user_preferences` row (snake_case columns). */
export type UserPreferencesRow = {
  user_id: string;
  top_goals: string[];
  user_roles: string[];
  age_range: string;
  accessibility_needs: string[];
  learning_strengths: string[];
  practice_environments: string[];
  resource_budget: string;
  learning_styles: string[];
  content_language: string;
  created_at: string;
  updated_at: string;
};

export function hasCompletedPreferences(preferences: UserPreferences | null | undefined): boolean {
  if (!preferences) return false;
  return (
    preferences.topGoals.length > 0 &&
    preferences.userRole.trim() !== '' &&
    preferences.ageRange !== '' &&
    preferences.accessibilityNeeds.length > 0 &&
    preferences.practiceEnvironments.length > 0 &&
    preferences.resourceBudget !== '' &&
    preferences.learningStyles.length > 0
  );
}

export function appendUniqueCustom(values: string[], custom: string): string[] {
  const trimmed = custom.trim();
  if (!trimmed) return values;
  const exists = values.some((v) => v.toLowerCase() === trimmed.toLowerCase());
  return exists ? values : [...values, trimmed];
}

/** Maps legacy multi-select role arrays to a single role string. */
export function normalizeUserRole(userRoles: string[] | null | undefined): string {
  return userRoles?.[0]?.trim() ?? '';
}
