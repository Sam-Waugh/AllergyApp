import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FullscreenMapModal } from './FullscreenMapModal';

interface PollenMapViewProps {
  latitude: number;
  longitude: number;
  location: string;
  pollenCount: string;
  heatmapData?: any;
  pollenTypes?: any[];
  onMapPress?: () => void;
}

const { width } = Dimensions.get('window');

export const PollenMapView: React.FC<PollenMapViewProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
  onMapPress,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Generate Google Maps Static URL with comprehensive error handling
  const generateStaticMapUrl = () => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ No Google Maps API key found');
      setMapError('API key not configured');
      return null;
    }
    
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      console.error('❌ Invalid coordinates:', { latitude, longitude });
      setMapError('Invalid location coordinates');
      return null;
    }
    
    try {
      const zoom = 11;
      const mapWidth = Math.min(Math.floor(width - 32), 640);
      const mapHeight = 200;
      
      // Format coordinates to 6 decimal places for precision
      const lat = Number(latitude).toFixed(6);
      const lng = Number(longitude).toFixed(6);
      
      // Build URL using Google's recommended format
      const params = new URLSearchParams({
        center: `${lat},${lng}`,
        zoom: zoom.toString(),
        size: `${mapWidth}x${mapHeight}`,
        maptype: mapType,
        markers: `color:red|label:📍|${lat},${lng}`,
        key: apiKey
      });
      
      const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
      
      console.log('🗺️ Generated Google Maps URL');
      console.log('📍 Location:', location, `(${lat}, ${lng})`);
      console.log('🔧 Map Type:', mapType);
      console.log('📏 Size:', `${mapWidth}x${mapHeight}`);
      
      return url;
      
    } catch (error) {
      console.error('❌ Error generating map URL:', error);
      setMapError('Failed to generate map URL');
      return null;
    }
  };

  const getPollenColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'LOW':
      case 'VERY_LOW':
        return '#4CAF50';
      case 'MODERATE':
        return '#FFC107';
      case 'HIGH':
      case 'VERY_HIGH':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handleMapInteraction = () => {
    setShowFullscreen(true);
    onMapPress?.();
  };

  const showPollenLayerInfo = () => {
    Alert.alert(
      'Pollen Heatmap Layers',
      `Available pollen data layers for ${location}:\n\n` +
      `🌳 Tree Pollen: ${heatmapData?.tiles?.tree_upi ? 'Available' : 'Not available'}\n` +
      `🌱 Grass Pollen: ${heatmapData?.tiles?.grass_upi ? 'Available' : 'Not available'}\n` +
      `🌿 Weed Pollen: ${heatmapData?.tiles?.weed_upi ? 'Available' : 'Not available'}`
    );
  };

  const cycleMapType = () => {
    const types: ('roadmap' | 'satellite' | 'hybrid')[] = ['roadmap', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
    setMapError(null); // Clear error when changing map type
  };

  const handleMapError = (error: any) => {
    console.error('❌ Map image failed to load:', error);
    setMapError('Failed to load map image');
    
    // Show troubleshooting alert
    Alert.alert(
      'Map Loading Error',
      'The map could not be loaded. This might be due to:\n\n' +
      '• Google Maps API key configuration\n' +
      '• Network connectivity issues\n' +
      '• API quota exceeded\n\n' +
      'Please check your internet connection and try again.',
      [
        { text: 'Retry', onPress: () => setMapError(null) },
        { text: 'OK' }
      ]
    );
  };

  if (Platform.OS === 'web') {
    const mapUrl = generateStaticMapUrl();
    
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.mapContainer} onPress={handleMapInteraction}>
          {mapUrl && !mapError ? (
            <img
              src={mapUrl}
              style={styles.staticMapImage}
              alt={`Map of ${location}`}
              onLoad={() => {
                console.log('✅ Map image loaded successfully');
                setMapError(null);
              }}
              onError={handleMapError}
            />
          ) : (
            <div style={styles.fallbackContainer}>
              <div style={styles.fallbackIcon}>🗺️</div>
              <div style={styles.fallbackText}>
                <div style={styles.fallbackTitle}>
                  {mapError ? 'Map Unavailable' : 'Loading Map...'}
                </div>
                <div style={styles.fallbackSubtitle}>
                  {mapError || 'Connecting to Google Maps'}
                </div>
                <div style={styles.fallbackLocation}>📍 {location}</div>
                <div style={styles.fallbackCoords}>
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
                {mapError && (
                  <button 
                    style={styles.retryButton}
                    onClick={() => setMapError(null)}
                  >
                    🔄 Retry
                  </button>
                )}
              </div>
            </div>
          )}
          
          <View style={styles.mapOverlay}>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                Pollen: {pollenCount.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.mapInstruction}>
              Click for enhanced map view
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={cycleMapType}>
            <Text style={styles.controlButtonText}>
              {mapType === 'roadmap' ? '🗺️ Road' : mapType === 'satellite' ? '🛰️ Satellite' : '🌍 Hybrid'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={() => setShowFullscreen(true)}>
            <Text style={styles.controlButtonText}>🔍 Fullscreen</Text>
          </TouchableOpacity>
          
          {heatmapData && (
            <TouchableOpacity style={styles.controlButton} onPress={showPollenLayerInfo}>
              <Text style={styles.controlButtonText}>🌸 Layers</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FullscreenMapModal
          visible={showFullscreen}
          onClose={() => setShowFullscreen(false)}
          latitude={latitude}
          longitude={longitude}
          location={location}
          pollenCount={pollenCount}
          heatmapData={heatmapData}
          pollenTypes={pollenTypes}
        />
      </View>
    );
  }

  // Mobile/Native implementation
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.nativeMapContainer} onPress={handleMapInteraction}>
        <Text style={styles.mapTitle}>🗺️ Interactive Map</Text>
        <Text style={styles.mapLocation}>📍 {location}</Text>
        <Text style={styles.mapCoords}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
        
        <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
          <Text style={styles.pollenIndicatorText}>
            Pollen Level: {pollenCount.toUpperCase()}
          </Text>
        </View>
        
        {heatmapData && (
          <View style={styles.heatmapIndicators}>
            <Text style={styles.heatmapTitle}>Available Pollen Layers:</Text>
            <View style={styles.heatmapTypes}>
              {heatmapData.tiles?.tree_upi && <Text style={styles.heatmapType}>🌳 Trees</Text>}
              {heatmapData.tiles?.grass_upi && <Text style={styles.heatmapType}>🌱 Grass</Text>}
              {heatmapData.tiles?.weed_upi && <Text style={styles.heatmapType}>🌿 Weeds</Text>}
            </View>
          </View>
        )}
        
        <Text style={styles.mapInstruction}>
          Tap for enhanced map view
        </Text>
      </TouchableOpacity>
      
      <FullscreenMapModal
        visible={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        latitude={latitude}
        longitude={longitude}
        location={location}
        pollenCount={pollenCount}
        heatmapData={heatmapData}
        pollenTypes={pollenTypes}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  staticMapImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as any,
  fallbackContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#f0f8ff',
    border: '2px dashed #ccc',
  } as any,
  fallbackIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  } as any,
  fallbackText: {
    textAlign: 'center',
    color: '#666',
  } as any,
  fallbackTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '16px',
  } as any,
  fallbackSubtitle: {
    fontSize: '14px',
    marginBottom: '12px',
  } as any,
  fallbackLocation: {
    fontSize: '12px',
    marginBottom: '4px',
  } as any,
  fallbackCoords: {
    fontSize: '12px',
    fontFamily: 'monospace',
  } as any,
  retryButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  } as any,
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 12,
  },
  nativeMapContainer: {
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mapLocation: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 4,
  },
  mapCoords: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pollenIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pollenIndicatorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  mapInstruction: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
    alignSelf: 'center',
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heatmapIndicators: {
    marginVertical: 12,
    alignItems: 'center',
  },
  heatmapTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  heatmapTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  heatmapType: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
