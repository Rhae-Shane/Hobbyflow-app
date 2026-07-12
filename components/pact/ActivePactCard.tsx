import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import { canFulfillPact, daysRemaining } from '@/lib/pact/pactMath';
import type { UserPactRow } from '@/types/pact.types';
import { hapticSuccess, hapticWarning } from '@/utils/haptics';

type Props = {
  pact: UserPactRow;
  isMutating: boolean;
  onComplete: () => void;
  onAbandon: () => void;
};

export function ActivePactCard({ pact, isMutating, onComplete, onAbandon }: Props) {
  const remaining = daysRemaining(pact.end_date);
  const hobbyLabel = pact.hobby_name ?? 'Hobby';
  const canComplete = canFulfillPact(pact.start_date, pact.end_date);
  const completeDisabled = isMutating || !canComplete;

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>Active goal</Text>
        <Text style={styles.countdown}>
          {remaining === 0
            ? 'Deadline is today'
            : `${remaining} day${remaining === 1 ? '' : 's'} until deadline`}
        </Text>
      </View>
      <Text style={styles.hobby}>{hobbyLabel}</Text>
      <Text style={styles.promise}>{pact.promise_text}</Text>
      <Text style={styles.dates}>
        Deadline {pact.end_date} · sealed {pact.start_date}
      </Text>
      <Text style={styles.hint}>
        Not a daily checklist — hit this goal once, then tap Complete before the deadline.
      </Text>

      <Pressable
        style={[styles.primaryBtn, completeDisabled && styles.btnDisabled]}
        onPress={() => {
          hapticSuccess();
          onComplete();
        }}
        disabled={completeDisabled}
        accessibilityLabel="Complete pact"
      >
        <Text style={styles.primaryText}>
          {isMutating ? 'Saving…' : canComplete ? 'Complete pact' : 'Deadline passed'}
        </Text>
      </Pressable>

      {!canComplete ? (
        <Text style={styles.warn}>
          You can only complete a pact on or before the end date.
        </Text>
      ) : null}

      <Pressable
        style={[styles.secondaryBtn, isMutating && styles.btnDisabled]}
        onPress={() => {
          hapticWarning();
          onAbandon();
        }}
        disabled={isMutating}
        accessibilityLabel="Abandon pact"
      >
        <Text style={styles.secondaryText}>Abandon pact</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F8FA',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: onboardingColors.primaryText,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdown: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  hobby: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  promise: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  dates: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  warn: {
    color: '#9B3B3B',
    fontSize: 12,
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
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryText: {
    color: onboardingColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
