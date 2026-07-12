import { apiRequest } from '@/services/client';

export type AskChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AskAnythingRequest = {
  message: string;
  messages: AskChatMessage[];
  conversationId?: string;
  activeHobbyHint?: string;
  localDate?: string;
};

export type AskAnythingResponse = {
  message: AskChatMessage;
  conversationId: string;
  toolsUsed?: string[];
};

export type AskConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  preview: string | null;
};

export type AskConversationDetail = {
  id: string;
  title: string;
  messages: AskChatMessage[];
  lastMessageAt: string | null;
};

export function sendAskAnythingMessage(body: AskAnythingRequest) {
  return apiRequest<AskAnythingResponse>('/api/v1/ask-anything', {
    method: 'POST',
    body,
  });
}

export function listAskAnythingConversations(limit = 50) {
  return apiRequest<{ conversations: AskConversationSummary[] }>(
    `/api/v1/ask-anything/conversations?limit=${limit}`,
  );
}

export function getAskAnythingConversation(id: string) {
  return apiRequest<{ conversation: AskConversationDetail }>(
    `/api/v1/ask-anything/conversations/${id}`,
  );
}

export function deleteAskAnythingConversation(id: string) {
  return apiRequest<void>(`/api/v1/ask-anything/conversations/${id}`, {
    method: 'DELETE',
  });
}
