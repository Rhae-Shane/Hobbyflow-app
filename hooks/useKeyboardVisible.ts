import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

/** Current software keyboard height in px (0 when hidden). */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: { endCoordinates: { height: number; screenY: number } }) => {
      const fromHeight = event.endCoordinates.height;
      // screenY is more reliable on Android edge-to-edge (Expo SDK 54).
      const fromScreenY = Math.max(
        0,
        Dimensions.get('window').height - event.endCoordinates.screenY,
      );
      setHeight(Math.max(fromHeight, fromScreenY));
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

/** True while the software keyboard is visible. */
export function useKeyboardVisible(): boolean {
  return useKeyboardHeight() > 0;
}
