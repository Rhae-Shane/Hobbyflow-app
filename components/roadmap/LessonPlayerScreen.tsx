import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type {
  LessonBlock,
  LessonMediaAsset,
  LessonNodeContent,
  LessonPage,
} from '@/types/lessonContent.types';

type Props = {
  title: string;
  content: LessonNodeContent;
  onClose: () => void;
};

/** Origin Referer required by YouTube embeds (avoids Error 153). */
const YOUTUBE_ORIGIN = 'https://hobbyflow.app';

const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

function mediaById(media: LessonMediaAsset[]): Map<string, LessonMediaAsset> {
  return new Map(media.map((m) => [m.id, m]));
}

function youtubeThumb(videoId: string, fallback?: string): string {
  return fallback ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function isSvgUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.startsWith('data:image/svg') ||
    lower.includes('.svg?') ||
    lower.endsWith('.svg') ||
    lower.includes('/svg/')
  );
}

function svgWebViewHtml(url: string): string {
  const safe = url.replace(/"/g, '&quot;');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>html,body{margin:0;padding:0;background:#E8E4DC;height:100%}
img{width:100%;height:100%;object-fit:cover;display:block}</style>
</head><body><img src="${safe}" alt=""/></body></html>`;
}

function youtubePlayerHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <style>
    html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
    #player { position: absolute; inset: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var player = null;
    var ready = false;
    function post(msg) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch (e) {}
    }
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: ${JSON.stringify(videoId)},
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          disablekb: 1,
          origin: ${JSON.stringify(YOUTUBE_ORIGIN)}
        },
        events: {
          onReady: function () {
            ready = true;
            post({ type: 'ready' });
          },
          onStateChange: function (e) {
            post({ type: 'state', state: e.data });
          },
          onError: function (e) {
            post({ type: 'error', code: e.data });
          }
        }
      });
    }
    window.__hfPlay = function () {
      try { if (player && ready) player.playVideo(); } catch (e) {}
    };
    window.__hfPause = function () {
      try { if (player && ready) player.pauseVideo(); } catch (e) {}
    };
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  </script>
</body>
</html>`;
}

function renderMarkdownLite(markdown: string): string {
  return markdown.replace(/\*\*([^*]+)\*\*/g, '$1').trim();
}

function allowWebViewNavigation(request: ShouldStartLoadRequest): boolean {
  const url = request.url ?? '';
  const lower = url.toLowerCase();
  // Keep playback inside the WebView — never hand off to the YouTube app.
  if (
    lower.startsWith('youtube:') ||
    lower.startsWith('vnd.youtube:') ||
    lower.startsWith('intent:') ||
    lower.includes('market://')
  ) {
    return false;
  }
  return true;
}

function LessonImage({
  url,
  alt,
  width,
  caption,
}: {
  url: string;
  alt?: string;
  width: number;
  caption?: string;
}) {
  const boxStyle = [styles.image, { width: width - spacing.lg * 2 }];

  if (isSvgUrl(url)) {
    return (
      <View style={styles.mediaBlock}>
        <View style={boxStyle}>
          <WebView
            originWhitelist={['*']}
            source={{ html: svgWebViewHtml(url), baseUrl: YOUTUBE_ORIGIN }}
            style={styles.webview}
            scrollEnabled={false}
            pointerEvents="none"
          />
        </View>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.mediaBlock}>
      <Image
        source={{ uri: url }}
        style={boxStyle}
        resizeMode="cover"
        accessibilityLabel={alt ?? caption ?? 'Lesson image'}
      />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

function YouTubeBlock({
  kind,
  asset,
  caption,
  width,
}: {
  kind: 'video' | 'audio';
  asset: LessonMediaAsset;
  caption?: string;
  width: number;
}) {
  const webRef = useRef<WebView>(null);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastToggleAt = useRef(0);

  const videoId = asset.source.externalId;
  if (!videoId) return null;

  const thumb = youtubeThumb(videoId, asset.thumbnailUrl);
  const label = kind === 'audio' ? 'Listen' : 'Watch';
  const playerWidth = width - spacing.lg * 2;

  const inject = useCallback((js: string) => {
    webRef.current?.injectJavaScript(`${js}; true;`);
  }, []);

  const play = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleAt.current < 400) return;
    lastToggleAt.current = now;
    setBusy(true);
    inject('window.__hfPlay && window.__hfPlay()');
    setPlaying(true);
    setTimeout(() => setBusy(false), 350);
  }, [inject]);

  const pause = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleAt.current < 400) return;
    lastToggleAt.current = now;
    setBusy(true);
    inject('window.__hfPause && window.__hfPause()');
    setPlaying(false);
    setTimeout(() => setBusy(false), 350);
  }, [inject]);

  const startInApp = useCallback(() => {
    setStarted(true);
    setPlaying(false);
    setReady(false);
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        state?: number;
      };
      if (data.type === 'ready') {
        setReady(true);
        // Auto-start once after user explicitly opened the in-app player.
        setTimeout(() => {
          webRef.current?.injectJavaScript('window.__hfPlay && window.__hfPlay(); true;');
          setPlaying(true);
        }, 200);
        return;
      }
      if (data.type === 'state' && typeof data.state === 'number') {
        if (data.state === YT_STATE.PLAYING || data.state === YT_STATE.BUFFERING) {
          setPlaying(true);
        } else if (
          data.state === YT_STATE.PAUSED ||
          data.state === YT_STATE.ENDED ||
          data.state === YT_STATE.CUED
        ) {
          setPlaying(false);
        }
      }
    } catch {
      // ignore non-JSON
    }
  }, []);

  return (
    <View style={styles.mediaBlock} testID={`lesson-${kind}`}>
      <Text style={styles.mediaLabel}>{label}</Text>

      {!started ? (
        <Pressable
          style={[styles.videoWrap, { width: playerWidth }]}
          onPress={startInApp}
          accessibilityRole="button"
          accessibilityLabel={`Play ${label.toLowerCase()} in app`}
        >
          <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </Pressable>
      ) : (
        <View style={[styles.videoWrap, { width: playerWidth }]} pointerEvents="box-none">
          <WebView
            ref={webRef}
            originWhitelist={['https://*', 'http://*']}
            source={{
              html: youtubePlayerHtml(videoId),
              baseUrl: YOUTUBE_ORIGIN,
            }}
            style={styles.webview}
            scrollEnabled={false}
            bounces={false}
            allowsFullscreenVideo={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={allowWebViewNavigation}
            onMessage={onMessage}
            // Prevent the WebView from stealing taps meant for our Play/Pause buttons.
            pointerEvents="none"
          />
          {!ready ? (
            <View style={styles.webviewLoading}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
        </View>
      )}

      {started ? (
        <View style={styles.mediaActions}>
          {playing ? (
            <Pressable
              style={[styles.mediaActionBtn, styles.mediaActionPrimary]}
              onPress={pause}
              disabled={busy || !ready}
              accessibilityRole="button"
              accessibilityLabel="Pause"
            >
              <Text style={styles.mediaActionPrimaryText}>Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.mediaActionBtn, styles.mediaActionPrimary]}
              onPress={play}
              disabled={busy || !ready}
              accessibilityRole="button"
              accessibilityLabel="Play"
            >
              <Text style={styles.mediaActionPrimaryText}>
                {!ready ? 'Loading…' : 'Play'}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>Tap to play in HobbyFlow — stays in the app</Text>
      )}

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {asset.title ? <Text style={styles.mediaTitle}>{asset.title}</Text> : null}
    </View>
  );
}

function BlockView({
  block,
  media,
  width,
}: {
  block: LessonBlock;
  media: Map<string, LessonMediaAsset>;
  width: number;
}) {
  if (block.type === 'markdown') {
    return <Text style={styles.body}>{renderMarkdownLite(block.markdown)}</Text>;
  }

  const asset = media.get(block.mediaId);
  if (!asset) return null;

  if (block.type === 'image') {
    return (
      <LessonImage
        url={asset.url}
        alt={asset.alt}
        width={width}
        caption={block.caption}
      />
    );
  }

  if (block.type === 'video' || block.type === 'audio') {
    return (
      <YouTubeBlock
        kind={block.type}
        asset={asset}
        caption={block.caption}
        width={width}
      />
    );
  }

  return null;
}

function PageView({
  page,
  media,
  width,
}: {
  page: LessonPage;
  media: Map<string, LessonMediaAsset>;
  width: number;
}) {
  return (
    <View style={styles.page} testID="lesson-page">
      <Text style={styles.heading}>{page.heading}</Text>
      {page.blocks.map((block, index) => (
        <BlockView key={`${page.heading}-${index}`} block={block} media={media} width={width} />
      ))}
    </View>
  );
}

export function LessonPlayerScreen({ title, content, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [pageIndex, setPageIndex] = useState(0);
  const media = useMemo(() => mediaById(content.media ?? []), [content.media]);
  const pages = content.pages ?? [];
  const page = pages[pageIndex];

  if (!page) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No lesson content</Text>
        <Pressable style={styles.secondary} onPress={onClose}>
          <Text style={styles.secondaryText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="lesson-player">
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.back}>← Close</Text>
        </Pressable>
        <Text style={styles.progress}>
          {pageIndex + 1} / {pages.length}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PageView page={page} media={media} width={width} />
        {(content.keywords?.length ?? 0) > 0 && pageIndex === pages.length - 1 ? (
          <View style={styles.keywords}>
            <Text style={styles.keywordsTitle}>Key terms</Text>
            {content.keywords.map((kw) => (
              <View key={kw.name} style={styles.keywordRow}>
                <Text style={styles.keywordName}>{kw.name}</Text>
                <Text style={styles.keywordDesc}>{kw.description}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.nav}>
        <Pressable
          style={[styles.navBtn, pageIndex === 0 && styles.navBtnDisabled]}
          disabled={pageIndex === 0}
          onPress={() => setPageIndex((i) => Math.max(0, i - 1))}
        >
          <Text style={styles.navBtnText}>Back</Text>
        </Pressable>
        {pageIndex < pages.length - 1 ? (
          <Pressable
            style={styles.primary}
            onPress={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
          >
            <Text style={styles.primaryText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primary} onPress={onClose}>
            <Text style={styles.primaryText}>Done</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: onboardingColors.background,
    flex: 1,
    paddingTop: spacing.md,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  back: {
    color: onboardingColors.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  progress: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    color: onboardingColors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  scroll: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  page: {
    gap: spacing.md,
  },
  heading: {
    color: onboardingColors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: onboardingColors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  mediaBlock: {
    gap: spacing.xs,
  },
  mediaLabel: {
    color: onboardingColors.primaryText,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  image: {
    alignSelf: 'center',
    backgroundColor: '#E8E4DC',
    borderRadius: radii.card,
    height: 200,
    overflow: 'hidden',
  },
  videoWrap: {
    alignSelf: 'center',
    backgroundColor: '#000',
    borderRadius: radii.card,
    height: 220,
    overflow: 'hidden',
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
    height: 220,
    width: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  mediaActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mediaActionBtn: {
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mediaActionPrimary: {
    backgroundColor: onboardingColors.primaryText,
    borderColor: onboardingColors.primaryText,
    flex: 1,
    alignItems: 'center',
  },
  mediaActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  hint: {
    color: onboardingColors.textMuted,
    fontSize: 12,
  },
  caption: {
    color: onboardingColors.textMuted,
    fontSize: 13,
  },
  mediaTitle: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  keywords: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  keywordsTitle: {
    color: onboardingColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  keywordRow: {
    gap: 2,
  },
  keywordName: {
    color: onboardingColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  keywordDesc: {
    color: onboardingColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  nav: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  navBtn: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: onboardingColors.text,
    fontWeight: '700',
  },
  primary: {
    alignItems: 'center',
    backgroundColor: onboardingColors.primaryText,
    borderRadius: radii.card,
    flex: 1.4,
    paddingVertical: spacing.sm,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondary: {
    alignItems: 'center',
    borderColor: onboardingColors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    margin: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    color: onboardingColors.text,
    fontWeight: '700',
  },
});
