import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { theme } from '@/constants/theme';
import { hapticError, hapticLight, hapticMedium, hapticSelection, hapticSuccess } from '@/utils/haptics';
import type { SealOverlayOrigin } from '@/components/pact/SealPactOverlay';

const HOLD_MS = 900;

type SealResult = { ok: true } | { ok: false; message: string };

type Props = {
  disabled?: boolean;
  holding: boolean;
  onValidate: () => string | null;
  onHoldStart: (origin: SealOverlayOrigin) => void;
  onHoldCancel: () => void;
  onSeal: () => Promise<SealResult>;
  onError?: (message: string) => void;
  /** Lock parent scroll while holding so ScrollView doesn't cancel the press. */
  onScrollLockChange?: (locked: boolean) => void;
};

export function SealPactHoldButton({
  disabled,
  holding,
  onValidate,
  onHoldStart,
  onHoldCancel,
  onSeal,
  onError,
  onScrollLockChange,
}: Props) {
  const [phase, setPhase] = useState<'idle' | 'holding' | 'sealing'>('idle');
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  /** True once hold commits — blocks pressOut from dismissing the success overlay. */
  const committed = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const clearTimers = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (hapticTimer.current) {
      clearInterval(hapticTimer.current);
      hapticTimer.current = null;
    }
  };

  const scrollLockRef = useRef(onScrollLockChange);
  scrollLockRef.current = onScrollLockChange;

  const setScrollLocked = (locked: boolean) => {
    scrollLockRef.current?.(locked);
  };

  useEffect(() => () => clearTimers(), []);

  // Parent dismisses overlay after the sealed animation — reset local state.
  useEffect(() => {
    if (holding) return;
    if (committed.current) {
      committed.current = false;
      setPhase('idle');
      setScrollLocked(false);
      return;
    }
    if (phaseRef.current === 'holding') {
      setPhase('idle');
      setScrollLocked(false);
    }
  }, [holding]);

  const cancelHold = () => {
    // After commit, finger-up must not kill the expanding “Pact sealed” cover.
    if (committed.current) return;
    clearTimers();
    setPhase('idle');
    setScrollLocked(false);
    onHoldCancel();
  };

  const finishSeal = async () => {
    committed.current = true;
    clearTimers();
    setPhase('sealing');
    hapticMedium();

    const result = await onSeal();
    if (!result.ok) {
      hapticError();
      onError?.(result.message);
      committed.current = false;
      setPhase('idle');
      setScrollLocked(false);
      onHoldCancel();
      return;
    }

    hapticSuccess();
    // Stay committed until parent overlay finishes (holding → false).
  };

  const onPressIn = (event: GestureResponderEvent) => {
    if (disabled || committed.current || phaseRef.current !== 'idle') return;

    const validationError = onValidate();
    if (validationError) {
      onError?.(validationError);
      hapticError();
      return;
    }

    const { pageX, pageY } = event.nativeEvent;
    setPhase('holding');
    setScrollLocked(true);
    onHoldStart({ x: pageX, y: pageY });
    hapticLight();

    let ticks = 0;
    hapticTimer.current = setInterval(() => {
      ticks += 1;
      if (ticks % 2 === 0) hapticSelection();
      else hapticLight();
    }, 140);

    holdTimer.current = setTimeout(() => {
      void finishSeal();
    }, HOLD_MS);
  };

  // Never disable during hold — RN fires pressOut when disabled flips true mid-press,
  // which was cancelling the expand-from-thumb overlay immediately.
  const pressDisabled = Boolean(disabled) || phase === 'sealing' || committed.current;
  const dimmed = phase === 'holding' || phase === 'sealing' || holding;

  return (
    <View style={styles.wrap}>
      <View style={styles.buttonStage}>
        <View style={styles.halo} pointerEvents="none" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Press and hold to seal the Pact"
          accessibilityState={{ disabled: pressDisabled }}
          disabled={pressDisabled}
          onPressIn={onPressIn}
          onPressOut={cancelHold}
          style={[styles.button, dimmed && styles.buttonActive]}
          testID="seal-pact-hold"
        >
          <Text style={styles.buttonGlyph}>✦</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        {phase === 'sealing' ? 'Sealing your pact…' : 'Press & hold to seal your pact'}
      </Text>
    </View>
  );
}

const SEAL = theme.colors.accentDeep;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
    paddingVertical: 8,
  },
  buttonStage: {
    alignItems: 'center',
    height: 128,
    justifyContent: 'center',
    width: 128,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.accentOrangeSoft,
    borderRadius: 64,
  },
  button: {
    alignItems: 'center',
    backgroundColor: SEAL,
    borderRadius: 48,
    elevation: 2,
    height: 96,
    justifyContent: 'center',
    shadowColor: SEAL,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    width: 96,
    zIndex: 1,
  },
  buttonActive: {
    transform: [{ scale: 0.96 }],
  },
  buttonGlyph: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
