import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import type { SocialPlatform } from '@/types/post.types';

export const SOCIAL_PLATFORM_BRAND: Record<
  SocialPlatform,
  { color: string; bg: string }
> = {
  instagram: { color: '#E1306C', bg: '#FCE7F0' },
  youtube: { color: '#FF0000', bg: '#FFE5E5' },
  tiktok: { color: '#111111', bg: '#ECECEC' },
  x: { color: '#111111', bg: '#ECECEC' },
  linkedin: { color: '#0A66C2', bg: '#E5F0FA' },
  github: { color: '#181717', bg: '#ECECEC' },
  website: { color: '#2563EB', bg: '#E8EEFC' },
  other: { color: '#6B7280', bg: '#F0F0F2' },
};

type Props = {
  platform: SocialPlatform;
  size?: number;
  /** Override brand color (e.g. muted when disabled). */
  color?: string;
};

export function SocialPlatformIcon({ platform, size = 16, color }: Props) {
  const brand = SOCIAL_PLATFORM_BRAND[platform] ?? SOCIAL_PLATFORM_BRAND.other;
  const tint = color ?? brand.color;

  switch (platform) {
    case 'instagram':
      return <FontAwesome5 name="instagram" brand size={size} color={tint} />;
    case 'youtube':
      return <FontAwesome5 name="youtube" brand size={size} color={tint} />;
    case 'tiktok':
      return <FontAwesome5 name="tiktok" brand size={size} color={tint} />;
    case 'x':
      return <FontAwesome6 name="x-twitter" brand size={size} color={tint} />;
    case 'linkedin':
      return <FontAwesome5 name="linkedin-in" brand size={size} color={tint} />;
    case 'github':
      return <FontAwesome5 name="github" brand size={size} color={tint} />;
    case 'website':
      return <FontAwesome5 name="globe" size={size} color={tint} />;
    case 'other':
    default:
      return <FontAwesome5 name="link" size={size} color={tint} />;
  }
}
