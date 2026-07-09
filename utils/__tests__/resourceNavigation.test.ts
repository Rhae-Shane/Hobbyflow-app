import {
  shouldAllowResourceNavigation,
  shouldOpenResourceInApp,
  toInAppYouTubeUrl,
} from '@/utils/resourceNavigation';

describe('resourceNavigation', () => {
  it('opens video and audio resources in-app', () => {
    expect(shouldOpenResourceInApp('video')).toBe(true);
    expect(shouldOpenResourceInApp('audio')).toBe(true);
    expect(shouldOpenResourceInApp('article')).toBe(false);
    expect(shouldOpenResourceInApp('interactive')).toBe(false);
  });

  it('rewrites desktop YouTube URLs to mobile for in-app viewing', () => {
    expect(
      toInAppYouTubeUrl('https://www.youtube.com/results?search_query=chess'),
    ).toBe('https://m.youtube.com/results?search_query=chess');
  });

  it('blocks YouTube app deeplinks', () => {
    expect(shouldAllowResourceNavigation('youtube://watch?v=abc')).toBe(false);
    expect(shouldAllowResourceNavigation('vnd.youtube://watch?v=abc')).toBe(false);
    expect(
      shouldAllowResourceNavigation('intent://www.youtube.com/watch#Intent;scheme=vnd.youtube;end'),
    ).toBe(false);
    expect(shouldAllowResourceNavigation('market://details?id=com.google.android.youtube')).toBe(
      false,
    );
  });

  it('allows normal web navigation', () => {
    expect(shouldAllowResourceNavigation('https://m.youtube.com/results?search_query=chess')).toBe(
      true,
    );
    expect(shouldAllowResourceNavigation('about:blank')).toBe(true);
  });
});
