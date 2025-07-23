const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable react-native-maps support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.assetExts.push('svg');

// Add resolver to handle platform-specific module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add resolver blacklist for web builds to exclude mobile-only dependencies
config.resolver.blacklistRE = /node_modules\/.*\/(react-native-html-to-pdf|@react-native-firebase)\/.*$/;

module.exports = config;
