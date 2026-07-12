import { theme } from '@/constants/theme';

/** App-wide palette — Health Dashboard pastels. */
export const onboardingColors = {
  background: theme.colors.background,
  primary: theme.colors.primary,
  primaryBorder: theme.colors.primaryBorder,
  primaryText: theme.colors.primaryText,
  text: theme.colors.text,
  textMuted: theme.colors.textMuted,
  border: theme.colors.border,
  chipBackground: theme.colors.chipBackground,
  chipSelectedBackground: theme.colors.chipSelectedBackground,
} as const;
