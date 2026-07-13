const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * Metro follows react-native-svg's `"react-native": "src/index.ts"` field and then
 * fails to resolve the type-only re-export `./lib/extract/types` on some Windows /
 * Expo 54 setups. Force the compiled CommonJS entry instead.
 */
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('react-native-svg/lib/commonjs/index.js'),
    };
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

// RN 0.81 / Metro package-exports can fail to resolve @sentry/* (import/require only).
config.resolver.unstable_enablePackageExports = false;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@sentry/core': path.resolve(__dirname, 'node_modules/@sentry/core'),
  '@sentry/react': path.resolve(__dirname, 'node_modules/@sentry/react'),
  '@sentry/browser': path.resolve(__dirname, 'node_modules/@sentry/browser'),
};

module.exports = config;
