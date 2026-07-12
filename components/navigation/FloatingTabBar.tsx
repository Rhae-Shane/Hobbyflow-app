import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AskAnythingSheet } from '@/components/ask/AskAnythingSheet';
import {
  CoursesTabIcon,
  FeedTabIcon,
  GenerateTabIcon,
  HomeTabIcon,
  ProfileTabIcon,
  SparkleIcon,
} from '@/components/icons/AppIcons';
import { onboardingColors } from '@/constants/onboardingTokens';

const ACTIVE_BG = '#EDE8DF';
const INACTIVE = '#6B5E52';
const ACTIVE = '#2C2416';

const TAB_ICONS: Record<
  string,
  (props: { color: string; focused: boolean }) => ReactElement
> = {
  index: ({ color }) => <HomeTabIcon size={22} color={color} />,
  feed: ({ color, focused }) => <FeedTabIcon size={22} color={color} filled={focused} />,
  generate: ({ color }) => <GenerateTabIcon size={22} color={color} />,
  courses: ({ color }) => <CoursesTabIcon size={22} color={color} />,
  profile: ({ color }) => <ProfileTabIcon size={22} color={color} />,
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [askOpen, setAskOpen] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const bottomPad = 10;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <>
      <View style={[styles.wrap, { paddingBottom: bottomPad }]} pointerEvents="box-none">
        <View style={styles.row}>
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

          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Pressable
              accessibilityLabel="Ask me anything"
              onPress={() => setAskOpen(true)}
              style={styles.fab}
              testID="tab-ask"
            >
              <View style={styles.fabGlow} />
              <SparkleIcon size={22} color={ACTIVE} />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <AskAnythingSheet visible={askOpen} onClose={() => setAskOpen(false)} />
    </>
  );
}

export { FLOATING_TAB_BAR_HEIGHT } from '@/components/navigation/tabBarLayout';

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    bottom: 0,
    elevation: 24,
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 6,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 58,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#2C2416',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
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
  fab: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: onboardingColors.border,
    borderRadius: 29,
    borderWidth: 1,
    elevation: 6,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2C2416',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 58,
  },
  fabGlow: {
    backgroundColor: 'rgba(124, 203, 250, 0.22)',
    borderRadius: 20,
    height: 40,
    position: 'absolute',
    width: 40,
  },
});
