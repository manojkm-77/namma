const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Handle node:* imports — resolve to empty module for Windows/Web compat
// Mock native-only packages for web platform
// Handle .css imports (Metro doesn't handle CSS natively)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (typeof moduleName === 'string' && (moduleName.startsWith('node:') || /^node:/u.test(moduleName))) {
    return context.resolveRequest(context, path.resolve(projectRoot, '__metro_mocks__', 'empty.js'), platform);
  }

  if (moduleName.endsWith('.css')) {
    return { type: 'empty' };
  }

  if (moduleName === 'mapbox-gl' || moduleName.startsWith('mapbox-gl/')) {
    return context.resolveRequest(
      context,
      path.resolve(projectRoot, '__metro_mocks__', 'mapbox-gl.js'),
      platform
    );
  }

  if (moduleName === '@rnmapbox/maps' || moduleName.startsWith('@rnmapbox/maps/')) {
    if (moduleName === '@rnmapbox/maps') {
      return context.resolveRequest(
        context,
        path.resolve(projectRoot, '__metro_mocks__', '@rnmapbox', 'maps.js'),
        platform
      );
    }
    return { type: 'empty' };
  }

  // Redirect core dependencies to root to prevent duplicates in monorepo
  const rootRedirects = [
    'react',
    'react-dom'
  ];
  if (rootRedirects.includes(moduleName)) {
    return context.resolveRequest(
      context,
      path.resolve(workspaceRoot, 'node_modules', moduleName),
      platform
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.blockList = [
  /react-native-css-interop\/\.cache\/.*/,
  /mapbox-gl\/dist\/.*/,
];
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
