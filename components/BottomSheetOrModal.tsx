import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useResponsiveOverlay } from '@/hooks/useResponsiveOverlay';
import { colors, radii, spacing } from '@/constants/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheetOrModal({ visible, onClose, children }: Props) {
  const { isWide } = useResponsiveOverlay();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, isWide && styles.backdropWide]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.sheet, isWide && styles.sheetWide]}
          onPress={(e) => e.stopPropagation()}
        >
          {!isWide ? <View style={styles.handle} /> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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
});
