import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Hide back chip but keep title centered (uses spacer). */
  showBack?: boolean;
  /** Use × close glyph instead of ← back. */
  closeStyle?: boolean;
};

/**
 * Inline page header (prefer AppChromeHeader for app-wide chrome).
 * back/close · centered title · optional right.
 */
export function ScreenHeader({
  title,
  onBack,
  right,
  showBack = true,
  closeStyle = false,
}: Props) {
  return (
    <View style={styles.header}>
      {showBack && onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.sideBtn}
          accessibilityLabel={closeStyle ? 'Close' : 'Go back'}
          hitSlop={8}
        >
          <Text style={styles.sideGlyph}>{closeStyle ? '×' : '←'}</Text>
        </Pressable>
      ) : (
        <View style={styles.sideSlot} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.sideSlot}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sideBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sideGlyph: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
  sideSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 40,
  },
});
