import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface PollenMapViewDebugProps {
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
    initPollenMapDebug?: () => void;
  }
}

export const PollenMapViewDebug: React.FC<PollenMapViewDebugProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
  onMapPress,
}) => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [currentPollenType, setCurrentPollenType] = useState<'TREE_UPI' | 'GRASS_UPI' | 'WEED_UPI'>('TREE_UPI');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const pollenMapTypeRef = useRef<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLogs(prev => [logMessage, ...prev].slice(0, 20)); // Keep last 20 logs
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
    addLog(`Creating PollenMapType for: ${pollenType}`);
    
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
        addLog(`PollenMapType constructor called for ${pollenType}`);
      }

      getTile(coord: { x: number; y: number }, zoom: number, ownerDocument: Document) {
        addLog(`🔍 Requesting tile: ${pollenType} at ${zoom}/${coord.x}/${coord.y}`);
        
        const img = ownerDocument.createElement('img');
        const normalizedCoord = getNormalizedCoord(coord, zoom);
        
        if (!normalizedCoord) {
          addLog(`❌ Invalid coordinates for tile: ${zoom}/${coord.x}/${coord.y}`);
          return img;
        }        const { x, y } = normalizedCoord;
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        
        img.style.opacity = '0.8';
        img.crossOrigin = 'anonymous';
        
        const tileUrl = `https://pollen.googleapis.com/v1/mapTypes/${pollenType}/heatmapTiles/${zoom}/${x}/${y}?key=${apiKey}`;
        addLog(`🌍 Loading tile from: ${tileUrl.substring(0, 80)}...`);
        
        img.src = tileUrl;
        
        img.onerror = () => {
          addLog(`❌ Failed to load heatmap tile: ${pollenType} at ${zoom}/${x}/${y}`);
        };

        img.onload = () => {
          addLog(`✅ Successfully loaded heatmap tile: ${pollenType} at ${zoom}/${x}/${y}`);
        };

        return img;
      }

      releaseTile(tile: HTMLElement) {
        // Cleanup if needed
      }
    };
  };

  const initializeMap = () => {
    addLog('🗺️ initializeMap called');
    addLog(`📍 mapRef.current: ${!!mapRef.current}`);
    addLog(`🌍 window.google: ${!!window.google}`);
    
    if (!mapRef.current || !window.google) {
      addLog(`❌ Missing requirements - mapRef: ${!!mapRef.current}, google: ${!!window.google}`);
      return;
    }

    try {
      const myLatLng = { lat: latitude, lng: longitude };
      addLog(`📍 Creating map at: ${myLatLng.lat}, ${myLatLng.lng}`);
      
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

      addLog('✅ Google Maps instance created');

      // Add a marker for the location
      const marker = new window.google.maps.Marker({
        position: myLatLng,
        map: map,
        title: location,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FFC107',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: '#fff',
        },
      });

      addLog('✅ Marker created');

      // Create and add the initial pollen overlay
      addLog(`🌸 Creating pollen overlay for: ${currentPollenType}`);
      const PollenMapTypeClass = createPollenMapType(currentPollenType);
      const pollenMapType = new PollenMapTypeClass(new window.google.maps.Size(256, 256));
      
      addLog('🗺️ Adding overlay to map...');
      map.overlayMapTypes.insertAt(0, pollenMapType);
      
      googleMapRef.current = map;
      pollenMapTypeRef.current = pollenMapType;
      setMapReady(true);

      addLog('✅ Pollen heatmap initialized successfully');
    } catch (error) {
      addLog(`❌ Failed to initialize pollen map: ${error}`);
    }
  };

  const switchPollenType = (newType: 'TREE_UPI' | 'GRASS_UPI' | 'WEED_UPI') => {
    addLog(`🔄 Switching pollen type to: ${newType}`);
    
    if (!googleMapRef.current || !mapReady) {
      addLog(`❌ Cannot switch pollen type - map not ready`);
      return;
    }

    try {
      // Remove current overlay
      if (pollenMapTypeRef.current) {
        addLog('🗑️ Removing current overlay');
        googleMapRef.current.overlayMapTypes.removeAt(0);
      }

      // Add new overlay
      addLog(`🌸 Creating new overlay for: ${newType}`);
      const PollenMapTypeClass = createPollenMapType(newType);
      const newPollenMapType = new PollenMapTypeClass(new window.google.maps.Size(256, 256));
      
      addLog('🗺️ Adding new overlay to map');
      googleMapRef.current.overlayMapTypes.insertAt(0, newPollenMapType);
      pollenMapTypeRef.current = newPollenMapType;
      setCurrentPollenType(newType);

      addLog(`✅ Successfully switched to ${newType} heatmap`);
    } catch (error) {
      addLog(`❌ Failed to switch pollen type: ${error}`);
    }
  };

  const testAPIDirectly = async () => {
    addLog('🧪 Testing Pollen API directly...');
      try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.longitude=${longitude}&location.latitude=${latitude}&days=1`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Pollen API responded: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        addLog(`❌ Pollen API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addLog(`❌ Pollen API test failed: ${error}`);
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

  useEffect(() => {
    addLog('🔧 PollenMapViewDebug useEffect triggered');
    addLog(`📍 Coordinates: ${latitude}, ${longitude}`);
    addLog(`🌐 Platform.OS: ${Platform.OS}`);
    addLog(`🪟 window exists: ${typeof window !== 'undefined'}`);
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      addLog('✅ Web platform detected, initializing Google Maps...');
        // Load Google Maps script if not already loaded
      if (!window.google) {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        addLog(`🔑 API Key (first 10 chars): ${apiKey?.substring(0, 10)}...`);
        addLog('🌍 Loading Google Maps script...');
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initPollenMapDebug&v=weekly&language=en`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          addLog('✅ Google Maps script loaded successfully');
        };
        
        script.onerror = (error) => {
          addLog(`❌ Failed to load Google Maps script: ${error}`);
        };
        
        window.initPollenMapDebug = initializeMap;
        document.head.appendChild(script);
      } else {
        addLog('🔄 Google Maps already loaded, initializing map...');
        initializeMap();
      }
    } else {
      addLog('📱 Non-web platform or window unavailable');
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.initPollenMapDebug) {
        window.initPollenMapDebug = undefined as any;
      }
    };
  }, [latitude, longitude]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🗺️ Debug Pollen Map</Text>
        
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
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '300px',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          />

          {/* Status Indicator */}
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>
              {mapReady ? '✅ Heatmap Active' : '🔄 Loading...'}
            </Text>
          </View>
        </View>

        {/* Debug Controls */}
        <View style={styles.debugControls}>
          <TouchableOpacity style={styles.debugButton} onPress={testAPIDirectly}>
            <Text style={styles.debugButtonText}>Test API</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.debugButton} onPress={() => setDebugLogs([])}>
            <Text style={styles.debugButtonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Logs */}
        <View style={styles.debugLogsContainer}>
          <Text style={styles.debugTitle}>Debug Logs:</Text>
          <ScrollView style={styles.debugLogs}>
            {debugLogs.map((log, index) => (
              <Text key={index} style={styles.debugLogText}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Mobile/Native fallback
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Debug Pollen Map (Mobile)</Text>
      <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
      <Text style={styles.infoText}>Location: {location}</Text>
      <Text style={styles.infoText}>Coordinates: {latitude}, {longitude}</Text>
      <Text style={styles.infoText}>Pollen Count: {pollenCount}</Text>
      
      <View style={styles.debugLogsContainer}>
        <Text style={styles.debugTitle}>Debug Logs:</Text>
        <ScrollView style={styles.debugLogs}>
          {debugLogs.map((log, index) => (
            <Text key={index} style={styles.debugLogText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  mapContainer: {
    height: 350,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f8ff',
    marginBottom: 10,
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
  debugControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 4,
    flex: 1,
  },
  debugButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
  debugLogsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugLogs: {
    maxHeight: 150,
  },
  debugLogText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 5,
  },
});
