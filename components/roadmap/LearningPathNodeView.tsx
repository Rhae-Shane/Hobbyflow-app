import { Pressable, StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';
import type { LearningPathNode } from '@/lib/roadmap/learningPathBuilder';

const STAGGER_PX = [0, 28, 48, 20] as const;

type Props = {
  item: LearningPathNode;
  onPress: (item: LearningPathNode) => void;
};

function iconFor(item: LearningPathNode): string {
  if (item.nodeKind === 'section_review') return '🔒';
  if (item.nodeKind === 'applied') return '⚙';
  if (item.visualState === 'completed') return '✓';
  if (item.visualState === 'current') return '●';
  return '◷';
}

export function LearningPathNodeView({ item, onPress }: Props) {
  const isCurrent = item.visualState === 'current';
  const isLocked = item.visualState === 'locked';
  const isCompleted = item.visualState === 'completed';
  const offset = STAGGER_PX[item.staggerIndex] ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLocked }}
      accessibilityLabel={`${item.label}${item.subtitle ? `, ${item.subtitle}` : ''}`}
      onPress={() => onPress(item)}
      style={[styles.row, { marginLeft: offset }]}
      testID={`path-node-${item.id}`}
    >
      <View style={styles.rail}>
        <View
          style={[
            styles.circle,
            isCurrent && styles.circleCurrent,
            isLocked && styles.circleLocked,
            isCompleted && styles.circleCompleted,
          ]}
        >
          {isCurrent ? <View style={styles.glow} pointerEvents="none" /> : null}
          <Text style={[styles.icon, isCurrent && styles.iconCurrent]}>{iconFor(item)}</Text>
        </View>
      </View>
      <View style={styles.labelBlock}>
        <Text style={[styles.label, isLocked && styles.labelMuted]}>{item.label}</Text>
        {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.sm,
  },
  rail: {
    alignItems: 'center',
    width: 88,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 32,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  circleCurrent: {
    borderColor: onboardingColors.primaryBorder,
    height: 76,
    width: 76,
    borderRadius: 38,
  },
  circleLocked: {
    backgroundColor: '#F7F3EA',
    borderColor: '#D4CEC4',
  },
  circleCompleted: {
    backgroundColor: '#E8F6FE',
    borderColor: onboardingColors.primaryBorder,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124, 203, 250, 0.28)',
    borderRadius: 38,
  },
  icon: {
    color: onboardingColors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  iconCurrent: {
    color: onboardingColors.primaryText,
    fontSize: 22,
  },
  labelBlock: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.md,
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
    fontSize: 12,
    fontWeight: '500',
  },
});
