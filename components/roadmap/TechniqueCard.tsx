import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Technique } from '@/types/plan.types';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, spacing } from '@/constants/tokens';

type Props = {
  technique: Technique;
  onPress: () => void;
};

export const TechniqueCard = memo(function TechniqueCard({ technique, onPress }: Props) {
  const skipped = technique.status === 'skipped';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, skipped && styles.skippedCard, pressed && styles.pressed]}
    >
      <Text style={[styles.title, skipped && styles.skippedText]}>{technique.name}</Text>
      <Text style={[styles.meta, skipped && styles.skippedMeta]}>
        ~{technique.estimatedMinutes} min · {technique.modality}
      </Text>
      <StatusBadge status={technique.status} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: '#1A1D26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  pressed: {
    opacity: 0.92,
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
  skippedMeta: {
    color: colors.skipped,
  },
});
