import { StyleSheet, Text, View } from 'react-native';
import { PromptBrandDoodle } from '@/components/onboarding/optionIcons';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';

type Props = {
  title: string;
  subtitle?: string;
};

/** Brand mark + speech bubble prompt (white-theme conversational header). */
export function OnboardingPromptBubble({ title, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <PromptBrandDoodle width={36} height={36} color={theme.colors.text} />
      </View>
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  brand: {
    alignItems: 'center',
    backgroundColor: theme.colors.navActiveSoft,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    marginTop: 4,
    width: 48,
  },
  bubble: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.block,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  tail: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 1,
    height: 12,
    left: -6,
    position: 'absolute',
    top: 18,
    transform: [{ rotate: '-45deg' }],
    width: 12,
  },
  title: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
