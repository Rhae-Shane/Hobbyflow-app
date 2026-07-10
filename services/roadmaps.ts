import { apiRequest } from '@/services/client';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';
import type {
  MaterializeRoadmapRequest,
  MaterializeRoadmapResponse,
  GenerateMindMapResponse,
  RoadmapDetailResponse,
  RoadmapRow,
} from '@/types/roadmap.types';

const log = createLogger('roadmaps');

export function materializeRoadmap(body: MaterializeRoadmapRequest) {
  return apiRequest<MaterializeRoadmapResponse>('/api/v1/roadmaps/materialize', {
    method: 'POST',
    body,
    timeoutMs: 90_000,
  });
}

export function fetchRoadmapDetail(roadmapId: string) {
  return apiRequest<RoadmapDetailResponse>(`/api/v1/roadmaps/${roadmapId}`);
}

export function activateRoadmap(roadmapId: string) {
  return apiRequest<{ id: string; hobby_id: string; status: string }>(
    `/api/v1/roadmaps/${roadmapId}/activate`,
    { method: 'POST' },
  );
}

export function generateRoadmapMindMap(roadmapId: string, options?: { force?: boolean }) {
  return apiRequest<GenerateMindMapResponse>(`/api/v1/roadmaps/${roadmapId}/mindmap`, {
    method: 'POST',
    body: options ?? {},
    timeoutMs: 90_000,
  });
}

export async function fetchActiveRoadmapForHobby(
  userId: string,
  hobbyId: string,
): Promise<RoadmapRow | null> {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', userId)
    .eq('hobby_id', hobbyId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log.warn('Failed to fetch roadmap for hobby', { hobbyId, error: error.message });
    return null;
  }

  return (data as RoadmapRow | null) ?? null;
}

export async function fetchUserRoadmaps(userId: string): Promise<RoadmapRow[]> {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('id, user_id, hobby_id, title, lesson_plan_id, outline, personalize_metadata, intro, cover_image_path, status, mindmap')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    log.warn('Failed to fetch user roadmaps', { error: error.message });
    return [];
  }

  return (data as RoadmapRow[]) ?? [];
}
