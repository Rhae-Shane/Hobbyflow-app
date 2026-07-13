import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { HobbyBlockIllustration } from '@/components/home/HobbyBlockIllustration';
import { ChevronRightIcon } from '@/components/icons/AppIcons';
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

function LockIcon({ color = onboardingColors.textMuted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 11V8.5C8 6.01472 10.0147 4 12.5 4C14.9853 4 17 6.01472 17 8.5V11"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M7 11H18C18.8284 11 19.5 11.6716 19.5 12.5V18.5C19.5 19.3284 18.8284 20 18 20H7C6.17157 20 5.5 19.3284 5.5 18.5V12.5C5.5 11.6716 6.17157 11 7 11Z"
        stroke={color}
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function CheckIcon({ color = onboardingColors.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 12.5L10.2 16.5L18 8"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CurrentIcon({ color = onboardingColors.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7.25" stroke={color} strokeWidth={1.9} />
      <Circle cx="12" cy="12" r="3" fill={color} />
    </Svg>
  );
}

function SessionIcon({ item }: { item: LearningPathNode }) {
  if (item.nodeKind === 'practice') {
    return <CurrentIcon color={onboardingColors.primaryText} />;
  }
  if (item.visualState === 'locked') {
    return <LockIcon />;
  }
  if (item.visualState === 'skipped') {
    return <LockIcon color={onboardingColors.textMuted} />;
  }
  if (item.visualState === 'completed') {
    return <CheckIcon />;
  }
  if (item.visualState === 'current') {
    return <CurrentIcon />;
  }
  return <HobbyBlockIllustration title={item.label} width={34} height={34} />;
}

function sessionLabel(item: LearningPathNode, sessionIndex?: number): string {
  if (item.visualState === 'skipped') return 'Skipped';
  if (item.subtitle) return item.subtitle;
  if (typeof sessionIndex === 'number') {
    return `Session ${String(sessionIndex).padStart(3, '0')}`;
  }
  return `Session ${String(item.pathOrder + 1).padStart(3, '0')}`;
}

export function LearningPathNodeView({ item, sessionIndex, onPress }: Props) {
  const isLocked = item.visualState === 'locked';
  const isCurrent = item.visualState === 'current';
  const isSkipped = item.visualState === 'skipped';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLocked }}
      accessibilityLabel={`${item.label}${item.subtitle ? `, ${item.subtitle}` : ''}${isSkipped ? ', skipped' : ''}`}
      onPress={() => {
        if (!isLocked) hapticLight();
        onPress(item);
      }}
      style={[styles.card, isCurrent && styles.cardCurrent, isSkipped && styles.cardSkipped]}
      testID={`path-node-${item.id}`}
    >
      <View style={[styles.iconCircle, (isLocked || isSkipped) && styles.iconCircleMuted]}>
        <SessionIcon item={item} />
      </View>

      <View style={styles.textBlock}>
        <Text
          style={[styles.label, (isLocked || isSkipped) && styles.labelMuted, isSkipped && styles.labelSkipped]}
          numberOfLines={2}
        >
          {item.label}
        </Text>
        <Text style={styles.subtitle}>{sessionLabel(item, sessionIndex)}</Text>
      </View>

      <View style={styles.chevronCircle}>
        <ChevronRightIcon size={16} color={onboardingColors.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.card,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  cardCurrent: {
    backgroundColor: '#ECECEC',
  },
  cardSkipped: {
    opacity: 0.72,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.avatar,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  iconCircleMuted: {
    backgroundColor: '#F3F3F5',
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
  labelSkipped: {
    textDecorationLine: 'line-through',
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
});
