import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../shared/theme/tokens';

type Props = {
  days: number;
};

export function StreakBadge({ days }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{days > 0 ? `🔥 ${days} day streak` : 'Start your streak'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
