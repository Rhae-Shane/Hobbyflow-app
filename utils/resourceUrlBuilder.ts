import type { Modality } from '@/types/plan.types';

function normalizeHobby(hobby: string): string {
  return hobby.trim().toLowerCase();
}

export function buildSpotifySearchUrl(searchQuery: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;
}

export function buildResourceUrl(
  modality: Modality,
  searchQuery: string,
  hobby?: string,
): string {
  const query = encodeURIComponent(searchQuery);
  const hobbyKey = hobby ? normalizeHobby(hobby) : '';

  switch (modality) {
    case 'video':
      return `https://www.youtube.com/results?search_query=${query}`;
    case 'article':
      return `https://www.google.com/search?q=${query}`;
    case 'audio':
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${searchQuery} podcast`)}`;
    case 'interactive':
      if (hobbyKey === 'chess') {
        return `https://lichess.org/training`;
      }
      if (hobbyKey === 'guitar') {
        return `https://www.google.com/search?q=${encodeURIComponent(`guitar chord trainer ${searchQuery}`)}`;
      }
      if (hobbyKey === 'photography') {
        return `https://www.google.com/search?q=${encodeURIComponent(`photography exposure simulator ${searchQuery}`)}`;
      }
      return `https://www.google.com/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}
