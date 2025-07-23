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

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mapContainer: {
    height: 350, // Increased height for heatmap controls
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
  },  nativeMapContainer: {
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    padding: 10,
  },
  mapPreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  mapPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  mapLocation: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  mapCoords: {
    fontSize: 12,
    color: '#ccc',
  },  mapInstruction: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  // Mobile-specific styles
  mobileHeader: {
    paddingBottom: 10,
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
  mobileStatusText: {
    color: '#333',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  mapNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

// Import native maps for mobile
let MapView: any, Marker: any, PROVIDER_GOOGLE: any, UrlTile: any;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
    UrlTile = maps.UrlTile;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
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
        return '#22b600';      case 'WEED_UPI':
        return '#26cc00';
      default:
        return '#4CAF50';
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Load Google Maps script if not already loaded
      if (!window.google) {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initPollenMap&v=weekly&language=en`;
        script.async = true;
        script.defer = true;
        
        window.initPollenMap = initializeMap;
        document.head.appendChild(script);      } else {
        initializeMap();
      }
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.initPollenMap) {
        window.initPollenMap = undefined as any;
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
        }        const { x, y } = normalizedCoord;
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
    if (!mapRef.current || !window.google) return;

    try {
      const myLatLng = { lat: latitude, lng: longitude };
      
      const map = new window.google.maps.Map(mapRef.current, {
        mapId: 'ffcdd6091fa9fb03', // Use the map ID from the documentation
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
      new window.google.maps.Marker({
        position: myLatLng,
        map: map,
        title: location,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getPollenColor(pollenCount),
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#fff',
        },
      });

      // Create and add the initial pollen overlay
      const PollenMapTypeClass = createPollenMapType(currentPollenType);
      const pollenMapType = new PollenMapTypeClass(new window.google.maps.Size(256, 256));
      
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
      const newPollenMapType = new PollenMapTypeClass(new window.google.maps.Size(256, 256));
      
      googleMapRef.current.overlayMapTypes.insertAt(0, newPollenMapType);
      pollenMapTypeRef.current = newPollenMapType;
      setCurrentPollenType(newType);

      console.log(`✅ Switched to ${newType} heatmap`);
    } catch (error) {
      console.error('❌ Failed to switch pollen type:', error);
    }
  };
  const handleMapInteraction = () => {
    setShowFullscreen(true);
    onMapPress?.();
  };

  const generatePreviewMapUrl = () => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapWidth = Math.min(width - 40, 400);
    const mapHeight = 200;
    const zoom = 10;
    
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

  // --- UI/UX REFINEMENTS START ---
  // Add a helper for pollen type display
  const pollenTypeDisplay = {
    TREE_UPI: { label: '🌳 TREE', desc: 'Tree pollen heatmap' },
    GRASS_UPI: { label: '🌱 GRASS', desc: 'Grass pollen heatmap' },
    WEED_UPI: { label: '🌿 WEED', desc: 'Weed pollen heatmap' },
  };

  // --- In pollenTypeButtons (mobile) and pollenControls (web), enhance button UI ---
  const renderPollenTypeButtons = (isMobile = false) => (
    <View style={{ flexDirection: 'row', justifyContent: isMobile ? 'center' : 'flex-start', marginBottom: isMobile ? 8 : 0 }}>
      {(['TREE_UPI', 'GRASS_UPI', 'WEED_UPI'] as const).map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.pollenButton,
            { backgroundColor: getPollenTypeColor(type),
              borderWidth: currentPollenType === type ? 2 : 0,
              borderColor: currentPollenType === type ? '#333' : 'transparent',
              transform: [{ scale: currentPollenType === type ? 1.08 : 1 }],
              shadowColor: currentPollenType === type ? '#333' : '#000',
              shadowOpacity: currentPollenType === type ? 0.7 : 0.3,
            },
            currentPollenType === type && styles.activePollenButton,
            { marginHorizontal: 4 },
          ]}
          onPress={() => (Platform.OS === 'web' ? switchPollenType(type) : setCurrentPollenType(type))}
          accessibilityLabel={pollenTypeDisplay[type].desc}
          accessibilityRole="button"
        >
          <Text style={[styles.pollenButtonText, { fontSize: 14, letterSpacing: 0.5 }]}> 
            {pollenTypeDisplay[type].label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={[styles.mapContainer, { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }]}> {/* Subtle shadow */}
          {/* Pollen Type Controls */}
          <View style={styles.pollenControls}>
            {renderPollenTypeButtons(false)}
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
          <View style={[styles.locationOverlay, { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }]}> {/* Subtle shadow */}
            <Text style={styles.locationText}>{location}</Text>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}> 
              <Text style={styles.pollenIndicatorText}>{pollenCount.toUpperCase()}</Text>
            </View>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>
              {mapReady ? '✅ Heatmap Active' : '🔄 Loading...'}
            </Text>
          </View>
        </View>
        <Text style={styles.mapInstruction}>
          Click a pollen type to view its heatmap. Tap the map for fullscreen.
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
  }  // Mobile/Native implementation - Use React Native Maps
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (MapView) {
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

    // --- BEGIN: Add pollen type switch controls for mobile ---
    const pollenTypeButtons = (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
        {['TREE_UPI', 'GRASS_UPI', 'WEED_UPI'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.pollenButton,
              { backgroundColor: getPollenTypeColor(type) },
              currentPollenType === type && styles.activePollenButton,
              { marginHorizontal: 4 },
            ]}
            onPress={() => setCurrentPollenType(type as any)}
          >
            <Text style={styles.pollenButtonText}>
              {type === 'TREE_UPI' ? '🌳 TREE' : type === 'GRASS_UPI' ? '🌱 GRASS' : '🌿 WEED'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
    // --- END: Add pollen type switch controls for mobile ---

    // --- BEGIN: Add UrlTile overlay for pollen heatmap ---
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const tileUrlTemplate = `https://pollen.googleapis.com/v1/mapTypes/${currentPollenType}/heatmapTiles/{z}/{x}/{y}?key=${apiKey}`;
    // --- END: Add UrlTile overlay for pollen heatmap ---

    return (
      <View style={styles.container}>
        <View style={styles.mobileHeader}>
          <Text style={styles.mapTitle}>🗺️ Interactive Pollen Map</Text>
          <Text style={styles.mapLocation}>{location}</Text>
        </View>
        {/* Pollen Type Controls */}
        {renderPollenTypeButtons(true)}
        {/* Native MapView for Mobile */}
        <View style={[styles.nativeMapContainer, { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }]}> {/* Subtle shadow */}
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

            {/* Pollen Heatmap Overlay */}
            {MapView.UrlTile && (
              <MapView.UrlTile
                urlTemplate={tileUrlTemplate}
                maximumZ={16}
                minimumZ={3}
                zIndex={1}
                tileSize={256}
                opacity={0.8}
              />
            )}
          </MapView>

          {/* Map overlay info */}
          <View style={styles.nativeMapOverlay}>
            <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenIndicatorText}>
                {pollenCount.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.mobileStatusText}>
              {mapReady ? '✅ Live Map' : '🔄 Loading...'}
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
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.fallbackContainer} onPress={handleMapInteraction}>
        <Text style={styles.mapTitle}>🗺️ Interactive Pollen Map</Text>
        <Text style={styles.mapLocation}>{location}</Text>
        <Text style={styles.mapCoords}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
        
        <View style={[styles.pollenIndicator, { backgroundColor: getPollenColor(pollenCount) }]}>
          <Text style={styles.pollenIndicatorText}>
            Pollen Level: {pollenCount.toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.mapInstruction}>
          Tap for enhanced map view
        </Text>
        <Text style={styles.mapNote}>
          ℹ️ Native maps require react-native-maps installation
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
  }
};

// Extend window type for TypeScript
declare global {
  interface Window {
    google: any;
    initPollenMap?: () => void;
  }
}

export {};
