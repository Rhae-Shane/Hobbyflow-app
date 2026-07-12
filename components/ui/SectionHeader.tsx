import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dashboardColors } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <View style={styles.row}>
          <Text style={styles.title}>{title}</Text>
          {actionLabel && onAction ? (
            <Pressable onPress={onAction} hitSlop={8}>
              <Text style={styles.action}>{actionLabel}</Text>
            </Pressable>
          ) : (
            right
          )}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  textCol: {
    gap: 4,
  },
  row: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: dashboardColors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: dashboardColors.textMuted,
    fontSize: 13,
  },
  action: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
});
