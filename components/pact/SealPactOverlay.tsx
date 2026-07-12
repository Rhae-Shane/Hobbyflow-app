import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text } from 'react-native';
import { theme } from '@/constants/theme';

const SEED_SIZE = 48;
const EXPAND_MS = 900;
const SEALED_HOLD_MS = 700;
const FADE_MS = 380;

export type SealOverlayOrigin = { x: number; y: number };

type Props = {
  visible: boolean;
  origin: SealOverlayOrigin;
  /** When true, show “Pact sealed” then fade out. */
  sealed: boolean;
  onFinished: () => void;
};

function maxCoverScale(origin: SealOverlayOrigin): number {
  const { width, height } = Dimensions.get('window');
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
  ];
  let farthest = 0;
  for (const c of corners) {
    const d = Math.hypot(c.x - origin.x, c.y - origin.y);
    if (d > farthest) farthest = d;
  }
  return (farthest * 2) / SEED_SIZE + 0.15;
}

export function SealPactOverlay({ visible, origin, sealed, onFinished }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const finishing = useRef(false);

  useEffect(() => {
    if (!visible) {
      scale.setValue(0);
      contentOpacity.setValue(0);
      overlayOpacity.setValue(1);
      finishing.current = false;
      return;
    }

    scale.setValue(0);
    contentOpacity.setValue(0);
    overlayOpacity.setValue(1);
    finishing.current = false;

    Animated.timing(scale, {
      toValue: maxCoverScale(origin),
      duration: EXPAND_MS,
      useNativeDriver: true,
    }).start();
  }, [visible, origin.x, origin.y, scale, contentOpacity, overlayOpacity]);

  useEffect(() => {
    if (!visible || !sealed || finishing.current) return;
    finishing.current = true;

    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => onFinished());
    }, SEALED_HOLD_MS);

    return () => clearTimeout(t);
  }, [visible, sealed, contentOpacity, overlayOpacity, onFinished]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlayRoot, { opacity: overlayOpacity }]} pointerEvents="none">
        <Animated.View
          style={[
            styles.expandCircle,
            {
              left: origin.x - SEED_SIZE / 2,
              top: origin.y - SEED_SIZE / 2,
              transform: [{ scale }],
            },
          ]}
        />
        <Animated.View style={[styles.sealedCopy, { opacity: contentOpacity }]}>
          <Text style={styles.sealedTitle}>Pact sealed</Text>
          <Text style={styles.sealedBody}>Your goal is locked in. Go make it real.</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const SEAL = theme.colors.accentDeep;

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandCircle: {
    backgroundColor: SEAL,
    borderRadius: SEED_SIZE / 2,
    height: SEED_SIZE,
    position: 'absolute',
    width: SEED_SIZE,
  },
  sealedCopy: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  sealedTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sealedBody: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
});
