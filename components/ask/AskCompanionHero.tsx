import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  askCompanionColors,
  askCompanionRadii,
} from '@/constants/askCompanionTokens';
import { spacing } from '@/constants/tokens';

type Props = {
  greeting?: string;
  onMicPress?: () => void;
  onAttachPress?: () => void;
  onMenuPress?: () => void;
};

function MicIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5C10.62 3.5 9.5 4.62 9.5 6V12C9.5 13.38 10.62 14.5 12 14.5C13.38 14.5 14.5 13.38 14.5 12V6C14.5 4.62 13.38 3.5 12 3.5Z"
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <Path
        d="M7 11.5C7 14.26 9.24 16.5 12 16.5C14.76 16.5 17 14.26 17 11.5"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path d="M12 16.5V20.5" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DocIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4H14L17 7V20H7V4Z"
        stroke={askCompanionColors.text}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 4V7H17" stroke={askCompanionColors.text} strokeWidth={2} />
    </Svg>
  );
}

function CamIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5C4 7.67 4.67 7 5.5 7H14.5C15.33 7 16 7.67 16 8.5V16.5C16 17.33 15.33 18 14.5 18H5.5C4.67 18 4 17.33 4 16.5V8.5Z"
        stroke={askCompanionColors.text}
        strokeWidth={2}
      />
      <Path
        d="M16 11L20 9V16L16 14"
        stroke={askCompanionColors.text}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SlidersIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7H20" stroke={askCompanionColors.text} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 12H20" stroke={askCompanionColors.text} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 17H20" stroke={askCompanionColors.text} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="8" cy="7" r="2.2" fill={askCompanionColors.text} />
      <Circle cx="16" cy="12" r="2.2" fill={askCompanionColors.text} />
      <Circle cx="11" cy="17" r="2.2" fill={askCompanionColors.text} />
    </Svg>
  );
}

function SparkCenter() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L13.6 9L19.5 10.5L13.6 12L12 18L10.4 12L4.5 10.5L10.4 9L12 3Z"
        fill={askCompanionColors.text}
      />
    </Svg>
  );
}

function PulseRing({ delay, size }: { delay: number; size: number }) {
  const scale = useRef(new Animated.Value(0.72)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.72, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.55, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export function AskCompanionHero({
  greeting = 'Hi! How can I support your learning today?',
  onMicPress,
  onAttachPress,
  onMenuPress,
}: Props) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.avatars}>
          {['#FFD6A8', '#C9E4FF', '#E8D5F5'].map((bg, i) => (
            <View
              key={bg}
              style={[
                styles.avatar,
                { backgroundColor: bg, marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
              ]}
            >
              <Text style={styles.avatarText}>{['H', 'F', '✦'][i]}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onMenuPress}
          style={styles.sliders}
          accessibilityLabel="Companion options"
        >
          <SlidersIcon />
        </Pressable>
      </View>

      <View style={styles.vizWrap}>
        <PulseRing delay={0} size={150} />
        <PulseRing delay={600} size={150} />
        <PulseRing delay={1200} size={150} />
        <View style={styles.vizCore}>
          <SparkCenter />
        </View>
      </View>

      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{greeting}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.sideBtn}
          onPress={onAttachPress}
          accessibilityLabel="Open history"
        >
          <DocIcon />
        </Pressable>
        <Pressable
          style={styles.micBtn}
          onPress={onMicPress}
          accessibilityLabel="Focus ask input"
        >
          <MicIcon />
        </Pressable>
        <Pressable style={styles.sideBtn} onPress={onMicPress} accessibilityLabel="Start typing">
          <CamIcon />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: askCompanionColors.hero,
    borderRadius: askCompanionRadii.hero,
    overflow: 'hidden',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarText: {
    color: askCompanionColors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  sliders: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  vizWrap: {
    alignItems: 'center',
    height: 170,
    justifyContent: 'center',
    marginTop: 4,
  },
  ring: {
    borderColor: askCompanionColors.wave,
    borderWidth: 10,
    position: 'absolute',
  },
  vizCore: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    elevation: 2,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#6BA8E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    width: 64,
  },
  bubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 18,
    marginBottom: spacing.md,
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: {
    color: askCompanionColors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  sideBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: askCompanionRadii.control,
    elevation: 1,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    width: 48,
  },
  micBtn: {
    alignItems: 'center',
    backgroundColor: askCompanionColors.cta,
    borderRadius: askCompanionRadii.control,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
});
