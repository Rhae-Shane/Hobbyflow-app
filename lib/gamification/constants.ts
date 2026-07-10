export const DAILY_TASK_RATING_REWARD = 10;
export const MISS_PENALTY_RATING = 5;
export const INITIAL_STREAK_SAVERS = 3;
export const MAX_STREAK_BONUS = 7;
export const LEADERBOARD_LIMIT = 20;
export const STARTING_RATING = 699;

/** Streak day bonus = min(currentStreak, MAX_STREAK_BONUS) awarded on task complete. */
export function streakBonusFor(currentStreak: number): number {
  return Math.min(Math.max(currentStreak, 0), MAX_STREAK_BONUS);
}

/** Rating never goes below the starting floor. */
export function clampRating(rating: number): number {
  return Math.max(STARTING_RATING, rating);
}

export const RESERVED_USERNAMES = new Set([
  'admin',
  'hobbyflow',
  'support',
  'null',
  'me',
  'search',
  'help',
  'api',
  'root',
  'system',
  'mod',
  'moderator',
  'official',
]);

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, '');
}

export function validateUsernameFormat(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (!USERNAME_REGEX.test(normalized)) {
    return 'Use 3–20 characters: lowercase letters, numbers, underscore.';
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return 'That username is reserved.';
  }
  return null;
}
