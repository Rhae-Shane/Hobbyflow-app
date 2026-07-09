import { StyleSheet, Text, View } from 'react-native';
import { LEARNING_STYLE_SUPPORT } from '@/constants/preferences';
import { onboardingColors } from '@/constants/onboardingTokens';
import { spacing } from '@/constants/tokens';

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
            <Text style={styles.bullet}>•</Text>
            <Text
              style={[
                styles.bulletText,
                highlightSelected && isSelected && styles.bulletTextSelected,
              ]}
            >
              {item}
              {highlightSelected && isSelected ? ' ✓' : ''}
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
    gap: spacing.lg,
    width: '100%',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    color: onboardingColors.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  bulletText: {
    color: onboardingColors.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  bulletTextSelected: {
    color: onboardingColors.text,
    fontWeight: '700',
  },
});
