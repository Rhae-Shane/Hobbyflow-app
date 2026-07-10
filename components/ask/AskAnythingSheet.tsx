import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ACTIONS = [
  { id: 'lessons', label: 'Ask questions about lessons', icon: '🎓' },
  { id: 'feedback', label: 'Share feedback', icon: '💬' },
  { id: 'history', label: 'Continue a past conversation', icon: '🕐' },
] as const;

export function AskAnythingSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.topRow}>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} style={styles.closePill} accessibilityLabel="Close">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.promo}>
            <View style={styles.mascot}>
              <Text style={styles.mascotGlyph}>✦</Text>
            </View>
            <View style={styles.bubble}>
              <Text style={styles.proLabel}>SOON</Text>
              <Text style={styles.bubbleText}>
                Ask freely about your roadmap, lessons, and practice — chat is coming next.
              </Text>
            </View>
          </View>

          <Text style={styles.heading}>How can I help you today?</Text>

          <View style={styles.actions}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                style={styles.actionRow}
                onPress={onClose}
                accessibilityLabel={action.label}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              editable={false}
              placeholder="Ask a question about your learning..."
              placeholderTextColor={onboardingColors.textMuted}
              style={styles.input}
            />
            <View style={styles.micBtn}>
              <Text style={styles.micText}>🎙</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(44, 36, 22, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: onboardingColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D4CEC4',
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  closePill: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeText: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  promo: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mascot: {
    alignItems: 'center',
    backgroundColor: '#2C2416',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  mascotGlyph: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: spacing.sm,
  },
  proLabel: {
    color: onboardingColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bubbleText: {
    color: onboardingColors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  heading: {
    color: onboardingColors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  actions: {
    gap: spacing.sm,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
    width: 28,
  },
  actionLabel: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  input: {
    color: onboardingColors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  micBtn: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  micText: {
    fontSize: 16,
  },
});
