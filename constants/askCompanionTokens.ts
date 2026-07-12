import { theme } from '@/constants/theme';

/**
 * Ask Companion — soft blue hero (companion mock) on the shared
 * Health Dashboard pastel system (lavender / orange accents elsewhere).
 */
export const askCompanionColors = {
  background: theme.colors.background,
  surface: theme.colors.surface,
  hero: '#D6EBFF',
  heroDeep: '#B7DBFF',
  text: theme.colors.text,
  textMuted: theme.colors.textMuted,
  chipActive: theme.colors.cta,
  chipActiveText: theme.colors.ctaText,
  chipBorder: theme.colors.border,
  cta: theme.colors.cta,
  accentSoft: theme.colors.navActiveSoft,
  milestone: '#D6EBFF',
  wave: 'rgba(255,255,255,0.85)',
} as const;

export const askCompanionRadii = {
  sheet: theme.radii.sheet,
  hero: theme.radii.hero,
  input: theme.radii.input,
  chip: theme.radii.pill,
  control: theme.radii.pill,
} as const;
