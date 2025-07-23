import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
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

// Extend window type for TypeScript
declare global {
  interface Window {
    google: any;
    initPollenMap?: () => void;
  }
}

export const PollenMapView: React.FC<PollenMapViewProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
  onMapPress,
}) => {
  console.log('🏗️ PollenMapViewHeatmapClean component initialized');
  console.log('📍 Props received:', { 
    latitude, 
    longitude, 
    location, 
    pollenCount, 
    heatmapDataExists: !!heatmapData,
    pollenTypesCount: pollenTypes.length 
  });
  
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
      }      getTile(coord: { x: number; y: number }, zoom: number, ownerDocument: Document) {
        console.log(`🔍 Requesting tile: ${pollenType} at ${zoom}/${coord.x}/${coord.y}`);
        
        const img = ownerDocument.createElement('img');
        const normalizedCoord = getNormalizedCoord(coord, zoom);
        
        if (!normalizedCoord) {
          console.log(`❌ Invalid coordinates for tile: ${zoom}/${coord.x}/${coord.y}`);
          return img;
        }

        const { x, y } = normalizedCoord;
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        img.style.opacity = '0.8';
        img.crossOrigin = 'anonymous';
        
        const tileUrl = `https://pollen.googleapis.com/v1/mapTypes/${pollenType}/heatmapTiles/${zoom}/${x}/${y}?key=${apiKey}`;
        console.log(`🌍 Loading tile from: ${tileUrl}`);
        
        img.src = tileUrl;
        
        img.onerror = () => {
          console.error(`❌ Failed to load heatmap tile: ${pollenType} at ${zoom}/${x}/${y}`);
          console.error(`🔗 Failed URL: ${tileUrl}`);
          img.style.display = 'none';
        };

        img.onload = () => {
          console.log(`✅ Successfully loaded heatmap tile: ${pollenType} at ${zoom}/${x}/${y}`);
        };

        return img;
      }

      releaseTile(tile: HTMLElement) {
        // Cleanup if needed
      }
    };
  };
  const initializeMap = () => {
    console.log('🗺️ initializeMap called');
    console.log('📍 mapRef.current:', !!mapRef.current);
    console.log('🌍 window.google:', !!window.google);
    
    if (!mapRef.current || !window.google) {
      console.error('❌ Missing requirements:', { 
        mapRef: !!mapRef.current, 
        googleMaps: !!window.google 
      });
      return;
    }

    try {
      const myLatLng = { lat: latitude, lng: longitude };
      console.log('📍 Creating map at:', myLatLng);
      
      const map = new window.google.maps.Map(mapRef.current, {
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

      console.log('✅ Google Maps instance created');

      // Add a marker for the location
      const marker = new window.google.maps.Marker({
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

      console.log('✅ Marker created');

      // Create and add the initial pollen overlay
      console.log('🌸 Creating pollen overlay for:', currentPollenType);
      const PollenMapTypeClass = createPollenMapType(currentPollenType);
      const pollenMapType = new PollenMapTypeClass(new window.google.maps.Size(256, 256));
      
      console.log('🗺️ Adding overlay to map...');
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
    console.log(`🔄 Switching pollen type to: ${newType}`);
    
    if (!googleMapRef.current || !mapReady) {
      console.error('❌ Cannot switch pollen type - map not ready:', { 
        mapExists: !!googleMapRef.current, 
        mapReady 
      });
      return;
    }

    try {
      // Remove current overlay
      if (pollenMapTypeRef.current) {
        console.log('🗑️ Removing current overlay');
        googleMapRef.current.overlayMapTypes.removeAt(0);
      }

      // Add new overlay
      console.log(`🌸 Creating new overlay for: ${newType}`);
      const PollenMapTypeClass = createPollenMapType(newType);
      const newPollenMapType = new PollenMapTypeClass(new window.google.maps.Size(256, 256));
      
      console.log('🗺️ Adding new overlay to map');
      googleMapRef.current.overlayMapTypes.insertAt(0, newPollenMapType);
      pollenMapTypeRef.current = newPollenMapType;
      setCurrentPollenType(newType);

      console.log(`✅ Successfully switched to ${newType} heatmap`);
    } catch (error) {
      console.error('❌ Failed to switch pollen type:', error);
    }
  };

  const handleMapInteraction = () => {
    setShowFullscreen(true);
    onMapPress?.();
  };
  useEffect(() => {
    console.log('🔧 PollenMapViewHeatmapClean useEffect triggered');
    console.log('📍 Coordinates:', { latitude, longitude });
    console.log('🌐 Platform.OS:', Platform.OS);
    console.log('🪟 window exists:', typeof window !== 'undefined');
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      console.log('✅ Web platform detected, initializing Google Maps...');
      
      // Load Google Maps script if not already loaded
      if (!window.google) {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        console.log('🔑 API Key (first 10 chars):', apiKey?.substring(0, 10) + '...');
        console.log('🌍 Loading Google Maps script...');
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initPollenMap&v=weekly&language=en`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('✅ Google Maps script loaded successfully');
        };
        
        script.onerror = (error) => {
          console.error('❌ Failed to load Google Maps script:', error);
        };
        
        window.initPollenMap = initializeMap;
        document.head.appendChild(script);
      } else {
        console.log('🔄 Google Maps already loaded, initializing map...');
        initializeMap();
      }
    } else {
      console.log('📱 Non-web platform or window unavailable');
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.initPollenMap) {
        window.initPollenMap = undefined as any;
      }
    };
  }, [latitude, longitude]);

  if (Platform.OS === 'web') {
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

  // Mobile/Native fallback - simplified for now
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
    textAlign: 'center',
    marginBottom: 2,
    color: '#333',
  },
  mapCoords: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  mapInstruction: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
