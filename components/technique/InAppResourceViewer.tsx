import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { BottomSheetOrModal } from '@/components/BottomSheetOrModal';
import { shouldAllowResourceNavigation } from '@/utils/resourceNavigation';
import { colors, fonts, radii, spacing } from '@/constants/tokens';

type Props = {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
};

export function InAppResourceViewer({ visible, url, title = 'Resource', onClose }: Props) {
  return (
    <BottomSheetOrModal
      visible={visible}
      onClose={onClose}
      presentation="fullscreen"
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <WebView
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
          originWhitelist={['https://*', 'http://*']}
          onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) =>
            shouldAllowResourceNavigation(request.url)
          }
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
        />
      </SafeAreaView>
    </BottomSheetOrModal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  closeText: {
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
});
