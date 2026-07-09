import { StyleSheet, Text, View } from 'react-native';
import type { TechniqueStatus } from '@/types/plan.types';
import { colors, radii, spacing } from '@/constants/tokens';

const LABELS: Record<TechniqueStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  mastered: 'Mastered',
  skipped: 'Skipped',
};

const STATUS_STYLES: Record<TechniqueStatus, { badge: object; text: object }> = {
  todo: {
    badge: { backgroundColor: colors.border },
    text: { color: colors.textMuted },
  },
  in_progress: {
    badge: { backgroundColor: '#EEF2FF' },
    text: { color: colors.primary },
  },
  mastered: {
    badge: { backgroundColor: '#D1FAE5' },
    text: { color: colors.success },
  },
  skipped: {
    badge: { backgroundColor: '#F3F4F6' },
    text: { color: colors.skipped },
  },
};

type Props = {
  status: TechniqueStatus;
};

export function StatusBadge({ status }: Props) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <View style={[styles.badge, statusStyle.badge]}>
      <Text style={[styles.text, statusStyle.text]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
