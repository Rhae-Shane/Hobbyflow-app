import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { HobbyBlockIllustration } from '@/components/home/HobbyBlockIllustration';
import {
  dashboardColors,
  dashboardRadii,
  hobbyBlockPalette,
} from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';

export type HobbyBlockProgress = {
  completed: number;
  total: number;
};

type Props = {
  title: string;
  index: number;
  progress?: HobbyBlockProgress;
  ctaLabel?: string;
  onPress: () => void;
  /** Fixed width for horizontal scroll; omit to flex-fill a 2-column row. */
  width?: number;
  illustrationKey?: string | null;
  illustrationUrl?: string | null;
};

function ProgressRing({ completed, total }: HobbyBlockProgress) {
  const size = 36;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(1, completed / total) : 0;
  const offset = c * (1 - ratio);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={dashboardColors.ringTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={dashboardColors.ringFill}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringText}>
        {completed}/{Math.max(total, 1)}
      </Text>
    </View>
  );
}

export function HobbyRoadmapBlock({
  title,
  index,
  progress,
  ctaLabel = 'OPEN',
  onPress,
  width,
  illustrationKey,
  illustrationUrl,
}: Props) {
  const palette = hobbyBlockPalette[index % hobbyBlockPalette.length];

  return (
    <Pressable
      style={[
        styles.block,
        { backgroundColor: palette.background },
        width != null ? { width, flex: 0, flexBasis: width } : null,
      ]}
      onPress={onPress}
      testID={`hobby-block-${index}`}
    >
      <View style={styles.top}>
        <View style={[styles.miniIcon, { backgroundColor: palette.iconBg }]}>
          <Text style={styles.miniIconText}>HF</Text>
        </View>
        {progress ? (
          <ProgressRing completed={progress.completed} total={progress.total} />
        ) : (
          <View style={styles.ringPlaceholder} />
        )}
      </View>

      <Text style={styles.title} numberOfLines={3}>
        {title}
      </Text>

      <View style={styles.art}>
        <HobbyBlockIllustration
          title={title}
          index={index}
          illustrationKey={illustrationKey}
          illustrationUrl={illustrationUrl}
          width={100}
          height={100}
        />
      </View>

      <Pressable style={styles.cta} onPress={onPress}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </Pressable>
  );
}

export function AddHobbyGhostBlock({
  onPress,
  width,
}: {
  onPress: () => void;
  width?: number;
}) {
  return (
    <Pressable
      style={[
        styles.ghost,
        width != null ? { width, flex: 0, flexBasis: width } : null,
      ]}
      onPress={onPress}
      testID="hobby-block-add"
    >
      <Text style={styles.ghostPlus}>+</Text>
      <Text style={styles.ghostTitle}>Add a hobby</Text>
      <Text style={styles.ghostBody}>Generate a new roadmap</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: dashboardRadii.block,
    flex: 1,
    minHeight: 280,
    padding: spacing.md,
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  miniIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  miniIconText: {
    color: dashboardColors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  ringWrap: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  ringText: {
    color: dashboardColors.text,
    fontSize: 9,
    fontWeight: '800',
    position: 'absolute',
  },
  ringPlaceholder: {
    height: 36,
    width: 36,
  },
  title: {
    color: dashboardColors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 22,
    minHeight: 66,
  },
  art: {
    alignItems: 'center',
    height: 110,
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: dashboardColors.cta,
    borderRadius: dashboardRadii.pill,
    marginTop: 'auto',
    paddingVertical: 12,
  },
  ctaText: {
    color: dashboardColors.ctaText,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ghost: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: dashboardColors.weekEmpty,
    borderRadius: dashboardRadii.block,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 280,
    padding: spacing.md,
  },
  ghostPlus: {
    color: dashboardColors.text,
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 8,
  },
  ghostTitle: {
    color: dashboardColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  ghostBody: {
    color: dashboardColors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
