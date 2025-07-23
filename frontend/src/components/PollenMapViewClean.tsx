import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
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
  const [mapLoadError, setMapLoadError] = useState(false);

  // Generate Google Maps Static URL with improved error handling
  const generateStaticMapUrl = () => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Google Maps API key not found');
      return null;
    }
    
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      console.error('❌ Invalid coordinates provided:', { latitude, longitude });
      return null;
    }
    
    try {
      const zoom = 11;
      const mapWidth = Math.min(Math.floor(width - 32), 640);
      const mapHeight = 200;
      const size = `${mapWidth}x${mapHeight}`;
      
      // Format coordinates properly
      const centerLat = Number(latitude).toFixed(6);
      const centerLng = Number(longitude).toFixed(6);
      const center = `${centerLat},${centerLng}`;
      
      // Build URL with simplified parameters to avoid encoding issues
      const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
      const params = [
        `center=${center}`,
        `zoom=${zoom}`,
        `size=${size}`,
        `maptype=${mapType}`,
        `key=${apiKey}`,
        `markers=color:red|${center}`
      ];
      
      const url = `${baseUrl}?${params.join('&')}`;
      console.log('🗺️ Generated Maps URL length:', url.length);
      console.log('🗺️ URL preview:', url.substring(0, 120) + '...');
      return url;
      
    } catch (error) {
      console.error('❌ Error generating map URL:', error);
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
  };
  if (Platform.OS === 'web') {
    const mapUrl = generateStaticMapUrl();
    
    console.log('🗺️ MapView Debug:', {
      platform: Platform.OS,
      latitude,
      longitude,
      location,
      mapUrl: mapUrl ? 'Generated' : 'Failed to generate',
      mapLoadError
    });
    
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.mapContainer} onPress={handleMapInteraction}>
          <View style={styles.webImageContainer}>
            {mapUrl && !mapLoadError ? (
              <Image
                source={{ uri: mapUrl }}
                style={styles.mapImage}
                onLoad={() => {
                  console.log('✅ Map image loaded successfully');
                  setMapLoadError(false);
                }}
                onError={(error) => {
                  console.error('❌ Failed to load map image:', mapUrl);
                  console.error('❌ Error details:', error);
                  setMapLoadError(true);
                }}
              />
            ) : (              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackIcon}>🗺️</Text>
                <Text style={styles.mapFallbackTitle}>Interactive Pollen Map</Text>
                <Text style={styles.mapFallbackSubtitle}>
                  {mapUrl ? 'Loading map...' : 'Google Maps API required for imagery'}
                </Text>
                <Text style={styles.mapFallbackLocation}>📍 {location}</Text>
                <Text style={styles.mapFallbackCoords}>
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Text>
                <View style={[styles.pollenPreview, { backgroundColor: getPollenColor(pollenCount) }]}>
                  <Text style={styles.pollenPreviewText}>
                    Current Pollen: {pollenCount.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.mapFallbackHint}>
                  ✨ Tap for enhanced view • All features available
                </Text>
              </View>
            )}
          </View>
          
          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.controlButton} onPress={cycleMapType}>
              <Text style={styles.controlButtonText}>
                {mapType === 'roadmap' ? '🗺️' : mapType === 'satellite' ? '🛰️' : '🔗'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={showPollenLayerInfo}>
              <Text style={styles.controlButtonText}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          
          {/* Pollen Level Indicator */}
          <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
            <Text style={styles.pollenIndicatorText}>
              Pollen: {pollenCount.toUpperCase()}
            </Text>
          </View>
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
  }

  // Mobile/Native implementation - React Native components only
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
    backgroundColor: '#f0f8ff',
  },
  webImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
  },
  mapFallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapFallbackTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    color: '#2196F3',
    textAlign: 'center',
  },
  mapFallbackSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    color: '#666',
    textAlign: 'center',
  },
  mapFallbackLocation: {
    fontSize: 12,
    marginBottom: 4,
    color: '#4CAF50',
    textAlign: 'center',
  },
  mapFallbackCoords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapFallbackHint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 14,
  },
  pollenIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollenIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nativeMapContainer: {
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
    textAlign: 'center',
  },
  mapCoords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapInstruction: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  heatmapIndicators: {
    marginTop: 12,
    alignItems: 'center',
  },
  heatmapTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },  heatmapTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapType: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  pollenPreview: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 8,
    alignItems: 'center',
  },
  pollenPreviewText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
