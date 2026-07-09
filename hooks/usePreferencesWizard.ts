import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { getMotivationStats } from '@/lib/onboardingMotivation';
import {
  EMPTY_PREFERENCES,
  getPreferencesResumeStepIndex,
  WIZARD_STEPS,
  type PreferenceDataKey,
  type WizardStep,
} from '@/lib/preferencesWizardSteps';
import { userPreferencesSchema } from '@/lib/validation/preferences.schema';
import { saveUserPreferences } from '@/services/preferences';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import type { UserPreferences } from '@/types/preferences.types';
import { appendUniqueCustom, hasCompletedPreferences } from '@/types/preferences.types';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';

const VALIDATION_MESSAGES = {
  minSelection: 'Pick at least one option to continue.',
  notSignedIn: 'Please sign in to save your preferences.',
  saveFailed: "Couldn't save your progress. Please try again.",
  incomplete: 'Please complete all preference steps.',
} as const;

export function usePreferencesWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const storedPreferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const isUserHydrated = useIsUserHydrated();

  const [draft, setDraft] = useState<UserPreferences>(EMPTY_PREFERENCES);
  const [stepIndex, setStepIndex] = useState(0);
  const [otherText, setOtherText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Always honor cloud onboarding status — even after the wizard has initialized.
  useEffect(() => {
    if (!isUserHydrated) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)');
    }
  }, [completedOnboardingAt, isUserHydrated, router]);

  useEffect(() => {
    if (!isUserHydrated || initialized) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) return;
    if (storedPreferences && hasCompletedPreferences(storedPreferences)) {
      router.replace('/(app)/onboarding');
      return;
    }
    const base = storedPreferences ?? EMPTY_PREFERENCES;
    setDraft(base);
    setStepIndex(getPreferencesResumeStepIndex(storedPreferences));
    setInitialized(true);
  }, [completedOnboardingAt, initialized, isUserHydrated, router, storedPreferences]);

  const step = WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  const motivation = useMemo(
    () => getMotivationStats(draft.dailyGoal || '10'),
    [draft.dailyGoal],
  );

  const motivationTitle = `That's more than ${motivation.booksPerMonth} book${motivation.booksPerMonth === 1 ? '' : 's'} of solid learning every month`;
  const motivationSubtitle = `${motivation.lessonsFirstWeek} lessons in your first week. You're on your way to building a lasting learning habit!`;

  const displayTitle =
    step?.id === 'interstitial-motivation' ? motivationTitle : (step?.title ?? '');
  const displaySubtitle =
    step?.id === 'interstitial-motivation' ? motivationSubtitle : step?.subtitle;

  const getSelection = useCallback(
    (dataKey: PreferenceDataKey): string[] => draft[dataKey],
    [draft],
  );

  const setSelection = useCallback((dataKey: PreferenceDataKey, value: string[]) => {
    setDraft((current) => ({ ...current, [dataKey]: value }));
  }, []);

  const setDailyGoal = useCallback((dailyGoal: string) => {
    setDraft((current) => ({ ...current, dailyGoal }));
  }, []);

  const mergeOtherIntoDraft = useCallback(
    (dataKey: PreferenceDataKey): UserPreferences => {
      const merged = appendUniqueCustom(getSelection(dataKey), otherText);
      return { ...draft, [dataKey]: merged };
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
    if (!step) return;

    setValidationError(null);

    if (!canContinue()) {
      setValidationError(VALIDATION_MESSAGES.minSelection);
      return;
    }

    if (!user) {
      setValidationError(VALIDATION_MESSAGES.notSignedIn);
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
        setValidationError(VALIDATION_MESSAGES.saveFailed);
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    if (isLastStep) {
      const parsed = userPreferencesSchema.safeParse(nextDraft);
      if (!parsed.success) {
        setValidationError(VALIDATION_MESSAGES.incomplete);
        return;
      }
      router.replace('/(app)/onboarding');
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const handleAddOther = () => {
    if (!step?.dataKey || !otherText.trim()) return;
    const merged = appendUniqueCustom(getSelection(step.dataKey), otherText);
    setSelection(step.dataKey, merged);
    setOtherText('');
  };

  return {
    step,
    stepIndex,
    draft,
    otherText,
    setOtherText,
    validationError,
    isSaving,
    initialized: initialized && isUserHydrated,
    displayTitle,
    displaySubtitle,
    canContinue,
    handleBack,
    handleContinue,
    handleAddOther,
    getSelection,
    setSelection,
    setDailyGoal,
  };
}

export type { WizardStep };
