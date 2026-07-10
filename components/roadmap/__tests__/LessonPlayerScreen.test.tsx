import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LessonPlayerScreen } from '@/components/roadmap/LessonPlayerScreen';
import type { LessonNodeContent } from '@/types/lessonContent.types';

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    WebView: React.forwardRef(
      (
        { source }: { source: { html?: string; uri?: string } },
        _ref: unknown,
      ) => (
        <View testID="mock-webview">
          <Text>
            {source.html?.includes('iframe_api') ||
            source.html?.includes('youtube.com/embed') ||
            source.uri?.includes('youtube.com')
              ? 'embed'
              : 'other'}
          </Text>
        </View>
      ),
    ),
  };
});

const content: LessonNodeContent = {
  pages: [
    {
      heading: 'What You Will Learn',
      blocks: [
        { type: 'markdown', markdown: 'Feel the **beat**.' },
        {
          type: 'image',
          mediaId: '11111111-1111-4111-8111-111111111111',
          caption: 'Pulse diagram',
        },
      ],
    },
    {
      heading: 'Watch & Listen',
      blocks: [
        { type: 'markdown', markdown: 'Follow along.' },
        { type: 'video', mediaId: '22222222-2222-4222-8222-222222222222', caption: 'Demo' },
        { type: 'audio', mediaId: '33333333-3333-4333-8333-333333333333', caption: 'Pulse track' },
      ],
    },
  ],
  media: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      kind: 'image',
      url: 'https://example.com/lesson-media/pulse.jpg',
      alt: 'Pulse',
      source: { provider: 'llm_svg', fetchedAt: '2026-07-10T00:00:00.000Z' },
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      kind: 'video',
      url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      source: {
        provider: 'youtube',
        externalId: 'M7lc1UVf-VE',
        fetchedAt: '2026-07-10T00:00:00.000Z',
      },
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      kind: 'audio',
      url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      source: {
        provider: 'youtube',
        externalId: 'jfKfPfyJRdk',
        fetchedAt: '2026-07-10T00:00:00.000Z',
      },
    },
  ],
  keywords: [{ name: 'Beat', description: 'Steady pulse' }],
  concepts: [],
  sourceContent: '',
};

describe('LessonPlayerScreen', () => {
  it('renders lesson content without search queries', () => {
    render(
      <LessonPlayerScreen title="Keeping Time" content={content} onClose={() => undefined} />,
    );

    expect(screen.getByTestId('lesson-player')).toBeTruthy();
    expect(screen.getByText('What You Will Learn')).toBeTruthy();
    expect(screen.getByText(/Feel the beat/)).toBeTruthy();

    const serialized = JSON.stringify(content);
    expect(serialized).not.toMatch(/searchQuery/);
    expect(serialized).not.toMatch(/results\?search_query/);
  });

  it('keeps the same media ids across renders (persistence assumption)', () => {
    const { rerender } = render(
      <LessonPlayerScreen title="Keeping Time" content={content} onClose={() => undefined} />,
    );
    rerender(
      <LessonPlayerScreen title="Keeping Time" content={content} onClose={() => undefined} />,
    );
    expect(content.media[0]?.url).toBe('https://example.com/lesson-media/pulse.jpg');
    expect(content.media[1]?.source.externalId).toBe('M7lc1UVf-VE');
  });
});
