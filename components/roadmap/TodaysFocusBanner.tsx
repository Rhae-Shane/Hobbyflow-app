import { StyleSheet, Text, View } from 'react-native';
import type { Technique } from '@/types/plan.types';
import { colors, radii, spacing } from '@/constants/tokens';

type Props = {
  technique: Technique | null;
};

export function TodaysFocusBanner({ technique }: Props) {
  if (!technique) {
    return (
      <View style={styles.banner}>
        <Text style={styles.label}>Today's Focus</Text>
        <Text style={styles.title}>🎉 Roadmap complete</Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.label}>Today's Focus</Text>
      <Text style={styles.title}>
        {technique.name} · ~{technique.estimatedMinutes} min
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  label: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
