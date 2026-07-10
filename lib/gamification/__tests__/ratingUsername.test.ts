import {
  clampRating,
  STARTING_RATING,
  validateUsernameFormat,
  normalizeUsername,
} from '@/lib/gamification/constants';
import { ratingFieldsFromRating, resolveLeagueId } from '@/lib/gamification/leagues';

describe('clampRating', () => {
  it('floors at 699', () => {
    expect(clampRating(699)).toBe(STARTING_RATING);
    expect(clampRating(710)).toBe(710);
    expect(clampRating(0)).toBe(STARTING_RATING);
    expect(clampRating(500)).toBe(STARTING_RATING);
  });
});

describe('leagues', () => {
  it('maps rating bands', () => {
    expect(resolveLeagueId(699)).toBe('wood');
    expect(resolveLeagueId(800)).toBe('bronze');
    expect(resolveLeagueId(1219)).toBe('gold');
    expect(resolveLeagueId(2000)).toBe('legend');
  });

  it('updates peak rating from rating awards', () => {
    const first = ratingFieldsFromRating(709, 699);
    expect(first.rating).toBe(709);
    expect(first.peak_rating).toBe(709);
    expect(first.league_id).toBe('wood');

    const down = ratingFieldsFromRating(699, 709);
    expect(down.rating).toBe(699);
    expect(down.peak_rating).toBe(709);
  });
});

describe('username validation', () => {
  it('normalizes and validates', () => {
    expect(normalizeUsername('@Alice_1')).toBe('alice_1');
    expect(validateUsernameFormat('ab')).toMatch(/3–20/);
    expect(validateUsernameFormat('admin')).toMatch(/reserved/i);
    expect(validateUsernameFormat('alice_1')).toBeNull();
  });
});
