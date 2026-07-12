import { apiRequest } from '@/services/client';
import { toDateKey } from '@/lib/gamification/streakMath';
import type {
  DailyTaskHistoryItem,
  DailyTaskRow,
  TodayDailyTasksResponse,
} from '@/types/gamification.types';

export type GenerateDailyTaskMode = 'primary' | 'regenerate' | 'bonus';

export async function fetchTodayDailyTasks(
  taskDate = toDateKey(),
): Promise<TodayDailyTasksResponse> {
  return apiRequest<TodayDailyTasksResponse>(
    `/api/v1/daily-tasks/today?task_date=${encodeURIComponent(taskDate)}`,
  );
}

export async function generateDailyTask(
  mode: GenerateDailyTaskMode,
  taskDate = toDateKey(),
): Promise<{ task: DailyTaskRow; today: TodayDailyTasksResponse }> {
  return apiRequest(`/api/v1/daily-tasks/generate`, {
    method: 'POST',
    body: { task_date: taskDate, mode },
    timeoutMs: 90_000,
  });
}

export async function completeDailyTaskApi(
  taskId: string,
  taskDate = toDateKey(),
): Promise<{
  task: DailyTaskRow;
  ratingAwarded: number;
  gamification: {
    rating: number;
    peak_rating: number;
    league_id: string | null;
    current_streak: number;
    longest_streak: number;
    activity_dates: string[];
    last_activity_date: string | null;
  } | null;
  today: TodayDailyTasksResponse;
}> {
  return apiRequest(`/api/v1/daily-tasks/${taskId}/complete`, {
    method: 'POST',
    body: { task_date: taskDate },
  });
}

export async function fetchDailyTaskHistory(
  taskDate = toDateKey(),
  limit = 90,
): Promise<{ items: DailyTaskHistoryItem[]; member_since: string }> {
  return apiRequest(
    `/api/v1/daily-tasks/history?task_date=${encodeURIComponent(taskDate)}&limit=${limit}`,
  );
}
