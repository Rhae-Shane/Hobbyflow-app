import { theme } from '@/constants/theme';

/** Home dashboard — Health Dashboard lavender / orange pastels. */
export const dashboardColors = {
  background: theme.colors.background,
  surface: theme.colors.surface,
  text: theme.colors.text,
  textMuted: theme.colors.textMuted,
  accent: theme.colors.accentDeep,
  accentSoft: theme.colors.accentOrangeSoft,
  cta: theme.colors.cta,
  ctaText: theme.colors.ctaText,
  weekFill: theme.colors.weekFill,
  weekEmpty: theme.colors.weekEmpty,
  weekToday: theme.colors.weekToday,
  ringTrack: 'rgba(20,20,20,0.12)',
  ringFill: theme.colors.cta,
} as const;

/** Hobby roadmap blocks — lavender, orange, soft teal, soft apricot. */
export const hobbyBlockPalette = [
  { background: '#E8D5F5', iconBg: 'rgba(255,255,255,0.55)' },
  { background: '#FFB86B', iconBg: 'rgba(255,255,255,0.45)' },
  { background: '#B8E4E0', iconBg: 'rgba(255,255,255,0.55)' },
  { background: '#F5D5C8', iconBg: 'rgba(255,255,255,0.5)' },
] as const;

/** Quick action tiles — blue, orange, purple, mint. */
export const quickActionPalette = [
  { background: '#D8EEF8', iconBg: '#B9DFF0' },
  { background: '#FFE4C8', iconBg: '#FFD0A0' },
  { background: '#E8D5F5', iconBg: '#D4B8E8' },
  { background: '#D8F0E4', iconBg: '#B5E0CC' },
] as const;

export const dashboardRadii = {
  block: theme.radii.block,
  strip: theme.radii.strip,
  tile: theme.radii.tile,
  avatar: theme.radii.avatar,
  pill: theme.radii.pill,
} as const;
