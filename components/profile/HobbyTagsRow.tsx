import { StyleSheet, Text, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';

export type HobbyTagChip = {
  hobbyId?: number | null;
  name: string;
  source?: 'catalog' | 'custom';
};

type Props = {
  tags: HobbyTagChip[];
  /** Center chips (public/own profile) vs start (goal card) */
  align?: 'center' | 'flex-start';
};

export function HobbyTagsRow({ tags, align = 'center' }: Props) {
  if (!tags.length) return null;

  return (
    <View style={[styles.row, { justifyContent: align }]}>
      {tags.map((tag) => (
        <View key={`${tag.source ?? 'tag'}-${tag.hobbyId ?? tag.name}`} style={styles.chip}>
          <Text style={styles.label} numberOfLines={1}>
            {tag.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: onboardingColors.chipSelectedBackground,
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 160,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    color: onboardingColors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
});
