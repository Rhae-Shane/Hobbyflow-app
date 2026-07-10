import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import dayjs from 'dayjs';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { PACT_MIN_DAYS, PACT_PROMISE_MAX_LEN } from '@/lib/pact/constants';
import {
  earliestEndDate,
  endDateForDuration,
  pactValidationMessage,
  validatePactDraft,
} from '@/lib/pact/pactMath';
import { toDateKey } from '@/lib/gamification/streakMath';
import type { HobbyRow } from '@/types/user.types';

const DURATION_OPTIONS = [
  { id: '7', label: '1 week', days: 7 },
  { id: '14', label: '2 weeks', days: 14 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: '365', label: '1 year', days: 365 },
] as const;

type DeadlineMode = 'preset' | 'custom';

type Props = {
  hobbies: HobbyRow[];
  isMutating: boolean;
  onSubmit: (input: {
    hobbyId: string;
    promiseText: string;
    endDate: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
};

function normalizeDateInput(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && dayjs(trimmed).isValid()) {
    return trimmed;
  }
  return trimmed;
}

export function PactCreateForm({ hobbies, isMutating, onSubmit }: Props) {
  const startDate = toDateKey();
  const minEnd = earliestEndDate(startDate);

  const [hobbyId, setHobbyId] = useState(hobbies[0]?.id ?? '');
  const [promiseText, setPromiseText] = useState('');
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('preset');
  const [durationDays, setDurationDays] = useState(PACT_MIN_DAYS);
  const [customEndDate, setCustomEndDate] = useState(minEnd);
  const [error, setError] = useState<string | null>(null);

  const endDate = useMemo(() => {
    if (deadlineMode === 'custom') {
      return normalizeDateInput(customEndDate) || minEnd;
    }
    return endDateForDuration(startDate, durationDays);
  }, [customEndDate, deadlineMode, durationDays, minEnd, startDate]);

  const previewRange = useMemo(
    () => ({ startDate, endDate }),
    [endDate, startDate],
  );

  const selectPreset = (days: number) => {
    setDeadlineMode('preset');
    setDurationDays(days);
    setError(null);
  };

  const selectCustom = () => {
    setDeadlineMode('custom');
    setCustomEndDate((prev) => {
      const normalized = normalizeDateInput(prev);
      if (normalized >= minEnd) return normalized;
      return minEnd;
    });
    setError(null);
  };

  const onPickCalendarDate = (dateKey: string) => {
    setDeadlineMode('custom');
    setCustomEndDate(dateKey);
    setError(null);
  };

  const handleSeal = async () => {
    setError(null);
    const draftError = validatePactDraft({
      hobbyId,
      promiseText,
      startDate,
      endDate,
    });
    if (draftError) {
      setError(pactValidationMessage(draftError));
      return;
    }
    const result = await onSubmit({ hobbyId, promiseText, endDate });
    if (!result.ok) setError(result.message);
  };

  if (hobbies.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Add a hobby first</Text>
        <Text style={styles.emptyBody}>
          Seal a goal for a hobby you already own — like “make my jump 6 feet by this date.”
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.lead}>
        A pact is one goal with a deadline — not something you check off every day. Give yourself at
        least a week.
      </Text>

      <Text style={styles.label}>Hobby</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {hobbies.map((hobby) => {
          const selected = hobby.id === hobbyId;
          return (
            <Pressable
              key={hobby.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setHobbyId(hobby.id)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{hobby.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Your goal</Text>
      <TextInput
        style={styles.input}
        value={promiseText}
        onChangeText={setPromiseText}
        placeholder="Make my jump 6 feet"
        placeholderTextColor={onboardingColors.textMuted}
        multiline
        maxLength={PACT_PROMISE_MAX_LEN}
      />
      <Text style={styles.hint}>
        {promiseText.trim().length}/{PACT_PROMISE_MAX_LEN}
      </Text>

      <Text style={styles.label}>Deadline</Text>
      <Text style={styles.hint}>
        Starts today ({startDate}). Earliest deadline: {minEnd}. No maximum.
      </Text>
      <View style={styles.chipsWrap}>
        {DURATION_OPTIONS.map((opt) => {
          const selected = deadlineMode === 'preset' && durationDays === opt.days;
          return (
            <Pressable
              key={opt.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => selectPreset(opt.days)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, deadlineMode === 'custom' && styles.chipSelected]}
          onPress={selectCustom}
          accessibilityLabel="Custom deadline date"
        >
          <Text style={[styles.chipText, deadlineMode === 'custom' && styles.chipTextSelected]}>
            Custom
          </Text>
        </Pressable>
      </View>

      {deadlineMode === 'custom' ? (
        <View style={styles.customRow}>
          <Text style={styles.customLabel}>End date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.dateInput}
            value={customEndDate}
            onChangeText={(text) => {
              setCustomEndDate(text);
              setError(null);
            }}
            placeholder={minEnd}
            placeholderTextColor={onboardingColors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Custom end date"
          />
        </View>
      ) : null}

      <Text style={styles.endDate}>Complete by {endDate}</Text>

      <Text style={styles.label}>Calendar</Text>
      <StreakCalendar
        activityDates={[]}
        saverUsedDates={[]}
        pactRange={previewRange}
        selectableMin={minEnd}
        onSelectDate={onPickCalendarDate}
        selectHint="Tap a day to set a custom deadline (any future date ≥ 1 week)"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryBtn, isMutating && styles.btnDisabled]}
        onPress={() => {
          void handleSeal();
        }}
        disabled={isMutating}
        accessibilityLabel="Seal the Pact"
      >
        <Text style={styles.primaryText}>{isMutating ? 'Sealing…' : 'Seal the Pact'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 6,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: onboardingColors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyBody: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  lead: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  label: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: onboardingColors.chipBackground,
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
  },
  chipText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: onboardingColors.primaryText,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#FDFBF0',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 15,
    minHeight: 88,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  customRow: {
    gap: 6,
  },
  customLabel: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: '#FDFBF0',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  endDate: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: '#9B3B3B',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primary,
    borderRadius: radii.card,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  primaryText: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
