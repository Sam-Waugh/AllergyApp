import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FullscreenMapModal } from './FullscreenMapModal';

interface PollenMapViewWebProps {
  latitude: number;
  longitude: number;
  location: string;
  pollenCount: string;
  heatmapData?: any;
  pollenTypes?: any[];
  onMapPress?: () => void;
}

const { width } = Dimensions.get('window');

export const PollenMapViewWeb: React.FC<PollenMapViewWebProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
  onMapPress,
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

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

  // Generate static map for web fallback
  const generateStaticMapUrl = () => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapWidth = Math.min(width - 40, 400);
    const mapHeight = 250;
    const zoom = 12;
    
    const centerLat = Number(latitude).toFixed(6);
    const centerLng = Number(longitude).toFixed(6);
    const center = `${centerLat},${centerLng}`;
    
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = [
      `center=${center}`,
      `zoom=${zoom}`,
      `size=${mapWidth}x${mapHeight}`,
      `maptype=roadmap`,
      `key=${apiKey}`,
      `markers=color:red%7Csize:mid%7Clabel:📍%7C${center}`
    ];
    
    return `${baseUrl}?${params.join('&')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mapContainer} onPress={handleMapInteraction}>
        <Text style={styles.mapTitle}>🗺️ Interactive Pollen Map (Web)</Text>
        
        <View style={styles.staticMapContainer}>
          <Image
            source={{ uri: generateStaticMapUrl() }}
            style={styles.staticMapImage}
            onLoad={() => console.log('✅ Web static map loaded successfully')}
            onError={(error) => {
              console.error('❌ Web static map failed to load:', error);
            }}
          />
          
          {/* Map overlay with pollen info */}
          <View style={styles.staticMapOverlay}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{location}</Text>
              <Text style={styles.coordinates}>
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            </View>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                {pollenCount.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.mapInstruction}>
          Tap for enhanced fullscreen map view
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
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f8ff',
    padding: 15,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  staticMapContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  staticMapImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  staticMapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coordinates: {
    fontSize: 10,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pollenIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pollenIndicatorText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mapInstruction: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default PollenMapViewWeb;
