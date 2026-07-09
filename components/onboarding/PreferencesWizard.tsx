import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MultiSelectChips } from '@/components/onboarding/MultiSelectChips';
import { NotedSummaryStep } from '@/components/onboarding/NotedSummaryStep';
import { OtherInput } from '@/components/onboarding/OtherInput';
import { InlineError } from '@/components/ui/InlineError';
import {
  DAILY_GOAL_OPTIONS,
  DEFAULT_CONTENT_LANGUAGE,
  LEARNING_STYLES,
  TOP_GOALS,
  TOPIC_TAGS,
  USER_ROLES,
} from '@/constants/preferences';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { useAuth } from '@/hooks/useAuth';
import { getMotivationStats } from '@/lib/onboardingMotivation';
import { userPreferencesSchema } from '@/lib/validation/preferences.schema';
import { saveUserPreferences } from '@/services/preferences';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import type { UserPreferences } from '@/types/preferences.types';
import {
  appendUniqueCustom,
  getPreferencesResumeStepIndex,
  hasCompletedPreferences,
} from '@/types/preferences.types';

type StepKind = 'data' | 'interstitial' | 'summary' | 'daily';

type WizardStep = {
  id: string;
  kind: StepKind;
  title: string;
  subtitle?: string;
  dataKey?: keyof Pick<
    UserPreferences,
    'userRoles' | 'topGoals' | 'learningStyles' | 'selectedTags'
  >;
  minSelection?: number;
};

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'roles',
    kind: 'data',
    title: 'What types of work do you do?',
    subtitle: 'Select all that apply',
    dataKey: 'userRoles',
    minSelection: 1,
  },
  {
    id: 'goals',
    kind: 'data',
    title: 'What do you want to achieve?',
    subtitle: 'Select all that apply',
    dataKey: 'topGoals',
    minSelection: 1,
  },
  {
    id: 'interstitial-time',
    kind: 'interstitial',
    title: "Great! We'll help you learn what you thought you didn't have time for",
    subtitle: "Finally learn the things you've always wanted to learn!",
  },
  {
    id: 'learning-styles',
    kind: 'data',
    title: 'What matters to you when learning?',
    subtitle: 'Select all that apply',
    dataKey: 'learningStyles',
    minSelection: 1,
  },
  {
    id: 'interstitial-noted',
    kind: 'summary',
    title: 'Noted!',
    subtitle: "We'll try to satisfy all your learning needs",
  },
  {
    id: 'topics',
    kind: 'data',
    title: 'What topics interest you?',
    subtitle: "Don't worry, the choice won't limit your experience",
    dataKey: 'selectedTags',
    minSelection: 1,
  },
  {
    id: 'interstitial-topics',
    kind: 'interstitial',
    title: "Perfect choice! We'll use this to find the best roadmaps for you",
    subtitle: 'You can also create your own hobby roadmap for any topic you want to learn',
  },
  {
    id: 'interstitial-personalized',
    kind: 'interstitial',
    title: 'Personalized learning for you',
    subtitle:
      'We will use examples that are relevant to your role and expertise when helpful.\n\nYou can update this later in the settings.',
  },
  {
    id: 'daily-goal',
    kind: 'daily',
    title: 'How long do you want to learn every day?',
  },
  {
    id: 'interstitial-motivation',
    kind: 'interstitial',
    title: '',
    subtitle: '',
  },
];

const EMPTY_PREFERENCES: UserPreferences = {
  topGoals: [],
  selectedTags: [],
  userRoles: [],
  learningStyles: [],
  dailyGoal: '',
  contentLanguage: DEFAULT_CONTENT_LANGUAGE,
};

function getOptionsForKey(key: WizardStep['dataKey']): readonly string[] {
  switch (key) {
    case 'userRoles':
      return USER_ROLES;
    case 'topGoals':
      return TOP_GOALS;
    case 'learningStyles':
      return LEARNING_STYLES;
    case 'selectedTags':
      return TOPIC_TAGS;
    default:
      return [];
  }
}

function getChipLayout(stepId: string): 'list' | 'grid' | 'wrap' {
  if (stepId === 'roles' || stepId === 'goals') return 'list';
  if (stepId === 'learning-styles') return 'grid';
  return 'wrap';
}

