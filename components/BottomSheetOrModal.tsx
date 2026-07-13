import type { ReactNode } from 'react';
import {
  Modal,
  type DimensionValue,
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useResponsiveOverlay } from '@/hooks/useResponsiveOverlay';
import { colors, radii, spacing } from '@/constants/tokens';

type Presentation = 'sheet' | 'fullscreen';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Mobile sheet / desktop centered card, or edge-to-edge screen. */
  presentation?: Presentation;
  animationType?: 'slide' | 'fade' | 'none';
  showHandle?: boolean;
  maxHeight?: DimensionValue;
  /** Default true for sheet; ignored for fullscreen. */
  padded?: boolean;
  sheetStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  statusBarTranslucent?: boolean;
};

/**
 * Platform-aware overlay: bottom sheet on phone, centered modal on wide layouts.
 * Use `presentation="fullscreen"` for lesson players / immersive screens.
 */
export function BottomSheetOrModal({
  visible,
  onClose,
  children,
  presentation = 'sheet',
  animationType = 'slide',
  showHandle,
  maxHeight = '88%',
  padded = true,
  sheetStyle,
  backdropStyle,
  statusBarTranslucent,
}: Props) {
  const { isWide } = useResponsiveOverlay();
  const handleVisible = showHandle ?? (presentation === 'sheet' && !isWide);

  if (presentation === 'fullscreen') {
    return (
      <Modal
        visible={visible}
        animationType={animationType}
        onRequestClose={onClose}
        statusBarTranslucent={statusBarTranslucent}
      >
        <View style={styles.fullscreen}>{children}</View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      <Pressable
        style={[styles.backdrop, isWide && styles.backdropWide, backdropStyle]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.sheet,
            padded && styles.sheetPadded,
            { maxHeight },
            isWide && styles.sheetWide,
            sheetStyle,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {handleVisible ? <View style={styles.handle} /> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropWide: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    overflow: 'hidden',
    paddingBottom: spacing.xl,
  },
  sheetPadded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetWide: {
    borderRadius: radii.card,
    maxWidth: 420,
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 40,
  },
  fullscreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
