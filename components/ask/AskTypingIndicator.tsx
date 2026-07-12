import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { onboardingColors } from '@/constants/onboardingTokens';

export function AskTypingIndicator() {
  const dotA = useRef(new Animated.Value(0)).current;
  const dotB = useRef(new Animated.Value(0)).current;
  const dotC = useRef(new Animated.Value(0)).current;
  const dots = [dotA, dotB, dotC];

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.delay(280),
        ]),
      ),
    );
    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap} accessibilityLabel="Assistant is thinking">
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: 22,
    paddingHorizontal: 2,
  },
  dot: {
    backgroundColor: onboardingColors.text,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
});
