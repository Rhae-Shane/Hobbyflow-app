import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BootSpinner } from '@/components/BootSpinner';
import { InlineError } from '@/components/ui/InlineError';
import { ChatBubble } from '@/components/roadmap-creation/ChatBubble';
import { ChatInputBar } from '@/components/roadmap-creation/ChatInputBar';
import { GoalSuggestionCard } from '@/components/roadmap-creation/GoalSuggestionCard';
import {
  LessonPlanOutlineCard,
  RequestChangesModal,
} from '@/components/roadmap-creation/LessonPlanOutlineCard';
import { McqClarificationBlock } from '@/components/roadmap-creation/McqClarificationBlock';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { buildPreferencesAiContext } from '@/constants/preferences';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';
import { useRoadmapCreationChat } from '@/hooks/useRoadmapCreationChat';
import { fetchUserHobbies } from '@/services/hobbies';
import { fetchUserPreferences } from '@/services/preferences';
import { materializeRoadmap } from '@/services/roadmaps';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { useRoadmapUiStore } from '@/store/useRoadmapUiStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';

const LOADING_MESSAGES = [
  'Writing your intro…',
  'Building your learning path…',
  'Almost ready…',
];

const GENERATION_ERROR_MESSAGE = "Couldn't create your roadmap.";

export type RoadmapCreationChatScreenProps = {
  /**
   * `onboarding` — first roadmap (stack route).
   * `add` — extra roadmap from Generation tab / add-hobby.
   */
  variant?: 'onboarding' | 'add';
  /** Render inside tabs — keep chat on this page, pad for floating tab bar. */
  embeddedInTabs?: boolean;
  /** Auto-send once after hydrate (Generation landing → chat). */
  initialPrompt?: string;
  /** Optional back control when embedded (return to Generation landing). */
  onBack?: () => void;
};

