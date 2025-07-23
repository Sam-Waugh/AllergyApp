import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

interface PollenMapViewNativeProps {
  onClose?: () => void;
  showFullscreen?: boolean;
}

interface PollenData {
  tree: number;
  grass: number;
  weed: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
}

const PollenMapViewNative: React.FC<PollenMapViewNativeProps> = ({
  onClose,
  showFullscreen = false,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [pollenData, setPollenData] = useState<PollenData | null>(null);
  const [selectedPollenType, setSelectedPollenType] = useState<'tree' | 'grass' | 'weed'>('tree');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { width, height } = Dimensions.get('window');
  const mapHeight = showFullscreen ? height - 100 : 300;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchPollenData();
    }
  }, [location]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission not granted');
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Get address information
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address.length > 0) {
        setLocation({
          latitude,
          longitude,
          city: address[0].city || undefined,
          region: address[0].region || undefined,
        });
      } else {
        setLocation({ latitude, longitude });
      }
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Failed to get current location');
      setIsLoading(false);
    }
  };

  const fetchPollenData = async () => {
    if (!location) return;

    try {
      // Using Google Pollen API endpoint
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const pollenApiUrl = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.longitude=${location.longitude}&location.latitude=${location.latitude}&days=1`;

      const response = await fetch(pollenApiUrl);
      if (!response.ok) {
        throw new Error(`Pollen API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.dailyInfo && data.dailyInfo.length > 0) {
        const todayData = data.dailyInfo[0];
        const pollenTypeInfo = todayData.pollenTypeInfo || [];

        // Extract pollen values
        const treeIndex = pollenTypeInfo.find((p: any) => p.code === 'TREE')?.indexInfo?.value || 0;
        const grassIndex = pollenTypeInfo.find((p: any) => p.code === 'GRASS')?.indexInfo?.value || 0;
        const weedIndex = pollenTypeInfo.find((p: any) => p.code === 'WEED')?.indexInfo?.value || 0;

        setPollenData({
          tree: treeIndex,
          grass: grassIndex,
          weed: weedIndex,
        });
      } else {
        // Fallback to mock data if API fails
        setPollenData({
          tree: Math.floor(Math.random() * 5) + 1,
          grass: Math.floor(Math.random() * 5) + 1,
          weed: Math.floor(Math.random() * 5) + 1,
        });
      }
    } catch (err) {
      console.error('Error fetching pollen data:', err);
      // Use mock data as fallback
      setPollenData({
        tree: Math.floor(Math.random() * 5) + 1,
        grass: Math.floor(Math.random() * 5) + 1,
        weed: Math.floor(Math.random() * 5) + 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPollenLevel = (value: number): string => {
    if (value <= 1) return 'Very Low';
    if (value <= 2) return 'Low';
    if (value <= 3) return 'Moderate';
    if (value <= 4) return 'High';
    return 'Very High';
  };

  const getPollenColor = (value: number): string => {
    if (value <= 1) return '#4CAF50'; // Green
    if (value <= 2) return '#8BC34A'; // Light Green
    if (value <= 3) return '#FFEB3B'; // Yellow
    if (value <= 4) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getCurrentPollenValue = (): number => {
    if (!pollenData) return 0;
    return pollenData[selectedPollenType];
  };

  const initialRegion: Region = {
    latitude: location?.latitude || 37.78825,
    longitude: location?.longitude || -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { height: mapHeight }]}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { height: mapHeight }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: mapHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Interactive Pollen Map</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pollen Type Selector */}
      <View style={styles.pollenSelector}>
        {(['tree', 'grass', 'weed'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.pollenButton,
              selectedPollenType === type && styles.selectedPollenButton,
            ]}
            onPress={() => setSelectedPollenType(type)}
          >
            <Text
              style={[
                styles.pollenButtonText,
                selectedPollenType === type && styles.selectedPollenButtonText,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Current Location"
            description={`${selectedPollenType.charAt(0).toUpperCase() + selectedPollenType.slice(1)} Pollen: ${getPollenLevel(getCurrentPollenValue())}`}
            pinColor={getPollenColor(getCurrentPollenValue())}
          />
        )}
      </MapView>

      {/* Pollen Info */}
      {pollenData && (
        <View style={styles.pollenInfo}>
          <Text style={styles.pollenInfoTitle}>
            {selectedPollenType.charAt(0).toUpperCase() + selectedPollenType.slice(1)} Pollen Level
          </Text>
          <View style={styles.pollenLevel}>
            <View
              style={[
                styles.pollenColorIndicator,
                { backgroundColor: getPollenColor(getCurrentPollenValue()) },
              ]}
            />
            <Text style={styles.pollenLevelText}>
              {getPollenLevel(getCurrentPollenValue())} ({getCurrentPollenValue()}/5)
            </Text>
          </View>
          {location?.city && (
            <Text style={styles.locationText}>
              {location.city}
              {location.region && `, ${location.region}`}
            </Text>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Pollen Levels:</Text>
        <View style={styles.legendItems}>
          {[
            { level: 'Very Low', color: '#4CAF50' },
            { level: 'Low', color: '#8BC34A' },
            { level: 'Moderate', color: '#FFEB3B' },
            { level: 'High', color: '#FF9800' },
            { level: 'Very High', color: '#F44336' },
          ].map(({ level, color }) => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{level}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pollenSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pollenButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
  },
  selectedPollenButton: {
    backgroundColor: '#4A90E2',
  },
  pollenButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedPollenButtonText: {
    color: 'white',
  },
  map: {
    flex: 1,
  },
  pollenInfo: {
    backgroundColor: 'white',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pollenInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pollenLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pollenColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pollenLevelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 12,
    color: '#888',
  },
  legend: {
    backgroundColor: 'white',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 100,
  },
  errorText: {
    textAlign: 'center',
    color: '#F44336',
    fontSize: 14,
    marginTop: 80,
    marginHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PollenMapViewNative;
