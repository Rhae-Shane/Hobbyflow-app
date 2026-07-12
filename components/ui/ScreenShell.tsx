import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';
import { dashboardColors } from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';

/** Bottom padding for scroll content on tab screens (Ask Coach + tab pill). */
export const TAB_SCROLL_BOTTOM_INSET = FLOATING_TAB_BAR_HEIGHT + 24;

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
