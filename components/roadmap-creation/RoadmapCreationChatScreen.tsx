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
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';
import { useRoadmapCreationChat } from '@/hooks/useRoadmapCreationChat';
import { buildPlanRequestFromGoalCard } from '@/lib/roadmap-creation/buildPlanFromGoal';
import { getStarterPlan } from '@/lib/starterPlans';
import { planRequestSchema } from '@/lib/validation/planRequest.schema';
import { fetchUserHobbies } from '@/services/hobbies';
import { fetchUserPreferences } from '@/services/preferences';
import { useGeneratePlan } from '@/services/queries';
import { completeOnboarding as markOnboardingComplete } from '@/services/user';
import { upsertUserPlan } from '@/services/userState';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import type { OnboardingProfile, Plan } from '@/types/plan.types';

const LOADING_MESSAGES = [
  'Generating your roadmap...',
  'Finding the right techniques...',
  'Almost done...',
];

const GENERATION_ERROR_MESSAGE = "Couldn't generate your roadmap.";

export function RoadmapCreationChatScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAddMode = mode === 'add';
  const { user } = useAuth();
  const isUserHydrated = useIsUserHydrated();
  const hobbies = usePlanStore((s) => s.hobbies);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);
  const preferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const generatePlan = useGeneratePlan();

  const chat = useRoadmapCreationChat({
    userId: user?.id,
    preferences,
    isFirstRoadmap: !isAddMode && hobbies.length === 0,
  });

  const scrollRef = useRef<ScrollView>(null);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const lastPlanRequestRef = useRef<ReturnType<typeof planRequestSchema.safeParse>['data'] | null>(
    null,
  );

  useEffect(() => {
    if (!isUserHydrated || isAddMode) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)');
    }
  }, [completedOnboardingAt, isAddMode, isUserHydrated, router]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chat.messages, chat.showGoalCard, chat.isLoading]);

  const resolvePreferences = async () => {
    if (preferences) return preferences;
    if (!user) return null;
    const fetched = await fetchUserPreferences(user.id);
    if (fetched) setPreferences(fetched);
    return fetched;
  };

  const persistPlanAndArchive = async (plan: Plan, profile: OnboardingProfile) => {
    if (isAddMode) {
      usePlanStore.getState().saveCurrentHobbySnapshot();
    }

    usePlanStore.setState({ plan, profile });

    let hobbyId: string | undefined;
    if (user) {
      const streakDays = usePlanStore.getState().streakDays;
      const synced = await upsertUserPlan(user.id, {
        plan,
        profile,
        streakDays,
      });
      hobbyId = synced.hobbyId;
      const nextHobbies = await fetchUserHobbies(user.id);
      usePlanStore.setState({
        hobbies: nextHobbies,
        activeHobbyId: hobbyId,
      });
    }

    await chat.archiveConversation(hobbyId);
  };

  const finishWithPlan = async () => {
    if (!chat.goalCard) return;

    const prefs = await resolvePreferences();
    const planInput = buildPlanRequestFromGoalCard(
      chat.goalCard,
      prefs,
      chat.messages,
      '30 min/day',
      chat.lessonPlan,
    );
    const parsed = planRequestSchema.safeParse(planInput);
    if (!parsed.success) {
      chat.setInputText('');
      return;
    }

    const duplicate = hobbies.find(
      (h) => h.name.toLowerCase() === parsed.data.hobby.trim().toLowerCase(),
    );
    if (isAddMode && duplicate) {
      setDuplicateError(
        `You already have "${duplicate.name}". Switch to it from the Progress tab.`,
      );
      return;
    }

    setDuplicateError(null);

    lastPlanRequestRef.current = parsed.data;
    setGenerationFailed(false);

    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const plan = await generatePlan.mutateAsync(parsed.data);
      await persistPlanAndArchive(plan, {
        hobby: parsed.data.hobby,
        level: parsed.data.level,
        goal: parsed.data.goal ?? '',
        timeBudget: parsed.data.timeBudget,
      });

      if (!isAddMode && user) {
        await markOnboardingComplete(user.id);
        setCompletedOnboardingAt(new Date().toISOString());
      }

      router.replace('/(app)/(tabs)');
    } catch {
      setGenerationFailed(true);
    } finally {
      clearInterval(interval);
    }
  };

  const handleUseStarterPlan = async () => {
    const payload = lastPlanRequestRef.current;
    if (!payload || !chat.goalCard) return;
    const starter = getStarterPlan(payload);
    if (!starter) return;

    setGenerationFailed(false);
    await persistPlanAndArchive(starter, {
      hobby: payload.hobby,
      level: payload.level,
      goal: payload.goal ?? '',
      timeBudget: payload.timeBudget,
    });
    if (!isAddMode && user) {
      await markOnboardingComplete(user.id);
      setCompletedOnboardingAt(new Date().toISOString());
    }
    router.replace('/(app)/(tabs)');
  };

  const handleSubmitChanges = async (change: string) => {
    setShowChangesModal(false);
    await chat.requestOutlineChanges(change);
  };

  const inputPlaceholder = chat.showGoalCard
    ? 'Want to tweak the roadmap? Tell me what to change or edit above directly'
    : chat.messages.length === 0
      ? 'What hobby do you want to learn?'
      : 'Type your answer…';

  const showMcq =
    !chat.showGoalCard &&
    !chat.showLessonPlan &&
    chat.activeClarification?.metadata?.quickReplies &&
    !chat.isLoading;

  if (!isAddMode && !isUserHydrated) {
    return <BootSpinner />;
  }

  if (!chat.hydrated) {
    return <BootSpinner />;
  }

  if (chat.showLessonPlan && chat.lessonPlan) {
    return (
      <View style={styles.container}>
        {chat.isRequestingOutline ? (
          <View style={styles.outlineLoading}>
            <ActivityIndicator color={onboardingColors.primary} size="large" />
            <Text style={styles.loadingText}>Updating your outline…</Text>
          </View>
        ) : (
          <LessonPlanOutlineCard
            lessonPlan={chat.lessonPlan}
            goalCard={chat.goalCard}
            onRequestChanges={() => setShowChangesModal(true)}
            onConfirm={() => void finishWithPlan()}
            isLoading={generatePlan.isPending}
          />
        )}

        {duplicateError ? <InlineError message={duplicateError} /> : null}
        {chat.error ? <InlineError message={chat.error} /> : null}

        {generationFailed ? (
          <View style={styles.failureCard}>
            <InlineError message={GENERATION_ERROR_MESSAGE} />
            <View style={styles.failureActions}>
              <Pressable style={styles.secondaryButton} onPress={() => void finishWithPlan()}>
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </Pressable>
              {lastPlanRequestRef.current && getStarterPlan(lastPlanRequestRef.current) ? (
                <Pressable style={styles.primaryButton} onPress={() => void handleUseStarterPlan()}>
                  <Text style={styles.primaryButtonText}>Use Starter Plan</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {generatePlan.isPending ? (
          <Text style={styles.generatingText}>{LOADING_MESSAGES[loadingMessageIndex]}</Text>
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
      <View style={styles.container}>
        <Text style={styles.title}>{isAddMode ? 'Add a hobby' : 'Create your roadmap'}</Text>
        <Text style={styles.subtitle}>
          {isAddMode
            ? 'Answer a few quick questions so we can personalize your plan.'
            : "Tell us what you want to learn — we'll ask a few questions to tailor your roadmap."}
        </Text>

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
          disabled={chat.isLoading || generatePlan.isPending}
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
    padding: spacing.md,
    paddingBottom: spacing.lg,
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
  failureActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: onboardingColors.primary,
    borderRadius: 12,
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: onboardingColors.primaryText,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: onboardingColors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  generatingText: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
