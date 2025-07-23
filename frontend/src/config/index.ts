// Configuration for external APIs and services
export const config = {  // Google Maps API
  googleMaps: {
    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    staticMapBaseUrl: 'https://maps.googleapis.com/maps/api/staticmap',
    defaultMapSettings: {
      zoom: 11,
      mapType: 'roadmap',
      imageSize: { width: 640, height: 200 },
      markerColor: 'red',
      styles: [
        'feature:poi|visibility:off',
        'feature:transit|visibility:off'
      ]
    }
  },
  
  // Backend API
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8090',
  },
  
  // Environment
  env: process.env.EXPO_PUBLIC_ENV || 'development',
  
  // Feature flags
  features: {
    enableMaps: true,
    enablePollenHeatmap: true,
    enableLocationServices: true,
  }
};

// Validation functions
export const validateConfig = () => {
  const issues = [];
  
  if (!config.googleMaps.apiKey) {
    issues.push('Google Maps API key is missing');
  }
  
  if (!config.api.baseUrl) {
    issues.push('Backend API URL is missing');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Google Maps URL builder utility
export const buildStaticMapUrl = (params: {
  latitude: number;
  longitude: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid';
  zoom?: number;
  width?: number;
  height?: number;
  markers?: boolean;
}) => {
  const { 
    latitude, 
    longitude, 
    mapType = config.googleMaps.defaultMapSettings.mapType,
    zoom = config.googleMaps.defaultMapSettings.zoom,
    width = config.googleMaps.defaultMapSettings.imageSize.width,
    height = config.googleMaps.defaultMapSettings.imageSize.height,
    markers = true
  } = params;
  
  if (!config.googleMaps.apiKey) {
    console.error('Google Maps API key not configured');
    return null;
  }
  
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    console.error('Invalid coordinates:', { latitude, longitude });
    return null;
  }
  
  try {
    const center = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const size = `${width}x${height}`;
    
    const urlParams = [
      `center=${encodeURIComponent(center)}`,
      `zoom=${zoom}`,
      `size=${encodeURIComponent(size)}`,
      `maptype=${mapType}`,
      `key=${encodeURIComponent(config.googleMaps.apiKey)}`,
    ];
    
    // Add markers if requested
    if (markers) {
      urlParams.push(`markers=color:${config.googleMaps.defaultMapSettings.markerColor}|${encodeURIComponent(center)}`);
    }
    
    // Add styling
    config.googleMaps.defaultMapSettings.styles.forEach(style => {
      urlParams.push(`style=${encodeURIComponent(style)}`);
    });
    
    const url = `${config.googleMaps.staticMapBaseUrl}?${urlParams.join('&')}`;
    
    if (config.env === 'development') {
      console.log('Built static map URL:', url.substring(0, 100) + '...');
    }
    
    return url;
    
  } catch (error) {
    console.error('Error building static map URL:', error);
    return null;
  }
};

export default config;
