import { theme } from '@/constants/theme';

export const colors = {
  background: theme.colors.background,
  surface: theme.colors.surface,
  text: theme.colors.text,
  textMuted: theme.colors.textMuted,
  border: theme.colors.border,
  primary: theme.colors.accentDeep,
  success: theme.colors.success,
  skipped: theme.colors.textMuted,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  card: theme.radii.card,
  pill: theme.radii.pill,
} as const;

export { fonts, typeRoles as type } from '@/constants/typography';
