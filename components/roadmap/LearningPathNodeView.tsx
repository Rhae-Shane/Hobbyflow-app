import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { spacing } from '@/constants/tokens';
import type { LearningPathNode } from '@/lib/roadmap/learningPathBuilder';
import { hapticLight } from '@/utils/haptics';

type Props = {
  item: LearningPathNode;
  sessionIndex?: number;
  onPress: (item: LearningPathNode) => void;
};

function iconFor(item: LearningPathNode): string {
  if (item.nodeKind === 'section_review') return '🔒';
  if (item.nodeKind === 'applied') return '✦';
  if (item.visualState === 'completed') return '✓';
  if (item.visualState === 'current') return '◎';
  return '◌';
}

function sessionLabel(item: LearningPathNode, sessionIndex?: number): string {
  if (item.subtitle) return item.subtitle;
  if (typeof sessionIndex === 'number') {
    return `Session ${String(sessionIndex).padStart(3, '0')}`;
  }
  return `Session ${String(item.pathOrder + 1).padStart(3, '0')}`;
}

export function LearningPathNodeView({ item, sessionIndex, onPress }: Props) {
  const isLocked = item.visualState === 'locked';
  const isCurrent = item.visualState === 'current';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLocked }}
      accessibilityLabel={`${item.label}${item.subtitle ? `, ${item.subtitle}` : ''}`}
      onPress={() => {
        if (!isLocked) hapticLight();
        onPress(item);
      }}
      style={[styles.card, isCurrent && styles.cardCurrent]}
      testID={`path-node-${item.id}`}
    >
      <View style={[styles.iconCircle, isLocked && styles.iconCircleMuted]}>
        <Text style={[styles.icon, isLocked && styles.iconMuted]}>{iconFor(item)}</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.label, isLocked && styles.labelMuted]} numberOfLines={2}>
          {item.label}
        </Text>
        <Text style={styles.subtitle}>{sessionLabel(item, sessionIndex)}</Text>
      </View>

      <View style={styles.chevronCircle}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 22,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  cardCurrent: {
    backgroundColor: '#ECECEC',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.avatar,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconCircleMuted: {
    backgroundColor: '#F3F3F5',
  },
  icon: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  iconMuted: {
    color: onboardingColors.textMuted,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  labelMuted: {
    color: onboardingColors.textMuted,
  },
  subtitle: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chevronCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.avatar,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  chevron: {
    color: onboardingColors.text,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
    marginTop: -1,
  },
});
