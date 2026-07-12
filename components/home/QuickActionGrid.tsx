import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  dashboardColors,
  dashboardRadii,
  quickActionPalette,
} from '@/constants/dashboardTokens';
import { spacing } from '@/constants/tokens';

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  icon: (color: string) => ReactElement;
};

type Props = {
  onStreak: () => void;
  onPact: () => void;
  onGenerate: () => void;
};

function FlameIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C12 3 8 8 8 12.5C8 15.5 9.8 18 12 18C14.2 18 16 15.5 16 12.5C16 8 12 3 12 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M12 18C12 18 10.5 15.5 10.5 13.5C10.5 12 11.2 11 12 10.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function HandshakeIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12L8 8L12 11L16 7L20 11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 8V18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 7V18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SparkIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L13.5 9L19.5 10.5L13.5 12L12 18L10.5 12L4.5 10.5L10.5 9L12 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx="19" cy="5" r="1.5" fill={color} />
    </Svg>
  );
}

export function QuickActionGrid({ onStreak, onPact, onGenerate }: Props) {
  const actions: QuickAction[] = [
    {
      id: 'streak',
      title: 'Streak',
      subtitle: 'Keep it going',
      onPress: onStreak,
      icon: (c) => <FlameIcon color={c} />,
    },
    {
      id: 'pact',
      title: 'Pact',
      subtitle: 'Accountability',
      onPress: onPact,
      icon: (c) => <HandshakeIcon color={c} />,
    },
    {
      id: 'generate',
      title: 'Generate',
      subtitle: 'New roadmap',
      onPress: onGenerate,
      icon: (c) => <SparkIcon color={c} />,
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Quick actions</Text>
      <View style={styles.grid}>
        {actions.map((action, index) => {
          const palette = quickActionPalette[index % quickActionPalette.length];
          return (
            <Pressable
              key={action.id}
              style={[styles.tile, { backgroundColor: palette.background }]}
              onPress={action.onPress}
              testID={`quick-action-${action.id}`}
            >
              <View style={[styles.iconCircle, { backgroundColor: palette.iconBg }]}>
                {action.icon(dashboardColors.text)}
              </View>
              <View style={styles.tileText}>
                <Text style={styles.tileTitle}>{action.title}</Text>
                <Text style={styles.tileSub}>{action.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  heading: {
    color: dashboardColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    alignItems: 'center',
    borderRadius: dashboardRadii.tile,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: '48.5%',
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  tileText: {
    flex: 1,
  },
  tileTitle: {
    color: dashboardColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  tileSub: {
    color: dashboardColors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
});
