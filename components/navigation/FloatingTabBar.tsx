import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AskAnythingSheet } from '@/components/ask/AskAnythingSheet';
import { onboardingColors } from '@/constants/onboardingTokens';

const ACTIVE_BG = '#EDE8DF';
const INACTIVE = '#6B5E52';
const ACTIVE = '#2C2416';

const TAB_GLYPHS: Record<string, { active: string; inactive: string }> = {
  index: { active: '⌂', inactive: '⌂' },
  generate: { active: '✦', inactive: '✧' },
  courses: { active: '▤', inactive: '▥' },
  profile: { active: '☺', inactive: '○' },
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [askOpen, setAskOpen] = useState(false);
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <>
      <View style={[styles.wrap, { paddingBottom: bottomPad }]} pointerEvents="box-none">
        <View style={styles.row}>
          <View style={styles.pill}>
            {state.routes
              .filter((route) => route.name in TAB_GLYPHS)
              .map((route) => {
              const index = state.routes.findIndex((r) => r.key === route.key);
              const focused = state.index === index;
              const { options } = descriptors[route.key];
              const glyphs = TAB_GLYPHS[route.name] ?? { active: '•', inactive: '·' };
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
                  <Text style={[styles.glyph, focused ? styles.glyphActive : styles.glyphInactive]}>
                    {focused ? glyphs.active : glyphs.inactive}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityLabel="Ask me anything"
            onPress={() => setAskOpen(true)}
            style={styles.fab}
            testID="tab-ask"
          >
            <Text style={styles.fabGlyph}>✦</Text>
          </Pressable>
        </View>
      </View>

      <AskAnythingSheet visible={askOpen} onClose={() => setAskOpen(false)} />
    </>
  );
}

export const FLOATING_TAB_BAR_HEIGHT = 72;

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
  glyph: {
    fontSize: 22,
    fontWeight: '700',
  },
  glyphActive: {
    color: ACTIVE,
  },
  glyphInactive: {
    color: INACTIVE,
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
    shadowColor: '#2C2416',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 58,
  },
  fabGlyph: {
    color: ACTIVE,
    fontSize: 22,
    fontWeight: '800',
  },
});
