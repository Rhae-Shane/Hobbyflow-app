import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import {
  deleteAskAnythingConversation,
  getAskAnythingConversation,
  listAskAnythingConversations,
  sendAskAnythingMessage,
  type AskChatMessage,
  type AskConversationSummary,
} from '@/services/askAnythingApi';

const log = createLogger('useAskAnythingChat');

export type AskView = 'new' | 'chatting' | 'history';

function todayLocalDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function useAskAnythingChat(options?: { activeHobbyHint?: string }) {
  const [view, setView] = useState<AskView>('new');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AskChatMessage[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AskConversationSummary[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newChat = useCallback(() => {
    setView('new');
    setConversationId(null);
    setMessages([]);
    setTitle(null);
    setError(null);
  }, []);

  const openHistory = useCallback(async () => {
    setError(null);
    try {
      const { conversations: rows } = await listAskAnythingConversations(50);
      setConversations(rows);
      setView('history');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load chat history.';
      log.warn('Failed to load ask history', { error: message });
      setError(message);
      setView('history');
      setConversations([]);
    }
  }, []);

  const selectChat = useCallback(async (id: string) => {
    setError(null);
    try {
      const { conversation } = await getAskAnythingConversation(id);
      setConversationId(conversation.id);
      setMessages(conversation.messages);
      setTitle(conversation.title);
      setView('chatting');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not open that chat.';
      log.warn('Failed to open ask conversation', { error: message, id });
      setError(message);
    }
  }, []);

  const deleteChat = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteAskAnythingConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          newChat();
        }
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Could not delete chat.';
        log.warn('Failed to delete ask conversation', { error: message, id });
        setError(message);
      }
    },
    [conversationId, newChat],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setError(null);
      setView('chatting');
      if (!title) {
        setTitle(trimmed.slice(0, 80));
      }

      const prior = messages;
      const optimistic: AskChatMessage[] = [...prior, { role: 'user', content: trimmed }];
      setMessages(optimistic);

      try {
        const response = await sendAskAnythingMessage({
          message: trimmed,
          messages: prior,
          conversationId: conversationId ?? undefined,
          activeHobbyHint: options?.activeHobbyHint,
          localDate: todayLocalDate(),
        });

        setConversationId(response.conversationId);
        setMessages([
          ...optimistic,
          { role: 'assistant', content: response.message.content },
        ]);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Ask Anything is temporarily unavailable. Please try again.';
        log.error('Ask Anything send failed', { error: message });
        setError(message);
        setMessages(prior);
        if (prior.length === 0) {
          setView('new');
          setTitle(null);
        }
      } finally {
        setSending(false);
      }
    },
    [conversationId, messages, options?.activeHobbyHint, sending, title],
  );

  return {
    view,
    conversationId,
    messages,
    title,
    conversations,
    sending,
    error,
    newChat,
    openHistory,
    selectChat,
    deleteChat,
    send,
  };
}
