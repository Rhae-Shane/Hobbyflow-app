import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '../../shared/theme/tokens';

export function TechniqueDetailScreen() {
  const { techniqueId } = useLocalSearchParams<{ techniqueId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Technique Detail</Text>
      {techniqueId ? (
        <Text style={styles.id}>ID: {techniqueId}</Text>
      ) : null}
      <Text style={styles.hint}>Status actions and resource links go here.</Text>
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
  id: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: spacing.md,
  },
});
