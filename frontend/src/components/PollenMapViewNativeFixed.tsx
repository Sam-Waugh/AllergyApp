import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface PollenMapViewNativeProps {
  latitude: number;
  longitude: number;
  location: string;
  pollenCount: string;
  heatmapData?: any;
  pollenTypes?: any[];
  onMapPress?: () => void;
}

const { width } = Dimensions.get('window');

export const PollenMapViewNative: React.FC<PollenMapViewNativeProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
  onMapPress,
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentPollenType, setCurrentPollenType] = useState<'TREE_UPI' | 'GRASS_UPI' | 'WEED_UPI'>('TREE_UPI');

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

  const getPollenTypeColor = (type: string) => {
    switch (type) {
      case 'TREE_UPI':
        return '#009c1a';
      case 'GRASS_UPI':
        return '#22b600';
      case 'WEED_UPI':
        return '#26cc00';
      default:
        return '#4CAF50';
    }
  };

  const handleMapPress = () => {
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
    console.error('❌ Invalid coordinates:', { latitude, longitude });
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Map Unavailable</Text>
        <Text style={styles.errorText}>Invalid location coordinates</Text>
        <Text style={styles.errorDetails}>
          Lat: {latitude}, Lng: {longitude}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Interactive Pollen Map</Text>
        <Text style={styles.locationText}>{location}</Text>
      </View>

      {/* Pollen Type Controls */}
      <View style={styles.pollenControls}>
        <TouchableOpacity
          style={[
            styles.pollenButton,
            { backgroundColor: getPollenTypeColor('TREE_UPI') },
            currentPollenType === 'TREE_UPI' && styles.activePollenButton
          ]}
          onPress={() => setCurrentPollenType('TREE_UPI')}
        >
          <Text style={styles.pollenButtonText}>🌳 TREE</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.pollenButton,
            { backgroundColor: getPollenTypeColor('GRASS_UPI') },
            currentPollenType === 'GRASS_UPI' && styles.activePollenButton
          ]}
          onPress={() => setCurrentPollenType('GRASS_UPI')}
        >
          <Text style={styles.pollenButtonText}>🌱 GRASS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.pollenButton,
            { backgroundColor: getPollenTypeColor('WEED_UPI') },
            currentPollenType === 'WEED_UPI' && styles.activePollenButton
          ]}
          onPress={() => setCurrentPollenType('WEED_UPI')}
        >
          <Text style={styles.pollenButtonText}>🌿 WEED</Text>
        </TouchableOpacity>
      </View>

      {/* Native MapView for Mobile */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
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
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
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
        <View style={styles.mapOverlay}>
          <View style={styles.overlayLeft}>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                {pollenCount.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.overlayRight}>
            <Text style={styles.statusText}>
              {mapReady ? '✅ Live Map' : '🔄 Loading...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Pollen Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Current Pollen Data</Text>
        <Text style={styles.infoText}>
          📍 {location}
        </Text>
        <Text style={styles.infoText}>
          🌡️ Level: {pollenCount.toUpperCase()}
        </Text>
        <Text style={styles.infoText}>
          🎯 Viewing: {currentPollenType.replace('_UPI', '').toLowerCase()}
        </Text>
        {pollenTypes.length > 0 && (
          <Text style={styles.infoText}>
            📊 {pollenTypes.length} pollen types tracked
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  pollenControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  pollenButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activePollenButton: {
    shadowOpacity: 0.5,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  pollenButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f8ff',
    marginBottom: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollenIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pollenIndicatorText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
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
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
  },
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

export default PollenMapViewNative;
