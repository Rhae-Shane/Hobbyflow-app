import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/tokens';

export function RoadmapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Roadmap</Text>
      <Text style={styles.hint}>No roadmap yet — complete onboarding to begin.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
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
    marginTop: spacing.md,
  },
});
