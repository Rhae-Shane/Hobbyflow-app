import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  EMPTY_PREFERENCES,
  getPreferencesResumeStepIndex,
  isPresetSingleValue,
  WIZARD_STEPS,
  type PreferenceDataKey,
  type PreferenceSingleKey,
  type WizardStep,
} from '@/lib/preferencesWizardSteps';
import { userPreferencesSchema } from '@/lib/validation/preferences.schema';
import { saveUserPreferences } from '@/services/preferences';
import { completeOnboarding } from '@/services/user';
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

function resolveSingleValue(
  singleKey: PreferenceSingleKey,
  draft: UserPreferences,
  otherText: string,
): string {
  const trimmedOther = otherText.trim();
  if (trimmedOther) return trimmedOther;

  const current = draft[singleKey]?.trim() ?? '';
  if (!current) return '';

  if (singleKey === 'userRole' && !isPresetSingleValue(singleKey, current)) {
    return current;
  }

  return current;
}

export function usePreferencesWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const storedPreferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);
  const isUserHydrated = useIsUserHydrated();

  const [draft, setDraft] = useState<UserPreferences>(EMPTY_PREFERENCES);
  const [stepIndex, setStepIndex] = useState(0);
  const [otherText, setOtherText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isUserHydrated) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)');
    }
  }, [completedOnboardingAt, isUserHydrated, router]);

  useEffect(() => {
    if (!isUserHydrated || initialized) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) return;

    const base = storedPreferences ?? EMPTY_PREFERENCES;
    setDraft(base);

    if (hasCompletedPreferences(storedPreferences)) {
      setInitialized(true);
      // Prefs may already be saved while completed_onboarding_at is still null
      // (e.g. user quit before the last interstitial). Persist the flag, then leave.
      if (!user) {
        router.replace('/(app)/(tabs)');
        return;
      }
      void completeOnboarding(user.id)
        .then(() => {
          setCompletedOnboardingAt(new Date().toISOString());
        })
        .catch(() => {
          // Still enter the app; hydrate backfill can retry the cloud write.
        })
        .finally(() => {
          router.replace('/(app)/(tabs)');
        });
      return;
    }

    setStepIndex(getPreferencesResumeStepIndex(storedPreferences));
    setInitialized(true);
  }, [
    completedOnboardingAt,
    initialized,
    isUserHydrated,
    router,
    setCompletedOnboardingAt,
    storedPreferences,
    user,
  ]);

  const step = WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  const getSelection = useCallback(
    (dataKey: PreferenceDataKey): string[] => draft[dataKey],
    [draft],
  );

  const setSelection = useCallback((dataKey: PreferenceDataKey, value: string[]) => {
    setDraft((current) => ({ ...current, [dataKey]: value }));
  }, []);

  const setSingleField = useCallback((singleKey: PreferenceSingleKey, value: string) => {
    setOtherText('');
    setDraft((current) => ({ ...current, [singleKey]: value }));
  }, []);

  const mergeOtherIntoDraft = useCallback(
    (dataKey: PreferenceDataKey): UserPreferences => {
      const merged = appendUniqueCustom(getSelection(dataKey), otherText);
      return { ...draft, [dataKey]: merged };
    },
    [draft, getSelection, otherText],
  );

  const mergeSingleIntoDraft = useCallback(
    (singleKey: PreferenceSingleKey): UserPreferences => {
      const value = resolveSingleValue(singleKey, draft, otherText);
      return { ...draft, [singleKey]: value };
    },
    [draft, otherText],
  );

  const canContinue = useCallback((): boolean => {
    if (!step) return false;
    if (step.kind === 'interstitial' || step.kind === 'summary') return true;

    if (step.kind === 'single' && step.singleKey) {
      const resolved = resolveSingleValue(step.singleKey, draft, otherText);
      return resolved.trim().length > 0;
    }

    if (!step.dataKey) return false;
    return getSelection(step.dataKey).length >= (step.minSelection ?? 1);
  }, [draft, getSelection, otherText, step]);

  const persistDraft = async (nextDraft: UserPreferences) => {
    if (!user) {
      throw new Error('Not signed in');
    }
    const { preferencesComplete } = await saveUserPreferences(user.id, nextDraft);
    setPreferences(nextDraft);
    if (preferencesComplete) {
      setCompletedOnboardingAt(new Date().toISOString());
    }
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

    if (step.kind === 'single' && step.singleKey) {
      nextDraft = mergeSingleIntoDraft(step.singleKey);
      setDraft(nextDraft);
      setOtherText('');
    }

    const shouldSave =
      step.kind === 'data' ||
      step.kind === 'single' ||
      (isLastStep && step.kind === 'interstitial');

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

      if (!hasCompletedOnboarding(useUserStore.getState().completedOnboardingAt)) {
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

      router.replace('/(app)/(tabs)');
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
    displayTitle: step?.title ?? '',
    displaySubtitle: step?.subtitle,
    canContinue,
    handleBack,
    handleContinue,
    handleAddOther,
    getSelection,
    setSelection,
    setSingleField,
  };
}

export type { WizardStep };
