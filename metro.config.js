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

module.exports = config;
