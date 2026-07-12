import { Audio, ResizeMode, Video } from 'expo-av';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';
import { radii, spacing } from '@/constants/tokens';
import type { PostMedia } from '@/types/post.types';

const WIDTH = Dimensions.get('window').width - spacing.md * 2;

type Props = {
  media: PostMedia[];
  onPressItem?: (index: number) => void;
};

function AudioPlayer({ url, durationMs }: { url: string; durationMs: number | null }) {
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
    <Pressable style={styles.audioBox} onPress={() => void toggle()}>
      <Text style={styles.audioGlyph}>{playing ? '❚❚' : '▶'}</Text>
      <Text style={styles.audioLabel}>{secs}</Text>
    </Pressable>
  );
}

export function MediaCarousel({ media, onPressItem }: Props) {
  if (!media.length) return null;

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    >
      {media.map((item, index) => (
        <Pressable
          key={item.id}
          style={styles.slide}
          onPress={() => onPressItem?.(index)}
        >
          {item.kind === 'image' ? (
            <Image source={{ uri: item.publicUrl }} style={styles.media} resizeMode="cover" />
          ) : null}
          {item.kind === 'video' ? (
            <Video
              source={{ uri: item.publicUrl }}
              style={styles.media}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isMuted
            />
          ) : null}
          {item.kind === 'audio' ? (
            <AudioPlayer url={item.publicUrl} durationMs={item.durationMs} />
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  slide: {
    width: WIDTH,
  },
  media: {
    backgroundColor: '#E8F3FF',
    height: 280,
    width: WIDTH,
  },
  audioBox: {
    alignItems: 'center',
    backgroundColor: '#E8F6FE',
    borderColor: onboardingColors.primaryBorder,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    height: 88,
    justifyContent: 'center',
    marginHorizontal: 0,
    width: WIDTH,
  },
  audioGlyph: {
    color: onboardingColors.primaryText,
    fontSize: 22,
    fontWeight: '800',
  },
  audioLabel: {
    color: onboardingColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
