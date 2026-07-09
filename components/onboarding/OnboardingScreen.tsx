import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { InlineError } from '@/components/ui/InlineError';
import { BootSpinner } from '@/components/BootSpinner';
import { getStarterPlan } from '@/lib/starterPlans';
import { buildPlanRequestWithContext } from '@/lib/planRequestWithContext';
import { planRequestSchema } from '@/lib/validation/planRequest.schema';
import { useGeneratePlan } from '@/services/queries';
import { fetchUserPreferences } from '@/services/preferences';
import { completeOnboarding as markOnboardingComplete } from '@/services/user';
import { useAuth } from '@/hooks/useAuth';
import { useIsUserHydrated } from '@/hooks/useIsUserHydrated';
import { usePlanStore } from '@/store/usePlanStore';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import { hasCompletedOnboarding, useUserStore } from '@/store/useUserStore';
import { colors, radii, spacing } from '@/constants/tokens';
import type { OnboardingProfile, Plan } from '@/types/plan.types';
import { HobbyPicker } from '@/components/onboarding/HobbyPicker';

const LEVELS: { label: string; value: Plan['level'] }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const TIME_BUDGETS: OnboardingProfile['timeBudget'][] = [
  '15 min/day',
  '30 min/day',
  '1 hr/day',
];

const LOADING_MESSAGES = [
  'Generating your roadmap...',
  'Finding the right techniques...',
  'Almost done...',
];

const GENERATION_ERROR_MESSAGE = "Couldn't generate your roadmap.";

