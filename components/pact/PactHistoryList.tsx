import { StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { UserPactRow } from '@/types/pact.types';

type Props = {
  items: UserPactRow[];
};

export function PactHistoryList({ items }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No past pacts yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}
        >
          <View style={styles.rowBody}>
            <Text style={styles.hobby}>{item.hobby_name ?? 'Hobby'}</Text>
            <Text style={styles.promise} numberOfLines={2}>
              {item.promise_text}
            </Text>
            <Text style={styles.meta}>
              {item.start_date} → {item.end_date}
            </Text>
          </View>
          <Text style={[styles.status, item.status === 'fulfilled' ? styles.kept : styles.broken]}>
            {item.status === 'fulfilled' ? 'Kept' : 'Broken'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomColor: onboardingColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  hobby: {
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  promise: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  kept: {
    color: '#2F6B4F',
  },
  broken: {
    color: '#9B3B3B',
  },
  empty: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
  },
  emptyText: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
});
