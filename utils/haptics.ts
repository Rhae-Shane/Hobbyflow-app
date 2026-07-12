import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const canHaptic = Platform.OS === 'ios' || Platform.OS === 'android';

function run(fn: () => Promise<unknown>): void {
  if (!canHaptic) return;
  void fn().catch(() => {
    // Haptics are best-effort; never surface failures to UI.
  });
}

/** Soft tap — buttons, general presses. */
export function hapticLight(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Stronger tap — primary CTAs, FAB. */
export function hapticMedium(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Selection change — tabs, chips, toggles. */
export function hapticSelection(): void {
  run(() => Haptics.selectionAsync());
}

/** Successful commit — mark done, master, like, pact complete. */
export function hapticSuccess(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Destructive / caution — delete confirm, abandon. */
export function hapticWarning(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Failure feedback. */
export function hapticError(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
