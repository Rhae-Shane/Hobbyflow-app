/**
 * HobbyFlow typefaces — Fraunces (display) + DM Sans (body).
 * Avoids system / Inter-default assignment look.
 */
export const fonts = {
  /** Soft serif for brand + hero headlines */
  display: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  /** Clean sans for UI, body, labels */
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export type FontToken = (typeof fonts)[keyof typeof fonts];

/** Ready-made text role styles (pair with color/size in screens). */
export const typeRoles = {
  brand: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  hero: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
  },
} as const;
