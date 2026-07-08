import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../shared/theme/tokens';

export function ReplaceTechniqueSheet() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Too difficult?</Text>
      <Text style={styles.hint}>AI replacement flow — wire up next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
