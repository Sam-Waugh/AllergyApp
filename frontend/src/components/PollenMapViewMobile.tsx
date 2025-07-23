import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FullscreenMapModal } from './FullscreenMapModal';

// Import react-native-maps for mobile
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface PollenMapViewMobileProps {
  latitude: number;
  longitude: number;
  location: string;
  pollenCount: string;
  heatmapData?: any;
  pollenTypes?: any[];
  onMapPress?: () => void;
}

export const PollenMapViewMobile: React.FC<PollenMapViewMobileProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
  onMapPress,
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const getPollenColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'LOW':
      case 'VERY_LOW':
        return 'green';
      case 'MODERATE':
        return 'orange';
      case 'HIGH':
      case 'VERY_HIGH':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPollenColorHex = (level: string) => {
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

  // Validate coordinates
  const isValidCoordinate = (lat: number, lng: number) => {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' && 
      !isNaN(lat) && 
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  };

  if (!isValidCoordinate(latitude, longitude)) {
    console.error('❌ Invalid coordinates for mobile map:', { latitude, longitude });
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Map Unavailable</Text>
          <Text style={styles.errorText}>Invalid location coordinates</Text>
          <Text style={styles.errorDetails}>
            Lat: {latitude}, Lng: {longitude}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mobileHeader}>
        <Text style={styles.mapTitle}>🗺️ Interactive Pollen Map (Mobile)</Text>
        <Text style={styles.mapLocation}>{location}</Text>
      </View>

      {/* Native MapView for Mobile */}
      <View style={styles.nativeMapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.nativeMap}
          initialRegion={{
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onMapReady={() => {
            setMapReady(true);
            console.log('✅ Native map ready');
          }}
          onPress={handleMapInteraction}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Main location marker */}
          <Marker
            coordinate={{
              latitude: latitude,
              longitude: longitude,
            }}
            title={location}
            description={`Pollen Level: ${pollenCount.toUpperCase()}`}
            pinColor={getPollenColor(pollenCount)}
          />

          {/* Additional pollen monitoring points (simulated) */}
          {[
            { lat: latitude + 0.01, lng: longitude + 0.01, level: 'LOW', label: 'Monitor 1' },
            { lat: latitude - 0.01, lng: longitude - 0.01, level: 'MODERATE', label: 'Monitor 2' },
            { lat: latitude + 0.01, lng: longitude - 0.01, level: 'HIGH', label: 'Monitor 3' },
          ].map((point, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: point.lat,
                longitude: point.lng,
              }}
              title={point.label}
              description={`Pollen: ${point.level}`}
              pinColor={getPollenColor(point.level)}
            />
          ))}
        </MapView>

        {/* Map overlay info */}
        <View style={styles.nativeMapOverlay}>
          <View style={[styles.pollenIndicator, { backgroundColor: getPollenColorHex(pollenCount) }]}>
            <Text style={styles.pollenIndicatorText}>
              {pollenCount.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {mapReady ? '✅ Live' : '🔄 Loading...'}
          </Text>
        </View>
      </View>

      <Text style={styles.mapInstruction}>
        Tap map for fullscreen view with enhanced pollen data
      </Text>
      
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
  mobileHeader: {
    paddingBottom: 10,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  mapLocation: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#666',
    marginBottom: 5,
  },
  nativeMapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  nativeMap: {
    ...StyleSheet.absoluteFillObject,
  },
  nativeMapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusText: {
    color: '#333',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mapInstruction: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  // Error container styles
  errorContainer: {
    height: 200,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
});

export default PollenMapViewMobile;
