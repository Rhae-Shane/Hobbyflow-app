import type { Modality } from '@/types/plan.types';

const YOUTUBE_APP_SCHEMES = ['youtube:', 'vnd.youtube:'] as const;

export function shouldOpenResourceInApp(modality: Modality): boolean {
  return modality === 'video' || modality === 'audio';
}

export function toInAppYouTubeUrl(url: string): string {
  return url.replace('https://www.youtube.com/', 'https://m.youtube.com/');
}

export function shouldAllowResourceNavigation(url: string): boolean {
  const lower = url.toLowerCase();

  if (YOUTUBE_APP_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return false;
  }

  if (lower.startsWith('intent://') && lower.includes('youtube')) {
    return false;
  }

  if (lower.startsWith('market://')) {
    return false;
  }

  return lower.startsWith('http://') || lower.startsWith('https://') || lower === 'about:blank';
}
