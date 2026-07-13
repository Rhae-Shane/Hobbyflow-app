import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra offset above the keyboard (e.g. fixed chrome header). */
  offset?: number;
};

/**
 * Lifts content above the software keyboard (Expo 54 edge-to-edge safe).
 */
export function KeyboardAware({ children, style, offset = 0 }: Props) {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={offset}
      style={[styles.root, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
