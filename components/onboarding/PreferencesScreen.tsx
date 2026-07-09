import { useState } from 'react';
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
import { InlineError } from '@/components/ui/InlineError';
import {
  DAILY_GOAL_OPTIONS,
  DEFAULT_CONTENT_LANGUAGE,
  LEARNING_STYLES,
  TOP_GOALS,
  TOPIC_TAGS,
  USER_ROLES,
} from '@/constants/preferences';
import { colors, radii, spacing } from '@/constants/tokens';
import { saveUserPreferences } from '@/services/preferences';
import { useAuth } from '@/hooks/useAuth';
import { usePreferencesStore } from '@/store/usePreferencesStore';
import type { UserPreferences } from '@/types/preferences.types';

const STEPS = [
  {
    key: 'topGoals',
    title: 'What are your top goals?',
    subtitle: 'Pick everything that motivates you to learn.',
    minSelection: 1,
  },
  {
    key: 'selectedTags',
    title: 'Topics of interest',
    subtitle: 'What do you want to explore or get better at?',
    minSelection: 1,
  },
  {
    key: 'userRoles',
    title: 'What best describes you?',
    subtitle: 'Optional — helps us tailor recommendations.',
    minSelection: 0,
  },
  {
    key: 'learningStyles',
    title: 'How do you like to learn?',
    subtitle: 'Choose your preferred learning styles.',
    minSelection: 1,
  },
  {
    key: 'dailyGoal',
    title: 'Daily learning goal',
    subtitle: 'How much time can you commit each day?',
    minSelection: 1,
  },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const setPreferences = usePreferencesStore((s) => s.setPreferences);

  const [stepIndex, setStepIndex] = useState(0);
  const [topGoals, setTopGoals] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState('10');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const getSelection = (key: StepKey): string[] => {
    switch (key) {
      case 'topGoals':
        return topGoals;
      case 'selectedTags':
        return selectedTags;
      case 'userRoles':
        return userRoles;
      case 'learningStyles':
        return learningStyles;
      default:
        return dailyGoal ? [dailyGoal] : [];
    }
  };

  const setSelection = (key: StepKey, value: string[]) => {
    switch (key) {
      case 'topGoals':
        setTopGoals(value);
        break;
      case 'selectedTags':
        setSelectedTags(value);
        break;
      case 'userRoles':
        setUserRoles(value);
        break;
      case 'learningStyles':
        setLearningStyles(value);
        break;
    }
  };

  const canContinue = () => {
    if (step.key === 'dailyGoal') {
      return Boolean(dailyGoal);
    }
    return getSelection(step.key).length >= step.minSelection;
  };

  const handleBack = () => {
    setValidationError(null);
    if (stepIndex === 0) return;
    setStepIndex((current) => current - 1);
  };

  const handleContinue = async () => {
    setValidationError(null);

    if (!canContinue()) {
      setValidationError(
        step.minSelection > 0 ? 'Pick at least one option to continue.' : 'Select an option to continue.',
      );
      return;
    }

    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    if (!user) {
      setValidationError('Please sign in to save your preferences.');
      return;
    }

    const preferences: UserPreferences = {
      topGoals,
      selectedTags,
      userRoles,
      learningStyles,
      dailyGoal,
      contentLanguage: DEFAULT_CONTENT_LANGUAGE,
    };

    setIsSaving(true);
    try {
      await saveUserPreferences(user.id, preferences);
      setPreferences(preferences);
      router.replace('/(app)/onboarding');
    } catch {
      setValidationError("Couldn't save your preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.progressRow}>
        {STEPS.map((item, index) => (
          <View
            key={item.key}
            style={[styles.progressDot, index <= stepIndex && styles.progressDotActive]}
          />
        ))}
      </View>

      <Text style={styles.stepLabel}>
        Step {stepIndex + 1} of {STEPS.length}
      </Text>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.subtitle}>{step.subtitle}</Text>

      {step.key === 'dailyGoal' ? (
        <View style={styles.row}>
          {DAILY_GOAL_OPTIONS.map((option) => {
            const selected = dailyGoal === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setDailyGoal(option.value)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <MultiSelectChips
          options={
            step.key === 'topGoals'
              ? TOP_GOALS
              : step.key === 'selectedTags'
                ? TOPIC_TAGS
                : step.key === 'userRoles'
                  ? USER_ROLES
                  : LEARNING_STYLES
          }
          selected={getSelection(step.key)}
          onChange={(value) => setSelection(step.key, value)}
          minSelection={step.minSelection}
        />
      )}

      {validationError ? <InlineError message={validationError} /> : null}

      <View style={styles.actions}>
        {stepIndex > 0 ? (
          <Pressable
            disabled={isSaving}
            onPress={handleBack}
            style={[styles.button, styles.buttonSecondary, isSaving && styles.buttonDisabled]}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Back</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={!canContinue() || isSaving}
          onPress={handleContinue}
          style={[styles.button, (!canContinue() || isSaving) && styles.buttonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{isLastStep ? 'Continue to hobby setup' : 'Next'}</Text>
          )}
        </Pressable>
      </View>
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
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressDot: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    flex: 1,
    height: 4,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.sm,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    flex: 1,
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
});
