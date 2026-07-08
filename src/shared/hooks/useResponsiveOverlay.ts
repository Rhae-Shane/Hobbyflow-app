import { useWindowDimensions } from 'react-native';

export function useResponsiveOverlay() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return { isWide };
}
