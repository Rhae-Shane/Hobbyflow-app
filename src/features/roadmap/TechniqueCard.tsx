import { StyleSheet, Text, View } from 'react-native';
import type { Technique } from '../../shared/types/plan.types';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { colors, radii, spacing } from '../../shared/theme/tokens';

type Props = {
  technique: Technique;
};

export function TechniqueCard({ technique }: Props) {
  const skipped = technique.status === 'skipped';

  return (
    <View style={[styles.card, skipped && styles.skippedCard]}>
      <Text style={[styles.title, skipped && styles.skippedText]}>{technique.name}</Text>
      <Text style={styles.meta}>~{technique.estimatedMinutes} min · {technique.modality}</Text>
      <StatusBadge status={technique.status} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  skippedCard: {
    opacity: 0.6,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skippedText: {
    color: colors.skipped,
    textDecorationLine: 'line-through',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
