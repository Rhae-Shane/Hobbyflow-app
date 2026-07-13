import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  floatingTabBarOccupiedHeight,
  floatingTabBarPaddingBottom,
} from '@/components/navigation/tabBarLayout';

/** Bottom padding for the floating tab bar chrome (above system buttons / gesture bar). */
export function useFloatingTabBarPaddingBottom(): number {
  const { bottom } = useSafeAreaInsets();
  return floatingTabBarPaddingBottom(bottom);
}

/**
 * Space scroll content should leave clear of the floating tab bar.
 * Button nav → larger inset; gesture nav → smaller / near bottom.
 */
export function useFloatingTabBarOccupiedHeight(withAsk = false): number {
  const { bottom } = useSafeAreaInsets();
  return floatingTabBarOccupiedHeight(bottom, withAsk);
}
