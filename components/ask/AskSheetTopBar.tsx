import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CloseIcon, HistoryIcon, PlusIcon } from '@/components/icons/AppIcons';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

type Props = {
  title?: string | null;
  onNewChat: () => void;
  onHistory: () => void;
  onClose: () => void;
};

export function AskSheetTopBar({ title, onNewChat, onHistory, onClose }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onNewChat} style={styles.pill} accessibilityLabel="New chat">
        <PlusIcon size={14} color={onboardingColors.text} />
        <Text style={styles.pillText}>New</Text>
      </Pressable>
      <Pressable onPress={onHistory} style={styles.pill} accessibilityLabel="Chat history">
        <HistoryIcon size={14} color={onboardingColors.text} />
        <Text style={styles.pillText}>History</Text>
      </Pressable>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <Pressable onPress={onClose} style={styles.closePill} accessibilityLabel="Close">
        <CloseIcon size={12} color={onboardingColors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 1,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    color: onboardingColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: onboardingColors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  closePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: onboardingColors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
