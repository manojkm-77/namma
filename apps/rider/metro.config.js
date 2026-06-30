const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Intercept node:* imports to resolve to an empty module.
// This prevents Windows from attempting to create paths with colons.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName && moduleName.startsWith('node:')) {
    return {
      type: 'empty',
    };
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

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });

