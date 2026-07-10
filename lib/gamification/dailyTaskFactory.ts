import type { HobbyRow } from '@/types/user.types';
import type { DailyTaskType } from '@/types/gamification.types';
import { DAILY_TASK_RATING_REWARD } from '@/lib/gamification/constants';

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export type DailyTaskDraft = {
  hobby_id: string | null;
  task_type: DailyTaskType;
  title: string;
  rating_reward: number;
  task_date: string;
};

/** Pick a deterministic daily task from any of the user's hobbies. */
export function buildDailyTaskDraft(
  userId: string,
  taskDate: string,
  hobbies: HobbyRow[],
): DailyTaskDraft {
  if (hobbies.length === 0) {
    return {
      hobby_id: null,
      task_type: 'practice_minutes',
      title: 'Spend 15 minutes on any hobby today',
      rating_reward: DAILY_TASK_RATING_REWARD,
      task_date: taskDate,
    };
  }

  const seed = hashString(`${userId}:${taskDate}`);
  const hobby = hobbies[seed % hobbies.length]!;
  const taskType: DailyTaskType = seed % 2 === 0 ? 'complete_lesson' : 'practice_minutes';

  const title =
    taskType === 'complete_lesson'
      ? `Complete 1 lesson in ${hobby.name}`
      : `Practice ${hobby.name} for 15 minutes`;

  return {
    hobby_id: hobby.id,
    task_type: taskType,
    title,
    rating_reward: DAILY_TASK_RATING_REWARD,
    task_date: taskDate,
  };
}
