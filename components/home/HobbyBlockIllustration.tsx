import { SvgUri } from 'react-native-svg';
import {
  CATEGORY_ILLUSTRATIONS,
  HOME_ILLUSTRATION_POOL,
  MeditatingDoodle,
  PlantDoodle,
} from '@/components/home/categoryIllustrations';

export {
  CameraDoodle,
  MeditatingDoodle,
  PlantDoodle,
  ReadingDoodle,
  RunningDoodle,
  SittingDoodle,
  HOME_ILLUSTRATION_POOL,
  CATEGORY_ILLUSTRATIONS,
} from '@/components/home/categoryIllustrations';

function hashTitle(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function isRemoteUrl(url: string | null | undefined): url is string {
  return Boolean(url && /^https?:\/\//i.test(url));
}

export function HobbyBlockIllustration({
  title,
  index = 0,
  illustrationKey,
  illustrationUrl,
  width = 120,
  height = 120,
  color = '#1C1A17',
}: {
  title: string;
  index?: number;
  /** Unique key from hobby_category.illustration_key */
  illustrationKey?: string | null;
  /** Optional remote SVG (Supabase Storage / CDN). */
  illustrationUrl?: string | null;
  width?: number;
  height?: number;
  color?: string;
}) {
  if (isRemoteUrl(illustrationUrl)) {
    return <SvgUri uri={illustrationUrl} width={width} height={height} />;
  }

  if (illustrationKey && CATEGORY_ILLUSTRATIONS[illustrationKey]) {
    const Comp = CATEGORY_ILLUSTRATIONS[illustrationKey];
    return <Comp width={width} height={height} color={color} />;
  }

  const pick = (hashTitle(title) + index) % HOME_ILLUSTRATION_POOL.length;
  const Comp = HOME_ILLUSTRATION_POOL[pick] ?? MeditatingDoodle;
  return <Comp width={width} height={height} color={color} />;
}

/** Stable empty-state art (reuses plant from the home pool). */
export function HomeEmptyIllustration({
  width = 140,
  height = 140,
}: {
  width?: number;
  height?: number;
}) {
  return <PlantDoodle width={width} height={height} />;
}
