import type { Modality } from '../types/plan.types';

export function buildResourceUrl(modality: Modality, searchQuery: string): string {
  const query = encodeURIComponent(searchQuery);

  switch (modality) {
    case 'video':
      return `https://www.youtube.com/results?search_query=${query}`;
    case 'article':
      return `https://www.google.com/search?q=${query}`;
    case 'audio':
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${searchQuery} podcast`)}`;
    case 'interactive':
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}
