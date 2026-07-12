import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AskAnythingSheet } from '@/components/ask/AskAnythingSheet';
import {
  AtomIcon,
  FeedTabIcon,
  GenerateTabIcon,
  HomeTabIcon,
} from '@/components/icons/AppIcons';
import { theme } from '@/constants/theme';
import { hapticMedium, hapticSelection } from '@/utils/haptics';

const ACTIVE_BG = theme.colors.navActiveSoft;
const INACTIVE = theme.colors.textMuted;
const ACTIVE = theme.colors.navActive;

const ASK_GRADIENT = ['#4DA3FF', '#1A73E8', '#1557C0'] as const;
const ASK_SHADOW = '#1A73E8';
const ATOM_SIZE = 18;

const TAB_ICONS: Record<
  string,
  (props: { color: string; focused: boolean }) => ReactElement
> = {
  index: ({ color }) => <HomeTabIcon size={22} color={color} />,
  feed: ({ color, focused }) => <FeedTabIcon size={22} color={color} filled={focused} />,
  generate: ({ color }) => <GenerateTabIcon size={22} color={color} />,
};

/** Atom: rotate → collapse to circle → reverse rotate → restore. */
function AskCoachAtom({ color = '#FFFFFF' }: { color?: string }) {
  const rotate = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(morph, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(morph, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      rotate.setValue(0);
      morph.setValue(0);
    };
  }, [morph, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const atomOpacity = morph.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0.35, 0],
  });

  const atomScale = morph.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.35],
  });

  const circleOpacity = morph.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.55, 1],
  });

  const circleScale = morph.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 1],
  });

  return (
    <Animated.View style={[styles.atomWrap, { transform: [{ rotate: spin }] }]}>
      <Animated.View
        style={[
          styles.atomLayer,
          {
            opacity: atomOpacity,
            transform: [{ scale: atomScale }],
          },
        ]}
      >
        <AtomIcon size={ATOM_SIZE} color={color} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.atomCircle,
          {
            backgroundColor: color,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />
    </Animated.View>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [askOpen, setAskOpen] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const focusedRoute = state.routes[state.index]?.name;
  const showAskCoach = focusedRoute === 'index';

  useEffect(() => {
    if (!showAskCoach && askOpen) setAskOpen(false);
  }, [showAskCoach, askOpen]);

  useEffect(() => {
    if (!showAskCoach) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, showAskCoach]);

  return (
    <>
      <View style={styles.wrap} pointerEvents="box-none">
        {showAskCoach ? (
          <Animated.View style={[styles.askWrap, { transform: [{ scale: pulse }] }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ask Coach"
              onPress={() => {
                hapticMedium();
                setAskOpen(true);
              }}
              style={styles.askShadow}
              testID="tab-ask"
            >
              <LinearGradient
                colors={[...ASK_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.askCoach}
              >
                <AskCoachAtom color="#FFFFFF" />
                <Text style={styles.askCoachText}>Ask Coach</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={styles.pill}>
          {state.routes
            .filter((route) => route.name in TAB_ICONS)
            .map((route) => {
              const index = state.routes.findIndex((r) => r.key === route.key);
              const focused = state.index === index;
              const { options } = descriptors[route.key];
              const Icon = TAB_ICONS[route.name];
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : options.title ?? route.name;

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={label}
                  onPress={() => {
                    if (!focused) hapticSelection();
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name, route.params);
                    }
                  }}
                  style={[styles.tabBtn, focused && styles.tabBtnActive]}
                  testID={`tab-${route.name}`}
                >
                  {Icon ? (
                    <Icon color={focused ? ACTIVE : INACTIVE} focused={focused} />
                  ) : null}
                </Pressable>
              );
            })}
        </View>
      </View>

      <AskAnythingSheet visible={askOpen} onClose={() => setAskOpen(false)} />
    </>
  );
}

export {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_HEIGHT_WITH_ASK,
} from '@/components/navigation/tabBarLayout';

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    bottom: 0,
    elevation: 24,
    gap: 10,
    left: 0,
    paddingBottom: 10,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  askWrap: {
    alignItems: 'center',
  },
  askShadow: {
    borderRadius: theme.radii.pill,
    elevation: 10,
    shadowColor: ASK_SHADOW,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
  },
  askCoach: {
    alignItems: 'center',
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  askCoachText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  atomWrap: {
    alignItems: 'center',
    height: ATOM_SIZE,
    justifyContent: 'center',
    width: ATOM_SIZE,
  },
  atomLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atomCircle: {
    borderRadius: ATOM_SIZE / 2,
    height: ATOM_SIZE * 0.72,
    width: ATOM_SIZE * 0.72,
  },
  pill: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 58,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  tabBtn: {
    alignItems: 'center',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 48,
  },
  tabBtnActive: {
    backgroundColor: ACTIVE_BG,
  },
});
