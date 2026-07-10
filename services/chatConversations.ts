import { createLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { DisplayMessage } from '@/types/roadmapCreation.types';

const log = createLogger('chatConversations');

export type ChatConversationRow = {
  id: string;
  user_id: string;
  title: string;
  messages: DisplayMessage[];
  context: Record<string, unknown>;
  hobby_id: string | null;
  message_count: number;
  last_message_at: string | null;
};

function toStoredMessages(messages: DisplayMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    type: m.type ?? 'text',
    content: m.content,
    metadata: m.metadata,
  }));
}

export async function fetchActiveRoadmapCreationConversation(
  userId: string,
): Promise<ChatConversationRow | null> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('context->>workflow', 'roadmap_creation')
    .is('archived_at', null)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log.warn('Failed to fetch roadmap creation conversation', { error: error.message });
    return null;
  }

  return (data as ChatConversationRow | null) ?? null;
}

export async function upsertRoadmapCreationConversation(options: {
  userId: string;
  conversationId?: string;
  title: string;
  messages: DisplayMessage[];
  flowState: string;
}): Promise<string | null> {
  const now = new Date().toISOString();
  const payload = {
    user_id: options.userId,
    title: options.title.slice(0, 80),
    messages: toStoredMessages(options.messages),
    context: {
      origin: 'hobby',
      workflow: 'roadmap_creation',
      flowState: options.flowState,
    },
    message_count: options.messages.length,
    last_message_at: now,
    updated_at: now,
  };

  if (options.conversationId) {
    const { error } = await supabase
      .from('chat_conversations')
      .update(payload)
      .eq('id', options.conversationId)
      .eq('user_id', options.userId);

    if (error) {
      log.warn('Failed to update conversation', { error: error.message });
      return options.conversationId;
    }
    return options.conversationId;
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    log.warn('Failed to create conversation', { error: error.message });
    return null;
  }

  return data?.id ?? null;
}

export async function archiveRoadmapCreationConversation(
  userId: string,
  conversationId: string,
  hobbyId?: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_conversations')
    .update({
      archived_at: new Date().toISOString(),
      hobby_id: hobbyId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('user_id', userId);

  if (error) {
    log.warn('Failed to archive conversation', { error: error.message });
  }
}
