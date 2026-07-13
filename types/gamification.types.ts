import type { SocialLink } from '@/types/post.types';

export type DailyTaskType = 'complete_lesson' | 'practice_minutes' | 'custom';
export type DailyTaskStatus = 'open' | 'completed' | 'expired' | 'discarded';

export type LeagueRow = {
  id: string;
  name: string;
  sort_order: number;
  min_rating: number;
  max_rating: number;
  color_hex: string;
  icon_key: string;
};

export type UserGamificationRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  streak_savers: number;
  activity_dates: string[];
  saver_used_dates: string[];
  last_activity_date: string | null;
  rating: number;
  peak_rating: number;
  league_id: string | null;
  pacts_fulfilled?: number;
  created_at: string;
  updated_at: string;
};

export type DailyTaskRow = {
  id: string;
  user_id: string;
  hobby_id: string | null;
  task_date: string;
  task_type: DailyTaskType;
  title: string;
  rating_reward: number;
  status: DailyTaskStatus;
  completed_at: string | null;
  counts_for_rating?: boolean;
  regenerates_used?: number;
  structured?: Record<string, unknown>;
  rating_awarded?: number;
  generated_by?: 'langgraph' | 'legacy';
  hobby_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyTaskHistoryItem =
  | { kind: 'completed'; task_date: string; tasks: DailyTaskRow[] }
  | { kind: 'missed_day'; task_date: string };

export type DailyTaskHistoryResponse = {
  items: DailyTaskHistoryItem[];
  member_since: string;
};

export type TodayDailyTasksResponse = {
  task_date: string;
  primary: DailyTaskRow | null;
  bonus: DailyTaskRow[];
  regenerates_used: number;
  regenerates_remaining: number;
  rating_granted: boolean;
  can_generate_primary: boolean;
  can_generate_bonus: boolean;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  username: string | null;
  rating: number;
  leagueId: string | null;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  isMe: boolean;
};

export type LeaderboardFilter =
  | { kind: 'all' }
  | { kind: 'category'; categoryId: number }
  | { kind: 'tag'; hobbyId: number | null; name: string };

export type LeaderboardCategoryOption = {
  id: number;
  name: string;
};

export type ProfileSearchHit = {
  userId: string;
  username: string;
  displayName: string;
  rating: number;
  leagueId: string | null;
  currentStreak: number;
  hobbyTags?: Array<{
    hobbyId: number | null;
    name: string;
    source: 'catalog' | 'custom';
  }>;
};

export type HobbyTagSearchHit = {
  hobbyId: number | null;
  name: string;
  source: 'catalog' | 'custom';
};

export type PublicProfile = {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  hobbyTags: Array<{
    hobbyId: number | null;
    name: string;
    source: 'catalog' | 'custom';
  }>;
  rating: number;
  peakRating: number;
  leagueId: string | null;
  currentStreak: number;
  longestStreak: number;
  socialLinks?: SocialLink[];
};
