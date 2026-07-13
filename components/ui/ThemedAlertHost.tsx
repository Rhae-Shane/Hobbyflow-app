import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { fonts, spacing } from '@/constants/tokens';
import {
  useAlertStore,
  type AlertButton,
  type AlertButtonStyle,
} from '@/store/useAlertStore';

function buttonFill(style: AlertButtonStyle | undefined, isPrimary: boolean) {
  if (style === 'destructive') return theme.colors.danger;
  if (style === 'cancel') return '#F3F4F6';
  if (isPrimary) return theme.colors.navActive;
  return '#F3F4F6';
}

function buttonLabelColor(style: AlertButtonStyle | undefined, isPrimary: boolean) {
  if (style === 'destructive') return '#FFFFFF';
  if (style === 'cancel') return theme.colors.text;
  if (isPrimary) return '#FFFFFF';
  return theme.colors.text;
}

function AlertActions({
  buttons,
  onChoose,
}: {
  buttons: AlertButton[];
  onChoose: (button: AlertButton) => void;
}) {
  const cancel = buttons.find((b) => b.style === 'cancel');
  const others = buttons.filter((b) => b.style !== 'cancel');
  const stacked = buttons.length > 2;
  const ordered = stacked
    ? buttons
    : [...(cancel ? [cancel] : []), ...others];

  if (stacked) {
    const lastActionIndex = ordered.reduce(
      (acc, button, index) => (button.style === 'cancel' ? acc : index),
      -1,
    );
    return (
      <View style={styles.actionsStack}>
        {ordered.map((button, index) => {
          const isPrimary =
            button.style === 'destructive' ||
            (button.style !== 'cancel' && index === lastActionIndex);
          return (
            <Pressable
              key={`${button.text}-${index}`}
              accessibilityRole="button"
              onPress={() => onChoose(button)}
              style={[
                styles.btn,
                styles.btnFull,
                { backgroundColor: buttonFill(button.style, isPrimary) },
              ]}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: buttonLabelColor(button.style, isPrimary) },
                ]}
              >
                {button.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.actionsRow}>
      {ordered.map((button, index) => {
        const isPrimary =
          button.style === 'destructive' ||
          (button.style !== 'cancel' && index === ordered.length - 1);
        return (
          <Pressable
            key={`${button.text}-${index}`}
            accessibilityRole="button"
            onPress={() => onChoose(button)}
            style={[
              styles.btn,
              styles.btnFlex,
              { backgroundColor: buttonFill(button.style, isPrimary) },
            ]}
          >
            <Text
              style={[
                styles.btnText,
                { color: buttonLabelColor(button.style, isPrimary) },
              ]}
            >
              {button.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Global host — mount once at the app root. */
export function ThemedAlertHost() {
  const current = useAlertStore((s) => s.current);
  const dismiss = useAlertStore((s) => s.dismiss);

  const onChoose = (button: AlertButton) => {
    dismiss();
    // Defer so nested showAlert calls (after dismiss) land cleanly.
    queueMicrotask(() => button.onPress?.());
  };

  const onRequestClose = () => {
    if (!current) return;
    const cancel = current.buttons.find((b) => b.style === 'cancel');
    if (cancel) {
      onChoose(cancel);
      return;
    }
    if (current.buttons.length === 1) {
      onChoose(current.buttons[0]);
    }
  };

  return (
    <Modal
      visible={current != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        {current ? (
          <View style={styles.card} accessibilityRole="alert">
            <Text style={styles.title}>{current.title}</Text>
            {current.message ? (
              <Text style={styles.message}>{current.message}</Text>
            ) : null}
            <AlertActions buttons={current.buttons} onChoose={onChoose} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.42)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    elevation: 4,
    gap: spacing.sm,
    maxWidth: 360,
    padding: spacing.lg,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: theme.shadow.offsetY },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    width: '100%',
    zIndex: 1,
  },
  title: {
    color: theme.colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  message: {
    color: theme.colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },
  actionsStack: {
    gap: 10,
    marginTop: spacing.sm,
  },
  btn: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnFlex: {
    flex: 1,
  },
  btnFull: {
    width: '100%',
  },
  btnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});

