/** Motivation copy from daily goal minutes — tuned for friendly copy, not scientific accuracy. */
export function getMotivationStats(dailyGoalMinutes: string): {
  booksPerMonth: number;
  lessonsFirstWeek: number;
} {
  const minutes = Number.parseInt(dailyGoalMinutes, 10) || 10;
  const booksPerMonth = Math.max(1, Math.round((minutes * 30) / 300));
  const lessonsFirstWeek = Math.round((minutes * 7) / 5);
  return { booksPerMonth, lessonsFirstWeek };
}
