/** Shared layout constants — keep free of heavy UI imports for test isolation. */

/** Extra gap between the floating pill and the home indicator / nav buttons. */
export const FLOATING_TAB_BAR_BOTTOM_GAP = 10;

/**
 * Tab bar (~58) + bottom gap (10) ≈ 68, with a little buffer.
 * Does not include system safe-area — add `bottomSafeArea` via helpers.
 * Use on Feed / Generation / Profile / Courses.
 */
export const FLOATING_TAB_BAR_HEIGHT = 78;

/**
 * Ask Coach (~46) + gap (10) + tab bar — Home only.
 * Does not include system safe-area — add `bottomSafeArea` via helpers.
 */
export const FLOATING_TAB_BAR_HEIGHT_WITH_ASK = 122;

/** Padding under the floating pill so it clears 3-button nav / home indicator. */
export function floatingTabBarPaddingBottom(bottomSafeArea: number): number {
  return FLOATING_TAB_BAR_BOTTOM_GAP + Math.max(0, bottomSafeArea);
}

/** Vertical space the floating tab bar occupies, including system inset. */
export function floatingTabBarOccupiedHeight(
  bottomSafeArea: number,
  withAsk = false,
): number {
  const base = withAsk ? FLOATING_TAB_BAR_HEIGHT_WITH_ASK : FLOATING_TAB_BAR_HEIGHT;
  return base + Math.max(0, bottomSafeArea);
}
