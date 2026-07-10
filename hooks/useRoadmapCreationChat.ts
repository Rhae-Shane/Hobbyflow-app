import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatClarificationAnswer } from '@/lib/roadmap-creation/formatClarificationAnswer';
import { sendRoadmapCreationMessage } from '@/services/roadmapCreationChat';
import {
  archiveRoadmapCreationConversation,
  fetchActiveRoadmapCreationConversation,
  upsertRoadmapCreationConversation,
} from '@/services/chatConversations';
import type {
  ClarificationResponse,
  DisplayMessage,
  GoalCardState,
  GoalSuggestionResponse,
  RoadmapCreationFlowState,
} from '@/types/roadmapCreation.types';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function goalCardFromResponse(response: GoalSuggestionResponse): GoalCardState {
  return {
    suggestedHobby: response.suggestedHobby,
    suggestedName: response.suggestedName,
    suggestedGoal: response.suggestedGoal,
    suggestedBackground: response.suggestedBackground,
    suggestedLevel: response.suggestedLevel ?? 'beginner',
  };
}

type Options = {
  userId: string | undefined;
  userRoles: string[];
  isFirstRoadmap: boolean;
};

export function useRoadmapCreationChat({ userId, userRoles, isFirstRoadmap }: Options) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [flowState, setFlowState] = useState<RoadmapCreationFlowState>('collecting-input');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [mcqFreeText, setMcqFreeText] = useState('');
  const [goalCard, setGoalCard] = useState<GoalCardState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const sendingRef = useRef(false);

  const activeClarification = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.type === 'clarification') {
        return msg;
      }
      if (msg.role === 'user') break;
    }
    return null;
  }, [messages]);

  const showGoalCard = flowState === 'confirming-goal' && goalCard !== null;

  const persistConversation = useCallback(
    async (nextMessages: DisplayMessage[], nextFlowState: RoadmapCreationFlowState) => {
      if (!userId) return;
      const title = nextMessages.find((m) => m.role === 'user')?.content ?? 'New roadmap';
      const id = await upsertRoadmapCreationConversation({
        userId,
        conversationId,
        title,
        messages: nextMessages,
        flowState: nextFlowState,
      });
      if (id && id !== conversationId) {
        setConversationId(id);
      }
    },
    [conversationId, userId],
  );

  const applyAssistantResponse = useCallback(
    async (
      response: ClarificationResponse | GoalSuggestionResponse,
      nextMessages: DisplayMessage[],
    ) => {
      const assistantMessage: DisplayMessage = {
        id: newId(),
        role: 'assistant',
        content: response.message,
        type: response.type,
        metadata:
          response.type === 'clarification'
            ? {
                quickReplies: response.quickReplies,
                multiSelect: response.multiSelect,
              }
            : {
                suggestedHobby: response.suggestedHobby,
                suggestedName: response.suggestedName,
                suggestedGoal: response.suggestedGoal,
                suggestedBackground: response.suggestedBackground,
                suggestedLevel: response.suggestedLevel,
              },
      };

      const merged = [...nextMessages, assistantMessage];
      setMessages(merged);
      setFlowState(response.flowState);
      setSelectedChips([]);
      setMcqFreeText('');

      if (response.type === 'goal_suggestion') {
        setGoalCard(goalCardFromResponse(response));
      }

      await persistConversation(merged, response.flowState);
    },
    [persistConversation],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;

      sendingRef.current = true;
      setIsLoading(true);
      setError(null);

      const userMessage: DisplayMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        type: 'text',
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInputText('');

      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await sendRoadmapCreationMessage({
          message: trimmed,
          messages: apiMessages,
          flowState,
          userRoles,
          isFirstRoadmap,
          conversationId,
          roadmapName: goalCard?.suggestedName,
          roadmapGoal: goalCard?.suggestedGoal,
          roadmapBackground: goalCard?.suggestedBackground,
        });

        await applyAssistantResponse(response, nextMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setMessages(messages);
      } finally {
        setIsLoading(false);
        sendingRef.current = false;
      }
    },
    [
      applyAssistantResponse,
      conversationId,
      flowState,
      goalCard,
      isFirstRoadmap,
      messages,
      userRoles,
    ],
  );

  const handleChipSelect = useCallback(
    (text: string) => {
      const multiSelect = activeClarification?.metadata?.multiSelect ?? false;
      if (multiSelect) {
        setSelectedChips((prev) =>
          prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text],
        );
        return;
      }
      void sendMessage(text);
    },
    [activeClarification?.metadata?.multiSelect, sendMessage],
  );

  const handleMcqSend = useCallback(() => {
    const multiSelect = activeClarification?.metadata?.multiSelect ?? false;
    if (multiSelect) {
      const formatted = formatClarificationAnswer(selectedChips, mcqFreeText);
      if (!formatted.trim()) return;
      void sendMessage(formatted);
      return;
    }
    if (!mcqFreeText.trim()) return;
    void sendMessage(mcqFreeText.trim());
  }, [activeClarification?.metadata?.multiSelect, mcqFreeText, selectedChips, sendMessage]);

  useEffect(() => {
    if (!userId || hydrated) return;

    let cancelled = false;
    fetchActiveRoadmapCreationConversation(userId)
      .then((row) => {
        if (cancelled || !row) {
          setHydrated(true);
          return;
        }

        const restored: DisplayMessage[] = (row.messages ?? []).map((m) => ({
          id: newId(),
          role: m.role,
          content: m.content,
          type: m.type,
          metadata: m.metadata,
        }));

        setMessages(restored);
        setConversationId(row.id);
        setFlowState((row.context?.flowState as RoadmapCreationFlowState) ?? 'clarifying');

        const lastGoal = [...restored].reverse().find((m) => m.type === 'goal_suggestion');
        if (lastGoal?.metadata) {
          setGoalCard({
            suggestedHobby: lastGoal.metadata.suggestedHobby ?? '',
            suggestedName: lastGoal.metadata.suggestedName ?? '',
            suggestedGoal: lastGoal.metadata.suggestedGoal ?? '',
            suggestedBackground: lastGoal.metadata.suggestedBackground ?? '',
            suggestedLevel: lastGoal.metadata.suggestedLevel ?? 'beginner',
          });
        }

        setHydrated(true);
      })
      .catch(() => setHydrated(true));

    return () => {
      cancelled = true;
    };
  }, [hydrated, userId]);

  const archiveConversation = useCallback(
    async (hobbyId?: string) => {
      if (!userId || !conversationId) return;
      await archiveRoadmapCreationConversation(userId, conversationId, hobbyId);
    },
    [conversationId, userId],
  );

  return {
    messages,
    flowState,
    isLoading,
    error,
    inputText,
    setInputText,
    selectedChips,
    mcqFreeText,
    setMcqFreeText,
    goalCard,
    setGoalCard,
    showGoalCard,
    activeClarification,
    hydrated,
    sendMessage,
    handleChipSelect,
    handleMcqSend,
    archiveConversation,
  };
}
