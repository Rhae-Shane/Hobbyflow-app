import { buildResourceUrl } from '@/utils/resourceUrlBuilder';

describe('resourceUrlBuilder', () => {
  const query = 'chess fork tactic';

  it('builds a YouTube search URL for video', () => {
    expect(buildResourceUrl('video', query)).toBe(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    );
  });

  it('builds a Google search URL for article', () => {
    expect(buildResourceUrl('article', query)).toBe(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    );
  });

  it('builds a podcast-oriented YouTube search URL for audio', () => {
    expect(buildResourceUrl('audio', query)).toBe(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} podcast`)}`,
    );
  });

  it('builds hobby-specific interactive URLs', () => {
    expect(buildResourceUrl('interactive', query, 'chess')).toBe('https://lichess.org/training');
    expect(buildResourceUrl('interactive', query, 'guitar')).toContain('guitar%20chord%20trainer');
    expect(buildResourceUrl('interactive', query, 'photography')).toContain(
      'photography%20exposure%20simulator',
    );
  });
});
