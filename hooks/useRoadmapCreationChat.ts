import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking } from 'react-native';
import {
  EMAIL_HOBBY_CATALOG_CHIP,
  hobbyCatalogFeedbackMailtoUrl,
  NO_TAGS_MATCHING_CHIP,
} from '@/constants/hobbyCatalogFeedback';
import { buildPreferencesAiContext } from '@/constants/preferences';
import { formatClarificationAnswer } from '@/lib/roadmap-creation/formatClarificationAnswer';
import { sendRoadmapCreationMessage } from '@/services/roadmapCreationChat';
import {
  archiveRoadmapCreationConversation,
  fetchActiveRoadmapCreationConversation,
  upsertRoadmapCreationConversation,
} from '@/services/chatConversations';
import type { UserPreferences } from '@/types/preferences.types';
import type {
  ClarificationResponse,
  DisplayMessage,
  GoalCardState,
  GoalSuggestionResponse,
  LessonPlanResponse,
  LessonPlanState,
  RoadmapCreationFlowState,
} from '@/types/roadmapCreation.types';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function goalCardFromResponse(
  response: GoalSuggestionResponse,
  previous?: GoalCardState | null,
): GoalCardState {
  const incomingTags = response.suggestedTags ?? [];
  const suggestedTags =
    incomingTags.length > 0 ? incomingTags : (previous?.suggestedTags ?? []);

  return {
    suggestedHobby: response.suggestedHobby,
    suggestedName: response.suggestedName,
    suggestedGoal: response.suggestedGoal,
    suggestedBackground: response.suggestedBackground,
    suggestedLevel: response.suggestedLevel ?? 'beginner',
    suggestedTags,
  };
}

function lessonPlanFromResponse(response: LessonPlanResponse): LessonPlanState {
  return {
    courseTitle: response.courseTitle,
    sections: response.sections,
    stage: response.stage,
    lessonPlanId: response.lessonPlanId,
  };
}

type Options = {
  userId: string | undefined;
  preferences: UserPreferences | null;
  isFirstRoadmap: boolean;
};

