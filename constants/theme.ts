/**
 * HobbyFlow global design system — Health Dashboard palette.
 * Soft gray canvas, lavender + orange accents, black CTAs, high radii.
 */
export const theme = {
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
    card: 24,
    sheet: 28,
    block: 30,
    strip: 24,
    tile: 22,
    input: 28,
    hero: 32,
    pill: 999,
    avatar: 999,
  },
  shadow: {
    color: '#141414',
    opacity: 0.07,
    radius: 12,
    offsetY: 4,
  },
} as const;

export type ThemeColors = typeof theme.colors;
