import { Image, type ImageStyle, type StyleProp, StyleSheet } from 'react-native';
import { brandLogo } from '@/constants/brand';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/** Rounded HobbyFlow app mark for auth, chrome, and onboarding. */
export function BrandLogo({
  size = 40,
  style,
  accessibilityLabel = 'HobbyFlow',
}: BrandLogoProps) {
  return (
    <Image
      source={brandLogo}
      accessibilityLabel={accessibilityLabel}
      style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: 'hidden',
  },
});
