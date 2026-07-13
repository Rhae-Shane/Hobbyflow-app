import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AskAnythingSheet } from '@/components/ask/AskAnythingSheet';
import {
  AtomIcon,
  ExploreTabIcon,
  FeedTabIcon,
  GenerateTabIcon,
  HomeTabIcon,
} from '@/components/icons/AppIcons';
import { theme } from '@/constants/theme';
import { useFloatingTabBarPaddingBottom } from '@/hooks/useFloatingTabBarInset';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { hapticMedium, hapticSelection } from '@/utils/haptics';

const ACTIVE_BG = theme.colors.navActiveSoft;
const INACTIVE = theme.colors.textMuted;
const ACTIVE = theme.colors.navActive;

const ASK_GRADIENT = ['#4DA3FF', '#1A73E8', '#1557C0'] as const;
const ASK_SHADOW = '#1A73E8';

/** Pill resting size → circle size when morphing. */
const ASK_PILL_WIDTH = 156;
const ASK_CIRCLE_SIZE = 46;
const ASK_TEXT_WIDTH = 86;
const ASK_ICON_SIZE = 22;
/** One morph phase (pill↔circle + matching icon spin). */
const ASK_MORPH_MS = 1100;
const ASK_HOLD_MS = 900;

const TAB_ICONS: Record<
  string,
  (props: { color: string; focused: boolean }) => ReactElement
> = {
  feed: ({ color, focused }) => <FeedTabIcon size={22} color={color} filled={focused} />,
  index: ({ color }) => <HomeTabIcon size={22} color={color} />,
  explore: ({ color }) => <ExploreTabIcon size={22} color={color} />,
  generate: ({ color }) => <GenerateTabIcon size={22} color={color} />,
};

/** Visual tab order — Learn in Public (feed) rightmost. */
const TAB_ORDER = ['index', 'explore', 'generate', 'feed'] as const;

/**
 * Ask Coach CTA: pill↔circle morph and icon rotation share one progress value
 * so they stay locked together (slow in both directions).
 */
function AskCoachButton({ onPress }: { onPress: () => void }) {
  const morph = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(ASK_HOLD_MS),
        // Pill → circle + icon 360° CW (same progress)
        Animated.timing(morph, {
          toValue: 1,
          duration: ASK_MORPH_MS,
          useNativeDriver: false,
        }),
        Animated.delay(ASK_HOLD_MS),
        // Circle → pill + icon 360° CCW (same progress)
        Animated.timing(morph, {
          toValue: 0,
          duration: ASK_MORPH_MS,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      morph.setValue(0);
    };
  }, [morph]);

  const width = morph.interpolate({
    inputRange: [0, 1],
    outputRange: [ASK_PILL_WIDTH, ASK_CIRCLE_SIZE],
  });

  const padH = morph.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const textOpacity = morph.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0, 0],
  });

  const textWidth = morph.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [ASK_TEXT_WIDTH, 0, 0],
  });

  const textMargin = morph.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [8, 0, 0],
  });

  // Rotation tied 1:1 to pill morph
  const spin = morph.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.askShadow,
        {
          width,
          height: ASK_CIRCLE_SIZE,
          borderRadius: ASK_CIRCLE_SIZE / 2,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask Coach"
        onPress={onPress}
        style={styles.askPressable}
        testID="tab-ask"
      >
        <LinearGradient
          colors={[...ASK_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.askCoach}
        >
          <Animated.View style={[styles.askInner, { paddingHorizontal: padH }]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <AtomIcon size={ASK_ICON_SIZE} color="#FFFFFF" />
            </Animated.View>
            <Animated.View
              style={{
                marginLeft: textMargin,
                opacity: textOpacity,
                overflow: 'hidden',
                width: textWidth,
              }}
            >
              <Text style={styles.askCoachText} numberOfLines={1}>
                Ask Coach
              </Text>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [askOpen, setAskOpen] = useState(false);
  const focusedRoute = state.routes[state.index]?.name;
  const showAskCoach = focusedRoute === 'index';
  const keyboardVisible = useKeyboardVisible();
  const paddingBottom = useFloatingTabBarPaddingBottom();

  useEffect(() => {
    if (!showAskCoach && askOpen) setAskOpen(false);
  }, [showAskCoach, askOpen]);

  return (
    <>
      {/*
        Keep AskAnythingSheet mounted in a stable tree position. Hiding the tab
        bar on keyboard open must not remount the sheet (that reset the chat /
        input and looked like a full re-render when tapping the ask field).
      */}
      {!keyboardVisible ? (
        <View style={[styles.wrap, { paddingBottom }]} pointerEvents="box-none">
          {showAskCoach ? (
            <View style={styles.askWrap}>
              <AskCoachButton
                onPress={() => {
                  hapticMedium();
                  setAskOpen(true);
                }}
              />
            </View>
          ) : null}

          <View style={styles.pill}>
            {TAB_ORDER.map((routeName) => {
                const route = state.routes.find((r) => r.name === routeName);
                if (!route) return null;
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
                    <Text
                      style={[styles.tabLabel, focused && styles.tabLabelActive]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
      ) : null}

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
    elevation: 4,
    gap: 10,
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  askWrap: {
    alignItems: 'center',
    height: ASK_CIRCLE_SIZE,
    justifyContent: 'center',
  },
  askShadow: {
    elevation: 3,
    overflow: 'hidden',
    shadowColor: ASK_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  askPressable: {
    flex: 1,
  },
  askCoach: {
    flex: 1,
  },
  askInner: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  askCoachText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pill: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 58,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  tabBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    maxWidth: 96,
    minHeight: 50,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabBtnActive: {
    backgroundColor: ACTIVE_BG,
  },
  tabLabel: {
    color: INACTIVE,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: ACTIVE,
  },
});