export function PreferencesWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const storedPreferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);

  const [draft, setDraft] = useState<UserPreferences>(EMPTY_PREFERENCES);
  const [stepIndex, setStepIndex] = useState(0);
  const [otherText, setOtherText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)');
      return;
    }
    if (storedPreferences && hasCompletedPreferences(storedPreferences)) {
      router.replace('/(app)/onboarding');
      return;
    }
    const base = storedPreferences ?? EMPTY_PREFERENCES;
    setDraft(base);
    setStepIndex(getPreferencesResumeStepIndex(storedPreferences));
    setInitialized(true);
  }, [completedOnboardingAt, initialized, router, storedPreferences]);

  const step = WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  const motivation = useMemo(
    () => getMotivationStats(draft.dailyGoal || '10'),
    [draft.dailyGoal],
  );

  const getSelection = useCallback(
    (key: WizardStep['dataKey']): string[] => {
      if (!key) return [];
      return draft[key];
    },
    [draft],
  );

  const setSelection = useCallback((key: WizardStep['dataKey'], value: string[]) => {
    if (!key) return;
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const mergeOtherIntoDraft = useCallback(
    (key: WizardStep['dataKey']): UserPreferences => {
      if (!key) return draft;
      const merged = appendUniqueCustom(getSelection(key), otherText);
      return { ...draft, [key]: merged };
    },
    [draft, getSelection, otherText],
  );

  const canContinue = useCallback((): boolean => {
    if (!step) return false;
    if (step.kind === 'interstitial' || step.kind === 'summary') return true;
    if (step.kind === 'daily') return Boolean(draft.dailyGoal);
    if (!step.dataKey) return false;
    return getSelection(step.dataKey).length >= (step.minSelection ?? 1);
  }, [draft.dailyGoal, getSelection, step]);

  const persistDraft = async (nextDraft: UserPreferences) => {
    if (!user) {
      throw new Error('Not signed in');
    }
    await saveUserPreferences(user.id, nextDraft);
    setPreferences(nextDraft);
  };

  const handleBack = () => {
    setValidationError(null);
    setOtherText('');
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
    }
  };

  const handleContinue = async () => {
    setValidationError(null);

    if (!canContinue()) {
      setValidationError('Pick at least one option to continue.');
      return;
    }

    if (!user) {
      setValidationError('Please sign in to save your preferences.');
      return;
    }

    let nextDraft = draft;

    if (step.kind === 'data' && step.dataKey) {
      nextDraft = mergeOtherIntoDraft(step.dataKey);
      setDraft(nextDraft);
      setOtherText('');
    }

    const shouldSave =
      step.kind === 'data' || step.kind === 'daily' || (isLastStep && step.kind === 'interstitial');

    if (shouldSave) {
      setIsSaving(true);
      try {
        await persistDraft(nextDraft);
      } catch {
        setValidationError("Couldn't save your progress. Please try again.");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    if (isLastStep) {
      const parsed = userPreferencesSchema.safeParse(nextDraft);
      if (!parsed.success) {
        setValidationError('Please complete all preference steps.');
        return;
      }
      router.replace('/(app)/onboarding');
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const handleAddOther = () => {
    if (!step.dataKey || !otherText.trim()) return;
    const merged = appendUniqueCustom(getSelection(step.dataKey), otherText);
    setSelection(step.dataKey, merged);
    setOtherText('');
  };

  if (!initialized || !step) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={onboardingColors.primary} size="large" />
      </View>
    );
  }

  const motivationTitle = `That's more than ${motivation.booksPerMonth} book${motivation.booksPerMonth === 1 ? '' : 's'} of solid learning every month`;
  const motivationSubtitle = `${motivation.lessonsFirstWeek} lessons in your first week. You're on your way to building a lasting learning habit!`;

  const displayTitle =
    step.id === 'interstitial-motivation' ? motivationTitle : step.title;
  const displaySubtitle =
    step.id === 'interstitial-motivation' ? motivationSubtitle : step.subtitle;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{displayTitle}</Text>
        {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}

        {step.kind === 'data' && step.dataKey ? (
          <>
            <MultiSelectChips
              layout={getChipLayout(step.id)}
              minSelection={step.minSelection}
              options={getOptionsForKey(step.dataKey)}
              selected={getSelection(step.dataKey)}
              onChange={(value) => setSelection(step.dataKey, value)}
            />
            <OtherInput
              placeholder={
                step.id === 'topics' ? 'Other topics (optional)' : 'Other (optional)'
              }
              showAddButton={step.id === 'learning-styles' || step.id === 'topics'}
              value={otherText}
              onAdd={handleAddOther}
              onChange={setOtherText}
            />
          </>
        ) : null}

        {step.kind === 'summary' ? (
          <NotedSummaryStep selectedStyles={draft.learningStyles} />
        ) : null}

        {step.kind === 'daily' ? (
          <View style={styles.dailyList}>
            {DAILY_GOAL_OPTIONS.map((option) => {
              const selected = draft.dailyGoal === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.dailyRow, selected && styles.dailyRowSelected]}
                  onPress={() => setDraft((current) => ({ ...current, dailyGoal: option.value }))}
                >
                  <Text style={[styles.dailyPrimary, selected && styles.dailyTextSelected]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.dailySecondary, selected && styles.dailyTextSelected]}>
                    {option.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step.kind === 'interstitial' && step.id !== 'interstitial-motivation' ? (
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationEmoji}>
              {step.id === 'interstitial-noted'
                ? '🗳️'
                : step.id === 'interstitial-topics'
                  ? '👍'
                  : step.id === 'interstitial-personalized'
                    ? '🐦'
                    : '🔺'}
            </Text>
          </View>
        ) : null}

        {step.id === 'interstitial-motivation' ? (
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationEmoji}>🎯</Text>
          </View>
        ) : null}

        {validationError ? <InlineError message={validationError} /> : null}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 ? (
          <Pressable
            disabled={isSaving}
            onPress={handleBack}
            style={[styles.backButton, isSaving && styles.buttonDisabled]}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={!canContinue() || isSaving}
          onPress={handleContinue}
          style={[
            styles.continueButton,
            (!canContinue() || isSaving) && styles.buttonDisabled,
            stepIndex === 0 && styles.continueButtonFull,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={onboardingColors.primaryText} />
          ) : (
            <Text style={styles.continueText}>CONTINUE</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: onboardingColors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: onboardingColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    color: onboardingColors.text,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  illustrationEmoji: {
    fontSize: 72,
  },
  dailyList: {
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  dailyRow: {
    alignItems: 'center',
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dailyRowSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  dailyPrimary: {
    color: onboardingColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  dailySecondary: {
    color: onboardingColors.textMuted,
    fontSize: 15,
  },
  dailyTextSelected: {
    color: onboardingColors.primaryText,
  },
  footer: {
    borderTopColor: onboardingColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  continueButtonFull: {
    flex: 1,
  },
  continueText: {
    color: onboardingColors.primaryText,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
