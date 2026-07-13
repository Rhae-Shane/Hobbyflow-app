import { apiRequest } from '@/services/client';
import { toDateKey } from '@/lib/gamification/streakMath';
import type {
  CompleteExerciseResponse,
  GenerateExercisesResponse,
  IncompleteExerciseResponse,
  ListExercisesResponse,
  RegenerateExerciseResponse,
} from '@/types/exercise.types';

export async function listExercises(
  roadmapId: string,
  filters: { lessonId?: string; sectionId?: string } = {},
): Promise<ListExercisesResponse> {
  const params = new URLSearchParams();
  if (filters.lessonId) params.set('lessonId', filters.lessonId);
  if (filters.sectionId) params.set('sectionId', filters.sectionId);
  const qs = params.toString();
  return apiRequest<ListExercisesResponse>(
    `/api/v1/roadmaps/${roadmapId}/exercises${qs ? `?${qs}` : ''}`,
  );
}

export async function generateExercises(
  roadmapId: string,
  lessonId: string,
): Promise<GenerateExercisesResponse> {
  return apiRequest(`/api/v1/roadmaps/${roadmapId}/lessons/${lessonId}/exercises/generate`, {
    method: 'POST',
    body: {},
    timeoutMs: 90_000,
  });
}

export async function completeExercise(
  roadmapId: string,
  exerciseId: string,
  localDate = toDateKey(),
): Promise<CompleteExerciseResponse> {
  return apiRequest(`/api/v1/roadmaps/${roadmapId}/exercises/${exerciseId}/complete`, {
    method: 'POST',
    body: { local_date: localDate },
  });
}

export async function incompleteExercise(
  roadmapId: string,
  exerciseId: string,
): Promise<IncompleteExerciseResponse> {
  return apiRequest(`/api/v1/roadmaps/${roadmapId}/exercises/${exerciseId}/incomplete`, {
    method: 'POST',
    body: {},
  });
}

export async function regenerateExercise(
  roadmapId: string,
  exerciseId: string,
): Promise<RegenerateExerciseResponse> {
  return apiRequest(`/api/v1/roadmaps/${roadmapId}/exercises/${exerciseId}/regenerate`, {
    method: 'POST',
    body: {},
    timeoutMs: 90_000,
  });
}
