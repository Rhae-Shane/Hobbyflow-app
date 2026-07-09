import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';

type Props = {
  isPending: boolean;
  isError: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

export function ReplaceTechniqueSheet({ isPending, isError, onClose, onRetry }: Props) {
  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.title}>Finding an easier alternative...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Couldn't find a replacement — keep current technique</Text>
        <View style={styles.actions}>
          {onRetry ? (
            <Pressable style={styles.button} onPress={onRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.text,
  },
});
