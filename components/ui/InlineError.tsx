import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/tokens';

type Props = {
  message: string;
};

export function InlineError({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm,
  },
  text: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
  },
});
