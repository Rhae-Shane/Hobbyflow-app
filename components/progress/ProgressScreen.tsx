import { StyleSheet, Text, View } from 'react-native';
import { StreakBadge } from '@/components/progress/StreakBadge';
import { colors, spacing } from '@/constants/tokens';

export function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <StreakBadge days={0} />
      <Text style={styles.hint}>Mastered / active summary goes here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
