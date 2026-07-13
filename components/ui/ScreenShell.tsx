import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { dashboardColors } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';
import { useFloatingTabBarOccupiedHeight } from '@/hooks/useFloatingTabBarInset';

/** Bottom padding for scroll content on tab screens (clears floating pill + system inset). */
export function useTabScrollBottomInset(extra = 24): number {
  return useFloatingTabBarOccupiedHeight() + extra;
}

type Props = {
  children: ReactNode;
  /** Apply horizontal page padding (default true). */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ScreenShell({ children, padded = true, style }: Props) {
  return (
    <View style={[styles.root, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: dashboardColors.background,
    flex: 1,
    paddingTop: spacing.sm,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
});
