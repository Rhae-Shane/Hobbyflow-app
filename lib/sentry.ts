import { isRunningInExpoGo } from 'expo';
import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const inExpoGo = isRunningInExpoGo();

/**
 * Shared so the root layout can register Expo Router's navigation container.
 * TTID / native frames only work in a real native build (dev client or EAS) —
 * not in Expo Go.
 */
export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !inExpoGo,
});

export function initSentry() {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    sendDefaultPii: true,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
    enableNativeFramesTracking: !inExpoGo,
    enableAppStartTracking: !inExpoGo,
    enableStallTracking: !inExpoGo,
    enableUserInteractionTracing: true,
    integrations: [navigationIntegration],
    enabled: true,
  });
}

export { Sentry };
