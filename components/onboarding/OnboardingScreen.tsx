import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGeneratePlan } from '@/services/queries';
import { usePlanStore } from '@/store/usePlanStore';
import { colors, radii, spacing } from '@/constants/tokens';
import type { OnboardingProfile, Plan } from '@/types/plan.types';
import { planRequestSchema } from '@/lib/validation/planRequest.schema';
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

export function OnboardingScreen() {
  const router = useRouter();
  const setProfile = usePlanStore((s) => s.setProfile);
  const generatePlan = useGeneratePlan();

  const [hobby, setHobby] = useState('');
  const [level, setLevel] = useState<Plan['level']>('beginner');
  const [timeBudget, setTimeBudget] = useState<OnboardingProfile['timeBudget']>('30 min/day');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const isLoading = generatePlan.isPending;

  const handleContinue = async () => {
    setError(null);

    const parsed = planRequestSchema.safeParse({ hobby, level, goal, timeBudget });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please complete the form');
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      await generatePlan.mutateAsync(parsed.data);
      setProfile({
        hobby: parsed.data.hobby,
        level: parsed.data.level,
        goal: parsed.data.goal,
        timeBudget: parsed.data.timeBudget,
      });
      router.replace('/(app)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>HobbyFlow</Text>
      <Text style={styles.subtitle}>Go with your hobby's flow.</Text>

      <Text style={styles.label}>Choose a hobby to begin</Text>
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
  error: {
    color: '#DC2626',
    fontSize: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
