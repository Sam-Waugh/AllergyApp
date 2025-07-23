import React, { useState, useEffect, useRef } from 'react';
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

// Import native maps for mobile - conditional import with dynamic require
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // Use dynamic import to avoid bundler issues on web
    const maps = eval('require')('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    console.log('✅ react-native-maps loaded successfully');
  } catch (error) {
    console.warn('⚠️ react-native-maps not available:', error);
  }
}

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
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [currentPollenType, setCurrentPollenType] = useState<'TREE_UPI' | 'GRASS_UPI' | 'WEED_UPI'>('TREE_UPI');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const pollenMapTypeRef = useRef<any>(null);

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

  // Web implementation with Google Maps JavaScript API
  if (Platform.OS === 'web') {
    useEffect(() => {
      if (typeof window !== 'undefined') {
        // Load Google Maps script if not already loaded
        if (!(window as any).google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initPollenMap&v=weekly&language=en`;
          script.async = true;
          script.defer = true;
          
          (window as any).initPollenMap = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      }

      return () => {
        if (typeof window !== 'undefined' && (window as any).initPollenMap) {
          (window as any).initPollenMap = undefined;
        }
      };
    }, [latitude, longitude]);

    const getNormalizedCoord = (coord: { x: number; y: number }, zoom: number) => {
      const y = coord.y;
      let x = coord.x;
      const tileRange = 1 << zoom;

      if (y < 0 || y >= tileRange) {
        return null;
      }

      if (x < 0 || x >= tileRange) {
        x = ((x % tileRange) + tileRange) % tileRange;
      }

      return { x: x, y: y };
    };

    const createPollenMapType = (pollenType: string) => {
      return class PollenMapType {
        tileSize: any;
        alt: string | null = null;
        maxZoom: number = 16;
        minZoom: number = 3;
        name: string | null = null;
        projection: any = null;
        radius: number = 6378137;

        constructor(tileSize: any) {
          this.tileSize = tileSize;
        }

        getTile(coord: { x: number; y: number }, zoom: number, ownerDocument: Document) {
          const img = ownerDocument.createElement('img');
          const normalizedCoord = getNormalizedCoord(coord, zoom);
          
          if (!normalizedCoord) {
            return img;
          }

          const { x, y } = normalizedCoord;
          const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
          
          img.style.opacity = '0.8';
          img.crossOrigin = 'anonymous';
          img.src = `https://pollen.googleapis.com/v1/mapTypes/${pollenType}/heatmapTiles/${zoom}/${x}/${y}?key=${apiKey}`;
          
          img.onerror = () => {
            console.log(`Failed to load heatmap tile: ${pollenType} at ${zoom}/${x}/${y}`);
            img.style.display = 'none';
          };

          return img;
        }

        releaseTile(tile: HTMLElement) {
          // Cleanup if needed
        }
      };
    };

    const initializeMap = () => {
      if (!mapRef.current || !(window as any).google) return;

      try {
        const myLatLng = { lat: latitude, lng: longitude };
        
        const map = new (window as any).google.maps.Map(mapRef.current, {
          mapId: 'ffcdd6091fa9fb03',
          zoom: 10,
          center: myLatLng,
          maxZoom: 16,
          minZoom: 3,
          restriction: {
            latLngBounds: { north: 80, south: -80, west: -180, east: 180 },
            strictBounds: true,
          },
          streetViewControl: false,
          mapTypeControl: true,
          zoomControl: true,
          fullscreenControl: false,
        });

        // Add a marker for the location
        new (window as any).google.maps.Marker({
          position: myLatLng,
          map: map,
          title: location,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getPollenColor(pollenCount),
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#fff',
          },
        });

        // Create and add the initial pollen overlay
        const PollenMapTypeClass = createPollenMapType(currentPollenType);
        const pollenMapType = new PollenMapTypeClass(new (window as any).google.maps.Size(256, 256));
        
        map.overlayMapTypes.insertAt(0, pollenMapType);
        
        googleMapRef.current = map;
        pollenMapTypeRef.current = pollenMapType;
        setMapReady(true);

        console.log('✅ Pollen heatmap initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize pollen map:', error);
      }
    };

    const switchPollenType = (newType: 'TREE_UPI' | 'GRASS_UPI' | 'WEED_UPI') => {
      if (!googleMapRef.current || !mapReady) return;

      try {
        // Remove current overlay
        if (pollenMapTypeRef.current) {
          googleMapRef.current.overlayMapTypes.removeAt(0);
        }

        // Add new overlay
        const PollenMapTypeClass = createPollenMapType(newType);
        const newPollenMapType = new PollenMapTypeClass(new (window as any).google.maps.Size(256, 256));
        
        googleMapRef.current.overlayMapTypes.insertAt(0, newPollenMapType);
        pollenMapTypeRef.current = newPollenMapType;
        setCurrentPollenType(newType);

        console.log(`✅ Switched to ${newType} heatmap`);
      } catch (error) {
        console.error('❌ Failed to switch pollen type:', error);
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          {/* Pollen Type Controls */}
          <View style={styles.pollenControls}>
            <TouchableOpacity
              style={[
                styles.pollenButton,
                { backgroundColor: getPollenTypeColor('TREE_UPI') },
                currentPollenType === 'TREE_UPI' && styles.activePollenButton
              ]}
              onPress={() => switchPollenType('TREE_UPI')}
            >
              <Text style={styles.pollenButtonText}>🌳 TREE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.pollenButton,
                { backgroundColor: getPollenTypeColor('GRASS_UPI') },
                currentPollenType === 'GRASS_UPI' && styles.activePollenButton
              ]}
              onPress={() => switchPollenType('GRASS_UPI')}
            >
              <Text style={styles.pollenButtonText}>🌱 GRASS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.pollenButton,
                { backgroundColor: getPollenTypeColor('WEED_UPI') },
                currentPollenType === 'WEED_UPI' && styles.activePollenButton
              ]}
              onPress={() => switchPollenType('WEED_UPI')}
            >
              <Text style={styles.pollenButtonText}>🌿 WEED</Text>
            </TouchableOpacity>
          </View>

          {/* Map Container */}
          {Platform.OS === 'web' ? (
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '300px',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: 300,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: '#f0f8ff',
              }}
            />
          )}

          {/* Location Info Overlay */}
          <View style={styles.locationOverlay}>
            <Text style={styles.locationText}>{location}</Text>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                {pollenCount.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>
              {mapReady ? '✅ Heatmap Active' : '🔄 Loading...'}
            </Text>
          </View>
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

  // Mobile implementation - React Native Maps or fallback
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

  // Mobile with React Native Maps
  if (MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.mobileHeader}>
          <Text style={styles.mapTitle}>🗺️ Interactive Pollen Map</Text>
          <Text style={styles.mapLocationMobile}>{location}</Text>
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
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                {pollenCount.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.statusTextMobile}>
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
  }
  // Fallback for mobile without react-native-maps
  console.log('🔍 Mobile fallback - MapView not available:', { 
    platform: Platform.OS, 
    mapViewLoaded: !!MapView,
    coordinates: { latitude, longitude }
  });

  // Generate static map preview for mobile fallback
  const generateStaticMapUrl = () => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapWidth = 350;
    const mapHeight = 200;
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
      <TouchableOpacity style={styles.fallbackContainer} onPress={handleMapInteraction}>
        <Text style={styles.mapTitle}>🗺️ Interactive Pollen Map</Text>
        <Text style={styles.mapLocationMobile}>{location}</Text>
        
        {/* Static map preview for mobile fallback */}
        <View style={styles.staticMapContainer}>
          <Image
            source={{ uri: generateStaticMapUrl() }}
            style={styles.staticMapImage}
            onLoad={() => console.log('✅ Static map loaded successfully')}
            onError={(error) => {
              console.error('❌ Static map failed to load:', error);
            }}
          />
          
          {/* Map overlay with pollen info */}
          <View style={styles.staticMapOverlay}>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                {pollenCount.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.coordinates}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.mapInstruction}>
          Tap for enhanced fullscreen map view
        </Text>
        <Text style={styles.mapNote}>
          ℹ️ Install react-native-maps for native map display
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
    height: 350,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f8ff',
  },
  pollenControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  pollenButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activePollenButton: {
    shadowOpacity: 0.5,
    elevation: 6,
  },
  pollenButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    maxWidth: '60%',
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pollenIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  pollenIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Mobile-specific styles
  mobileHeader: {
    paddingBottom: 10,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  mapLocationMobile: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 5,
  },
  nativeMapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f8ff',
    marginBottom: 10,
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
  statusTextMobile: {
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
    color: '#888',
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
  // Fallback styles
  fallbackContainer: {
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
  mapCoords: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },  mapNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  // Static map fallback styles
  staticMapContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  staticMapImage: {
    width: '100%',
    height: 200,
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
  coordinates: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});

export default PollenMapView;
