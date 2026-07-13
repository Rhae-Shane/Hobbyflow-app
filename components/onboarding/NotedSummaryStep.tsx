import { StyleSheet, Text, View } from 'react-native';
import { LEARNING_STYLE_SUPPORT } from '@/constants/preferences';
import { onboardingColors } from '@/constants/onboardingTokens';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

type Props = {
  selectedStyles: string[];
};

function BulletList({
  title,
  items,
  selectedStyles,
  highlightSelected,
}: {
  title: string;
  items: readonly string[];
  selectedStyles: string[];
  highlightSelected?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => {
        const isSelected = selectedStyles.includes(item);
        return (
          <View key={item} style={styles.bulletRow}>
            <View style={[styles.dot, highlightSelected && isSelected && styles.dotSelected]} />
            <Text
              style={[
                styles.bulletText,
                highlightSelected && isSelected && styles.bulletTextSelected,
              ]}
            >
              {item}
              {highlightSelected && isSelected ? ' · selected' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function NotedSummaryStep({ selectedStyles }: Props) {
  return (
    <View style={styles.container}>
      <BulletList
        title="HobbyFlow currently supports:"
        items={LEARNING_STYLE_SUPPORT.currentlySupports}
        selectedStyles={selectedStyles}
        highlightSelected
      />
      <BulletList
        title="We're working on:"
        items={LEARNING_STYLE_SUPPORT.workingOn}
        selectedStyles={selectedStyles}
        highlightSelected
      />
      <BulletList
        title="HobbyFlow also supports:"
        items={LEARNING_STYLE_SUPPORT.alsoSupports}
        selectedStyles={selectedStyles}
        highlightSelected
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.block,
    gap: spacing.lg,
    padding: spacing.md,
    width: '100%',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    backgroundColor: onboardingColors.border,
    borderRadius: 4,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  dotSelected: {
    backgroundColor: theme.colors.accentDeep,
  },
  bulletText: {
    color: onboardingColors.textMuted,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bulletTextSelected: {
    color: onboardingColors.text,
    fontFamily: fonts.bodyBold,
  },
});
