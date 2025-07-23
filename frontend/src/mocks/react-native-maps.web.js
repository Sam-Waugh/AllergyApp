// Mock for react-native-maps on web platform
// This prevents bundling issues when react-native-maps is imported on web

// Mock MapView component
const MapView = () => null;

// Mock Marker component
const Marker = () => null;

// Mock provider constants
const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = 'default';

// Mock exports to match react-native-maps API
module.exports = {
  default: MapView,
  MapView,
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  // Add other common exports if needed
  Callout: () => null,
  Polygon: () => null,
  Polyline: () => null,
  Circle: () => null,
  Overlay: () => null,
  Heatmap: () => null,
};
