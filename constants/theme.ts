import { fonts, typeRoles } from '@/constants/typography';

/**
 * HobbyFlow global design system — Health Dashboard palette.
 * Soft gray canvas, lavender + orange accents, black CTAs, moderate radii.
 * Type: Fraunces (display) + DM Sans (body).
 */
export const theme = {
  fonts,
  type: typeRoles,
  colors: {
    background: '#F6F6F6',
    surface: '#FFFFFF',
    text: '#141414',
    textMuted: '#8A8F98',
    border: '#E8E8EC',
    /** Soft lavender — primary brand wash */
    primary: '#E8D5F5',
    primaryBorder: '#D4B8E8',
    primaryText: '#141414',
    /** Soft lavender highlight */
    accent: '#E8D5F5',
    accentSoft: '#F3EAF8',
    /** Warm orange — active / notification accent */
    accentDeep: '#FF8A3D',
    accentOrange: '#FFB86B',
    accentOrangeSoft: '#FFE4D1',
    cta: '#141414',
    ctaText: '#FFFFFF',
    success: '#059669',
    danger: '#A14A3A',
    chipBackground: '#FFFFFF',
    chipSelectedBackground: '#F3EAF8',
    weekFill: '#141414',
    weekEmpty: '#E8E8EC',
    weekToday: '#FF8A3D',
    /** Soft blue — nav active / secondary wash */
    navActive: '#5B9FE8',
    navActiveSoft: '#D8EEF8',
    hero: '#E8D5F5',
    heroDeep: '#D4B8E8',
  },
  radii: {
    /** Soft feed / surface cards (Learn in public) */
    card: 26,
    sheet: 28,
    /** Pastel hobby / hero tiles */
    block: 28,
    strip: 24,
    tile: 22,
    input: 18,
    hero: 28,
    pill: 999,
    avatar: 999,
  },
  shadow: {
    color: '#141414',
    opacity: 0.06,
    radius: 12,
    offsetY: 4,
  },
} as const;

export type ThemeColors = typeof theme.colors;
