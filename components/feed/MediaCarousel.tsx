import { Audio, ResizeMode, Video } from 'expo-av';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { theme } from '@/constants/theme';
import { radii, spacing } from '@/constants/tokens';
import type { PostMedia } from '@/types/post.types';

type Props = {
  media: PostMedia[];
  onPressItem?: (index: number) => void;
  /** Extra horizontal inset (e.g. avatar column) beyond screen padding. */
  contentInset?: number;
  borderRadius?: number;
};

function AudioPlayer({
  url,
  durationMs,
  width,
}: {
  url: string;
  durationMs: number | null;
  width: number;
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      void sound?.unloadAsync();
    };
  }, [sound]);

  const toggle = async () => {
    if (playing && sound) {
      await sound.pauseAsync();
      setPlaying(false);
      return;
    }
    if (sound) {
      await sound.playAsync();
      setPlaying(true);
      return;
    }
    const { sound: next } = await Audio.Sound.createAsync({ uri: url });
    setSound(next);
    next.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) setPlaying(false);
    });
    await next.playAsync();
    setPlaying(true);
  };

  const secs =
    durationMs != null ? `${Math.round(durationMs / 1000)}s` : 'Audio';

  return (
    <Pressable style={[styles.audioBox, { width }]} onPress={() => void toggle()}>
      <Text style={styles.audioGlyph}>{playing ? '❚❚' : '▶'}</Text>
      <Text style={styles.audioLabel}>{secs}</Text>
    </Pressable>
  );
}

export function MediaCarousel({
  media,
  onPressItem,
  contentInset = 0,
  borderRadius = radii.card,
}: Props) {
  const width = useMemo(
    () => Dimensions.get('window').width - spacing.md * 2 - contentInset,
    [contentInset],
  );

  if (!media.length) return null;

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.carousel, { width, borderRadius }]}
    >
      {media.map((item, index) => (
        <Pressable
          key={item.id}
          style={{ width }}
          onPress={() => onPressItem?.(index)}
        >
          {item.kind === 'image' ? (
            <Image
              source={{ uri: item.publicUrl }}
              style={[styles.media, { width, borderRadius }]}
              resizeMode="cover"
            />
          ) : null}
          {item.kind === 'video' ? (
            <Video
              source={{ uri: item.publicUrl }}
              style={[styles.media, { width, borderRadius }]}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isMuted
            />
          ) : null}
          {item.kind === 'audio' ? (
            <AudioPlayer url={item.publicUrl} durationMs={item.durationMs} width={width} />
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    overflow: 'hidden',
  },
  media: {
    backgroundColor: theme.colors.navActiveSoft,
    height: 280,
  },
  audioBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.primaryBorder,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    height: 88,
    justifyContent: 'center',
  },
  audioGlyph: {
    color: theme.colors.primaryText,
    fontSize: 22,
    fontWeight: '800',
  },
  audioLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
