const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Node.js polyfills for web
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'crypto-browserify',
  stream: 'stream-browserify',
  util: 'util',
  buffer: 'buffer',
  process: 'process/browser',
  path: 'path-browserify',
  fs: false,
  net: false,
  tls: false,
};

// Configure web-specific settings
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Add global polyfills for web
if (config.transformer) {
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  });
}

module.exports = config;