import { StyleSheet, Text, View } from 'react-native';
import type { TechniqueStatus } from '../../shared/types/plan.types';
import { colors, radii, spacing } from '../../shared/theme/tokens';

const LABELS: Record<TechniqueStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  mastered: 'Mastered',
  skipped: 'Skipped',
};

type Props = {
  status: TechniqueStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <View style={[styles.badge, status === 'skipped' && styles.skipped]}>
      <Text style={styles.text}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipped: {
    backgroundColor: '#F3F4F6',
  },
  text: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
