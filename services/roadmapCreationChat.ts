import { apiRequest } from '@/services/client';
import type {
  RoadmapCreationChatRequest,
  RoadmapCreationChatResponse,
} from '@/types/roadmapCreation.types';

export function sendRoadmapCreationMessage(body: RoadmapCreationChatRequest) {
  return apiRequest<RoadmapCreationChatResponse>('/api/v1/roadmap-creation-chat', {
    method: 'POST',
    body,
  });
}