export function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAddMode = mode === 'add';
  const plan = usePlanStore((s) => s.plan);
  const hobbies = usePlanStore((s) => s.hobbies);
  const setPlan = usePlanStore((s) => s.setPlan);
  const setProfile = usePlanStore((s) => s.setProfile);
  const completedOnboardingAt = useUserStore((s) => s.completedOnboardingAt);
  const setCompletedOnboardingAt = useUserStore((s) => s.setCompletedOnboardingAt);
  const isUserHydrated = useIsUserHydrated();
  const generatePlan = useGeneratePlan();
  const preferences = usePreferencesStore((s) => s.preferences);
  const setPreferences = usePreferencesStore((s) => s.setPreferences);

  useEffect(() => {
    if (!isUserHydrated || isAddMode) return;
    if (hasCompletedOnboarding(completedOnboardingAt)) {
      router.replace('/(app)/(tabs)');
    }
  }, [completedOnboardingAt, isAddMode, isUserHydrated, router]);

  useEffect(() => {
    if (!isUserHydrated || isAddMode || !user || hasCompletedOnboarding(completedOnboardingAt)) return;
    if (hobbies.length === 0) return;

    let cancelled = false;
    markOnboardingComplete(user.id)
      .then(() => {
        if (cancelled) return;
        setCompletedOnboardingAt(new Date().toISOString());
        router.replace('/(app)/(tabs)');
      })
      .catch(() => {
        // User can finish hobby form manually if backfill fails.
      });

    return () => {
      cancelled = true;
    };
  }, [
    completedOnboardingAt,
    hobbies.length,
    isAddMode,
    isUserHydrated,
    router,
    setCompletedOnboardingAt,
    user,
  ]);

  const [hobby, setHobby] = useState('');
  const [level, setLevel] = useState<Plan['level']>('beginner');
  const [timeBudget, setTimeBudget] = useState<OnboardingProfile['timeBudget']>('30 min/day');
  const [goal, setGoal] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const lastRequestRef = useRef<ReturnType<typeof planRequestSchema.safeParse>['data'] | null>(
    null,
  );

  const isLoading = generatePlan.isPending;

  const finishHobbySetup = async (nextPlan: Plan, nextProfile: OnboardingProfile) => {
    if (isAddMode) {
      usePlanStore.getState().saveCurrentHobbySnapshot();
    }
    setPlan(nextPlan);
    setProfile(nextProfile);

    if (!isAddMode && user) {
      await markOnboardingComplete(user.id);
      setCompletedOnboardingAt(new Date().toISOString());
    }

    router.replace('/(app)/(tabs)');
  };

  const resolvePreferencesForPlan = async () => {
    if (preferences) return preferences;
    if (!user) return null;
    const fetched = await fetchUserPreferences(user.id);
    if (fetched) setPreferences(fetched);
    return fetched;
  };

  const handleContinue = async () => {
    setValidationError(null);
    setGenerationFailed(false);

    const prefsForPlan = await resolvePreferencesForPlan();
    const parsed = planRequestSchema.safeParse(
      buildPlanRequestWithContext({ hobby, level, goal, timeBudget }, prefsForPlan),
    );
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Please complete the form');
      return;
    }

    const duplicate = hobbies.find(
      (h) => h.name.toLowerCase() === parsed.data.hobby.trim().toLowerCase(),
    );
    if (isAddMode && duplicate) {
      setValidationError(
        `You already have "${duplicate.name}". Switch to it from the Progress tab.`,
      );
      return;
    }

    lastRequestRef.current = parsed.data;

    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const plan = await generatePlan.mutateAsync(parsed.data);
      await finishHobbySetup(plan, {
        hobby: parsed.data.hobby,
        level: parsed.data.level,
        goal: parsed.data.goal,
        timeBudget: parsed.data.timeBudget,
      });
    } catch {
      setGenerationFailed(true);
    } finally {
      clearInterval(interval);
    }
  };

  const handleUseStarterPlan = async () => {
    let payload = lastRequestRef.current;
    if (!payload) {
      const prefsForPlan = await resolvePreferencesForPlan();
      const parsed = planRequestSchema.safeParse(
        buildPlanRequestWithContext({ hobby, level, goal, timeBudget }, prefsForPlan),
      );
      if (!parsed.success) {
        setValidationError(parsed.error.issues[0]?.message ?? 'Please complete the form first');
        return;
      }
      payload = parsed.data;
    }

    const starter = getStarterPlan(payload);
    if (!starter) {
      setValidationError('Starter plans are available for Chess, Guitar, and Poker.');
      return;
    }

    setGenerationFailed(false);
    setValidationError(null);
    await finishHobbySetup(starter, {
      hobby: payload.hobby,
      level: payload.level,
      goal: payload.goal,
      timeBudget: payload.timeBudget,
    });
  };

  const starterAvailable = Boolean(getStarterPlan({ hobby, level, goal }));

  if (!isAddMode && !isUserHydrated) {
    return <BootSpinner />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isAddMode ? 'Add a hobby' : 'HobbyFlow'}</Text>
      <Text style={styles.subtitle}>
        {isAddMode
          ? 'Set up a new learning roadmap for another hobby.'
          : "Go with your hobby's flow."}
      </Text>

      <Text style={styles.label}>{isAddMode ? 'Choose a hobby' : 'Choose a hobby to begin'}</Text>
      {!hobby ? (
        <Text style={styles.emptyHint}>No roadmap yet — choose a hobby to begin.</Text>
      ) : null}
      <HobbyPicker value={hobby} onChange={setHobby} />

      <Text style={styles.label}>Current skill level</Text>
      <View style={styles.row}>
        {LEVELS.map((item) => {
          const selected = level === item.value;
          return (
            <Pressable
              key={item.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setLevel(item.value)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Your goal (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Beat my friends casually"
        placeholderTextColor={colors.textMuted}
        value={goal}
        onChangeText={setGoal}
      />

      <Text style={styles.label}>Time budget</Text>
      <View style={styles.row}>
        {TIME_BUDGETS.map((budget) => {
          const selected = timeBudget === budget;
          return (
            <Pressable
              key={budget}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setTimeBudget(budget)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{budget}</Text>
            </Pressable>
          );
        })}
      </View>

      {validationError ? <InlineError message={validationError} /> : null}

      {generationFailed ? (
        <View style={styles.failureCard}>
          <InlineError message={GENERATION_ERROR_MESSAGE} />
          <View style={styles.failureActions}>
            <Pressable
              style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Try Again</Text>
            </Pressable>
            {starterAvailable ? (
              <Pressable style={styles.button} onPress={handleUseStarterPlan}>
                <Text style={styles.buttonText}>Use Starter Plan</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, (!hobby || isLoading) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!hobby || isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.buttonText}>{LOADING_MESSAGES[loadingMessageIndex]}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Generate roadmap</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  failureCard: {
    gap: spacing.sm,
  },
  failureActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: colors.text,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
