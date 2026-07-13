export type RoadmapExerciseStatus = 'incomplete' | 'complete';

export type RoadmapExerciseRow = {
  id: string;
  user_id: string;
  roadmap_id: string;
  section_node_id: string;
  lesson_id: string;
  title: string;
  instructions: string;
  status: RoadmapExerciseStatus;
  sort_order: number;
  generated_by: 'langgraph';
  rating_awarded: number;
  created_at: string;
  completed_at: string | null;
};

export type ExerciseGamificationSnapshot = {
  rating: number;
  peak_rating: number;
  league_id: string | null;
  current_streak: number;
  longest_streak: number;
  activity_dates: string[];
  last_activity_date: string | null;
};

export type ListExercisesResponse = {
  exercises: RoadmapExerciseRow[];
};

export type GenerateExercisesResponse = {
  exercises: RoadmapExerciseRow[];
};

export type CompleteExerciseResponse = {
  exercise: RoadmapExerciseRow;
  ratingAwarded: number;
  gamification: ExerciseGamificationSnapshot;
};

export type IncompleteExerciseResponse = {
  exercise: RoadmapExerciseRow;
};

export type RegenerateExerciseResponse = {
  exercise: RoadmapExerciseRow;
};