export function useRoadmapCreationChat({ userId, preferences, isFirstRoadmap }: Options) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [flowState, setFlowState] = useState<RoadmapCreationFlowState>('collecting-input');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [mcqFreeText, setMcqFreeText] = useState('');
  const [goalCard, setGoalCard] = useState<GoalCardState | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlanState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isRequestingOutline, setIsRequestingOutline] = useState(false);
  const sendingRef = useRef(false);
  const goalCardRef = useRef<GoalCardState | null>(null);
  const lessonPlanRef = useRef<LessonPlanState | null>(null);

  goalCardRef.current = goalCard;
  lessonPlanRef.current = lessonPlan;

  const userRoles = preferences?.userRole ? [preferences.userRole] : [];
  const learnerContextSummary = preferences ? buildPreferencesAiContext(preferences) : '';

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

  const showGoalCard = flowState === 'confirming-goal' && goalCard !== null && !lessonPlan;
  const showLessonPlan = flowState === 'reviewing-outline' && lessonPlan !== null;

  const persistConversation = useCallback(
    async (
      nextMessages: DisplayMessage[],
      nextFlowState: RoadmapCreationFlowState,
      nextGoalCard?: GoalCardState | null,
      nextLessonPlan?: LessonPlanState | null,
    ) => {
      if (!userId) return;
      const title = nextMessages.find((m) => m.role === 'user')?.content ?? 'New roadmap';
      const id = await upsertRoadmapCreationConversation({
        userId,
        conversationId,
        title,
        messages: nextMessages,
        flowState: nextFlowState,
        preferencesSnapshot: preferences,
        learnerContextSummary,
        goalCard: nextGoalCard ?? goalCardRef.current,
        lessonPlan: nextLessonPlan ?? lessonPlanRef.current,
      });
      if (id && id !== conversationId) {
        setConversationId(id);
      }
    },
    [conversationId, learnerContextSummary, preferences, userId],
  );

  const applyAssistantResponse = useCallback(
    async (
      response: ClarificationResponse | GoalSuggestionResponse | LessonPlanResponse,
      nextMessages: DisplayMessage[],
    ) => {
      const assistantMessage: DisplayMessage = {
        id: newId(),
        role: 'assistant',
        content:
          response.type === 'lesson_plan'
            ? response.message ?? `Here's your outline for ${response.courseTitle}.`
            : response.message,
        type: response.type,
        metadata:
          response.type === 'clarification'
            ? {
                quickReplies: response.quickReplies,
                multiSelect: response.multiSelect,
              }
            : response.type === 'goal_suggestion'
              ? {
                  suggestedHobby: response.suggestedHobby,
                  suggestedName: response.suggestedName,
                  suggestedGoal: response.suggestedGoal,
                  suggestedBackground: response.suggestedBackground,
                  suggestedLevel: response.suggestedLevel,
                  suggestedTags: response.suggestedTags ?? [],
                }
              : {
                  courseTitle: response.courseTitle,
                  sections: response.sections,
                  stage: response.stage,
                  lessonPlanId: response.lessonPlanId,
                },
      };

      const merged = [...nextMessages, assistantMessage];
      setMessages(merged);
      setFlowState(response.flowState);
      setSelectedChips([]);
      setMcqFreeText('');

      let nextGoal = goalCardRef.current;
      let nextPlan = lessonPlanRef.current;

      if (response.type === 'goal_suggestion') {
        nextGoal = goalCardFromResponse(response, goalCardRef.current);
        nextPlan = null;
        setGoalCard(nextGoal);
        setLessonPlan(null);
      }

      if (response.type === 'lesson_plan') {
        nextPlan = lessonPlanFromResponse(response);
        setLessonPlan(nextPlan);
      }

      await persistConversation(merged, response.flowState, nextGoal, nextPlan);
    },
    [persistConversation],
  );

  const sendMessage = useCallback(
    async (text: string, options?: { intent?: 'chat' | 'generate_outline' }) => {
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

      const intent = options?.intent ?? 'chat';

      try {
        const response = await sendRoadmapCreationMessage({
          message: trimmed,
          messages: apiMessages,
          flowState,
          userRoles,
          isFirstRoadmap,
          conversationId,
          intent,
          learnerContextSummary: learnerContextSummary || undefined,
          currentLessonPlan:
            intent === 'generate_outline' && lessonPlan
              ? {
                  courseTitle: lessonPlan.courseTitle,
                  sections: lessonPlan.sections,
                  stage: lessonPlan.stage,
                  lessonPlanId: lessonPlan.lessonPlanId,
                }
              : undefined,
          roadmapName: goalCard?.suggestedName,
          roadmapGoal: goalCard?.suggestedGoal,
          roadmapBackground: goalCard?.suggestedBackground,
          suggestedTags: goalCard?.suggestedTags,
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
      learnerContextSummary,
      lessonPlan,
      messages,
      userRoles,
    ],
  );

  const requestLessonPlan = useCallback(async () => {
    if (!goalCard || sendingRef.current) return;
    setIsRequestingOutline(true);
    try {
      await sendMessage('Looks good — please create the roadmap outline.', {
        intent: 'generate_outline',
      });
    } finally {
      setIsRequestingOutline(false);
    }
  }, [goalCard, sendMessage]);

  const requestOutlineChanges = useCallback(
    async (changeRequest: string) => {
      const trimmed = changeRequest.trim();
      if (!trimmed || !goalCard || sendingRef.current) return;
      setIsRequestingOutline(true);
      try {
        await sendMessage(trimmed, { intent: 'generate_outline' });
      } finally {
        setIsRequestingOutline(false);
      }
    },
    [goalCard, sendMessage],
  );

  const handleChipSelect = useCallback(
    (text: string) => {
      if (text === EMAIL_HOBBY_CATALOG_CHIP) {
        void Linking.openURL(hobbyCatalogFeedbackMailtoUrl());
        return;
      }

      const multiSelect = activeClarification?.metadata?.multiSelect ?? false;
      if (multiSelect) {
        setSelectedChips((prev) => {
          if (text === NO_TAGS_MATCHING_CHIP) {
            return prev.includes(text) ? [] : [NO_TAGS_MATCHING_CHIP];
          }
          const withoutNoMatch = prev.filter((chip) => chip !== NO_TAGS_MATCHING_CHIP);
          return withoutNoMatch.includes(text)
            ? withoutNoMatch.filter((chip) => chip !== text)
            : [...withoutNoMatch, text];
        });
        return;
      }
      void sendMessage(text);
    },
    [activeClarification?.metadata?.multiSelect, sendMessage],
  );

  const handleMcqSend = useCallback(() => {
    const multiSelect = activeClarification?.metadata?.multiSelect ?? false;
    if (multiSelect) {
      const chipsForAnswer = selectedChips.filter((chip) => chip !== EMAIL_HOBBY_CATALOG_CHIP);
      const formatted = formatClarificationAnswer(chipsForAnswer, mcqFreeText);
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

        const contextGoal = row.context?.goalCard as GoalCardState | null | undefined;
        const lastGoal = [...restored].reverse().find((m) => m.type === 'goal_suggestion');
        if (contextGoal?.suggestedName) {
          setGoalCard({
            ...contextGoal,
            suggestedTags: contextGoal.suggestedTags ?? [],
          });
        } else if (lastGoal?.metadata) {
          setGoalCard({
            suggestedHobby: lastGoal.metadata.suggestedHobby ?? '',
            suggestedName: lastGoal.metadata.suggestedName ?? '',
            suggestedGoal: lastGoal.metadata.suggestedGoal ?? '',
            suggestedBackground: lastGoal.metadata.suggestedBackground ?? '',
            suggestedLevel: lastGoal.metadata.suggestedLevel ?? 'beginner',
            suggestedTags: lastGoal.metadata.suggestedTags ?? [],
          });
        }

        const contextPlan = row.context?.lessonPlan as LessonPlanState | null | undefined;
        const lastPlan = [...restored].reverse().find((m) => m.type === 'lesson_plan');
        if (contextPlan?.courseTitle && contextPlan.sections && contextPlan.lessonPlanId) {
          setLessonPlan(contextPlan);
        } else if (
          lastPlan?.metadata?.courseTitle &&
          lastPlan.metadata.sections &&
          lastPlan.metadata.lessonPlanId
        ) {
          setLessonPlan({
            courseTitle: lastPlan.metadata.courseTitle,
            sections: lastPlan.metadata.sections,
            stage: 'outline',
            lessonPlanId: lastPlan.metadata.lessonPlanId,
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
    conversationId,
    isLoading,
    error,
    inputText,
    setInputText,
    selectedChips,
    mcqFreeText,
    setMcqFreeText,
    goalCard,
    setGoalCard,
    lessonPlan,
    showGoalCard,
    showLessonPlan,
    activeClarification,
    hydrated,
    sendMessage,
    requestLessonPlan,
    requestOutlineChanges,
    isRequestingOutline,
    handleChipSelect,
    handleMcqSend,
    archiveConversation,
  };
}
