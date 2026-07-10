import type { LeagueRow } from '@/types/gamification.types';
import { clampRating, STARTING_RATING } from '@/lib/gamification/constants';

/** Fallback bands if leagues table has not been fetched yet. */
export const FALLBACK_LEAGUES: LeagueRow[] = [
  { id: 'wood', name: 'Wood', sort_order: 1, min_rating: 699, max_rating: 799, color_hex: '#A67C52', icon_key: 'wood' },
  { id: 'bronze', name: 'Bronze', sort_order: 2, min_rating: 800, max_rating: 999, color_hex: '#CD7F32', icon_key: 'bronze' },
  { id: 'silver', name: 'Silver', sort_order: 3, min_rating: 1000, max_rating: 1199, color_hex: '#C0C0C0', icon_key: 'silver' },
  { id: 'gold', name: 'Gold', sort_order: 4, min_rating: 1200, max_rating: 1399, color_hex: '#D4AF37', icon_key: 'gold' },
  { id: 'platinum', name: 'Platinum', sort_order: 5, min_rating: 1400, max_rating: 1599, color_hex: '#7CCBFA', icon_key: 'platinum' },
  { id: 'diamond', name: 'Diamond', sort_order: 6, min_rating: 1600, max_rating: 1799, color_hex: '#5BB8F0', icon_key: 'diamond' },
  { id: 'master', name: 'Master', sort_order: 7, min_rating: 1800, max_rating: 1999, color_hex: '#7C3AED', icon_key: 'master' },
  { id: 'legend', name: 'Legend', sort_order: 8, min_rating: 2000, max_rating: 99999, color_hex: '#E11D48', icon_key: 'legend' },
];

export function resolveLeagueId(rating: number, leagues: LeagueRow[] = FALLBACK_LEAGUES): string {
  const match = leagues.find((l) => rating >= l.min_rating && rating <= l.max_rating);
  return match?.id ?? 'wood';
}

export function findLeague(leagueId: string | null | undefined, leagues: LeagueRow[] = FALLBACK_LEAGUES): LeagueRow {
  return leagues.find((l) => l.id === leagueId) ?? leagues[0]!;
}

export function ratingFieldsFromRating(
  ratingInput: number,
  peakRating = STARTING_RATING,
  leagues: LeagueRow[] = FALLBACK_LEAGUES,
): { rating: number; peak_rating: number; league_id: string } {
  const rating = clampRating(ratingInput);
  return {
    rating,
    peak_rating: Math.max(peakRating, rating),
    league_id: resolveLeagueId(rating, leagues),
  };
}

export function profileShareUrl(username: string): string {
  return `hobbyflow://u/${username}`;
}

export function profileShareWebUrl(username: string): string {
  return `https://hobbyflow.app/u/${username}`;
}

export function profileShareMessage(username: string, leagueName: string, rating: number): string {
  return `Check out @${username} on HobbyFlow — ${leagueName} · rating ${rating}\n${profileShareWebUrl(username)}`;
}