export function RoadmapCreationChatScreen({
  variant,
  embeddedInTabs = false,
  initialPrompt,
  onBack,
}: RoadmapCreationChatScreenProps = {}) {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const resolvedVariant: 'onboarding' | 'add' =
    variant ?? (mode === 'add' ? 'add' : 'onboarding');
  const isAddMode = resolvedVariant === 'add';
  const { user } = useAuth();
  const isUserHydrated = useIsUserHydrated();
  const hobbies = usePlanStore((s) => s.hobbies);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const preferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);

  const chat = useRoadmapCreationChat({
    userId: user?.id,
    preferences,
    isFirstRoadmap: !isAddMode && hobbies.length === 0,
  });

  const scrollRef = useRef<ScrollView>(null);
  const seededPromptRef = useRef(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isMaterializing, setIsMaterializing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showChangesModal, setShowChangesModal] = useState(false);

  const bottomPad = embeddedInTabs ? FLOATING_TAB_BAR_HEIGHT + 8 : spacing.lg;

  useEffect(() => {
    // Only bounce completed users off the standalone onboarding stack route.
    if (embeddedInTabs || isAddMode || !isUserHydrated) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)');
    }
  }, [
    completedOnboardingAt,
    embeddedInTabs,
    isAddMode,
    isUserHydrated,
    router,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chat.messages, chat.showGoalCard, chat.isLoading]);

  useEffect(() => {
    if (!initialPrompt?.trim() || !chat.hydrated || seededPromptRef.current) return;
    if (chat.messages.length > 0) {
      seededPromptRef.current = true;
      return;
    }
    seededPromptRef.current = true;
    void chat.sendMessage(initialPrompt.trim());
  }, [chat.hydrated, chat.messages.length, chat.sendMessage, initialPrompt]);

  const resolvePreferences = async () => {
    if (preferences) return preferences;
    if (!user) return null;
    const fetched = await fetchUserPreferences(user.id);
    if (fetched) setPreferences(fetched);
    return fetched;
  };

  const finishWithPlan = async () => {
    if (!chat.goalCard || !chat.lessonPlan || !user) return;

    const prefs = await resolvePreferences();
    const hobbyName = chat.goalCard.suggestedHobby.trim();

    const duplicate = hobbies.find((h) => h.name.toLowerCase() === hobbyName.toLowerCase());
    if (isAddMode && duplicate) {
      setDuplicateError(
        `You already have "${duplicate.name}". Open it from the Roadmaps tab.`,
      );
      return;
    }

    setDuplicateError(null);
    setGenerationFailed(false);
    setIsMaterializing(true);

    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      if (isAddMode) {
        usePlanStore.getState().saveCurrentHobbySnapshot();
      }

      const result = await materializeRoadmap({
        hobby: hobbyName,
        level: chat.goalCard.suggestedLevel,
        goalCard: chat.goalCard,
        lessonPlan: chat.lessonPlan,
        messages: chat.messages.map((m) => ({ role: m.role, content: m.content })),
        userRoles: prefs?.userRole ? [prefs.userRole] : [],
        conversationId: chat.conversationId,
        learnerContextSummary: prefs ? buildPreferencesAiContext(prefs) : undefined,
        isFirstRoadmap: !isAddMode && hobbies.length === 0,
      });

      const nextHobbies = await fetchUserHobbies(user.id);
      usePlanStore.setState({
        hobbies: nextHobbies,
        activeHobbyId: result.hobbyId,
        profile: {
          hobby: hobbyName,
          level: chat.goalCard.suggestedLevel,
          goal: chat.goalCard.suggestedGoal,
          timeBudget: '30 min/day',
        },
      });

      useRoadmapUiStore.getState().setSelectedRoadmapId(result.roadmapId);
      router.replace(`/(app)/roadmap-preview/${result.roadmapId}`);
    } catch {
      setGenerationFailed(true);
    } finally {
      clearInterval(interval);
      setIsMaterializing(false);
    }
  };

  const handleSubmitChanges = async (change: string) => {
    setShowChangesModal(false);
    await chat.requestOutlineChanges(change);
  };

  const inputPlaceholder = chat.showGoalCard
    ? 'Want to tweak the roadmap? Tell me what to change or edit above directly'
    : chat.messages.length === 0
      ? 'I want to learn about...'
      : 'Type your answer…';

  const showMcq =
    !chat.showGoalCard &&
    !chat.showLessonPlan &&
    chat.activeClarification?.metadata?.quickReplies &&
    !chat.isLoading;

  const title = embeddedInTabs
    ? 'Building your roadmap'
    : isAddMode
      ? 'Add a hobby'
      : 'Create your roadmap';

  const subtitle = embeddedInTabs
    ? 'Answer a few questions so we can personalize your path.'
    : isAddMode
      ? 'Answer a few quick questions so we can personalize your plan.'
      : "Tell us what you want to learn — we'll ask a few questions to tailor your roadmap.";

  if (!isAddMode && !isUserHydrated) {
    return <BootSpinner />;
  }

  if (!chat.hydrated) {
    return <BootSpinner />;
  }

  if (chat.showLessonPlan && chat.lessonPlan) {
    return (
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        {chat.isRequestingOutline || isMaterializing ? (
          <View style={styles.outlineLoading}>
            <ActivityIndicator color={onboardingColors.primary} size="large" />
            <Text style={styles.loadingText}>
              {isMaterializing
                ? LOADING_MESSAGES[loadingMessageIndex]
                : 'Updating your outline…'}
            </Text>
          </View>
        ) : (
          <LessonPlanOutlineCard
            lessonPlan={chat.lessonPlan}
            goalCard={chat.goalCard}
            onRequestChanges={() => setShowChangesModal(true)}
            onConfirm={() => void finishWithPlan()}
            isLoading={isMaterializing}
          />
        )}

        {duplicateError ? <InlineError message={duplicateError} /> : null}
        {chat.error ? <InlineError message={chat.error} /> : null}

        {generationFailed ? (
          <View style={styles.failureCard}>
            <InlineError message={GENERATION_ERROR_MESSAGE} />
            <Pressable style={styles.primaryButton} onPress={() => void finishWithPlan()}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        <RequestChangesModal
          visible={showChangesModal}
          onClose={() => setShowChangesModal(false)}
          onSubmit={(change) => void handleSubmitChanges(change)}
          isSubmitting={chat.isRequestingOutline}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View
        style={[
          styles.container,
          { paddingBottom: bottomPad, paddingTop: spacing.sm },
        ]}
      >
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <Text style={styles.backText}>← Ideas</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {chat.messages.map((message) => (
            <View key={message.id}>
              <ChatBubble role={message.role} content={message.content} />
              {message.id === chat.activeClarification?.id && showMcq ? (
                <McqClarificationBlock
                  quickReplies={message.metadata?.quickReplies ?? []}
                  multiSelect={message.metadata?.multiSelect ?? false}
                  selectedChips={chat.selectedChips}
                  freeText={chat.mcqFreeText}
                  onSelectChip={chat.handleChipSelect}
                  onChangeFreeText={chat.setMcqFreeText}
                  onSend={chat.handleMcqSend}
                  disabled={chat.isLoading}
                />
              ) : null}
            </View>
          ))}

          {chat.showGoalCard && chat.goalCard ? (
            <GoalSuggestionCard
              goalCard={chat.goalCard}
              onChange={(patch) =>
                chat.setGoalCard((prev) => (prev ? { ...prev, ...patch } : prev))
              }
              onConfirm={() => void chat.requestLessonPlan()}
              isLoading={chat.isLoading}
            />
          ) : null}

          {chat.isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={onboardingColors.primary} />
              <Text style={styles.loadingText}>
                {chat.isRequestingOutline ? 'Building your outline…' : 'Thinking…'}
              </Text>
            </View>
          ) : null}

          {chat.error ? <InlineError message={chat.error} /> : null}
        </ScrollView>

        <ChatInputBar
          value={chat.inputText}
          onChange={chat.setInputText}
          onSend={() => void chat.sendMessage(chat.inputText)}
          placeholder={inputPlaceholder}
          disabled={chat.isLoading || isMaterializing}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  chat: { flex: 1 },
  chatContent: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  outlineLoading: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  loadingText: {
    color: onboardingColors.textMuted,
  },
  failureCard: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: onboardingColors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: onboardingColors.primaryText,
    fontWeight: '700',
    textAlign: 'center',
  },
});
