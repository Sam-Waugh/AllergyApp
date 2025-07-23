import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';

interface FullscreenMapModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  location: string;
  pollenCount: string;
  heatmapData?: any;
  pollenTypes?: any[];
}

const { width, height } = Dimensions.get('window');

export const FullscreenMapModal: React.FC<FullscreenMapModalProps> = ({
  visible,
  onClose,
  latitude,
  longitude,
  location,
  pollenCount,
  heatmapData,
  pollenTypes = [],
}) => {  const [selectedLayer, setSelectedLayer] = useState<'tree' | 'grass' | 'weed' | 'all'>('all');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [zoomLevel, setZoomLevel] = useState(12);
  const [mapLoadError, setMapLoadError] = useState(false);

  const getPollenColor = (category: string) => {
    switch (category.toUpperCase()) {
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
  };  const generateEnhancedMapUrl = () => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Google Maps API key not found in FullscreenMapModal');
      return '';
    }
      try {
      const zoom = zoomLevel;
      const mapWidth = Math.min(width - 20, 640); // Google Static Maps max width
      const mapHeight = Math.min(height * 0.6, 640); // Reasonable height
      
      // Format coordinates properly
      const centerLat = Number(latitude).toFixed(6);
      const centerLng = Number(longitude).toFixed(6);
      const center = `${centerLat},${centerLng}`;
      
      // Build base URL
      const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
      const params = [
        `center=${center}`,
        `zoom=${zoom}`,
        `size=${mapWidth}x${mapHeight}`,
        `maptype=${mapType}`,
        `key=${apiKey}`
      ];
      
      // Add main location marker
      params.push(`markers=color:red%7Csize:mid%7Clabel:📍%7C${center}`);
      
      // Add nearby pollen monitoring points (simulated)
      const nearbyPoints = [
        { lat: latitude + 0.01, lng: longitude + 0.01, color: 'green', label: 'L' },
        { lat: latitude - 0.01, lng: longitude - 0.01, color: 'orange', label: 'M' },
        { lat: latitude + 0.01, lng: longitude - 0.01, color: 'red', label: 'H' },
      ];
      
      nearbyPoints.forEach(point => {
        params.push(`markers=color:${point.color}%7Csize:small%7Clabel:${point.label}%7C${point.lat},${point.lng}`);
      });
      
      const url = `${baseUrl}?${params.join('&')}`;
      console.log('🗺️ Enhanced map URL generated:', url.substring(0, 120) + '...');
      return url;
      
    } catch (error) {
      console.error('❌ Error generating enhanced map URL:', error);
      return '';
    }
  };

  const layerButtons = [
    { id: 'all', label: '🌍 All Layers', color: '#2196F3' },
    { id: 'tree', label: '🌳 Trees', color: '#4CAF50' },
    { id: 'grass', label: '🌱 Grass', color: '#8BC34A' },
    { id: 'weed', label: '🌿 Weeds', color: '#FF9800' },
  ];

  const openInGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/@${latitude},${longitude},12z`;
    if (Platform.OS === 'web') {
      window.open(mapsUrl, '_blank');
    } else {
      Alert.alert(
        'Open in Maps',
        'This would open Google Maps app with pollen data visualization.',
        [{ text: 'OK' }]
      );
    }
  };
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onShow={() => setMapLoadError(false)} // Reset error state when modal opens
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.modalTitle}>🗺️ Pollen Map</Text>
            <Text style={styles.modalSubtitle}>{location}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>          {/* Enhanced Map View */}
          <View style={styles.enhancedMapContainer}>
            <View style={{ position: 'relative' }}>
              {!mapLoadError ? (
                <>
                  <Image
                    source={{ uri: generateEnhancedMapUrl() }}
                    style={styles.enhancedMapImage}
                    onError={() => {
                      console.error('❌ Failed to load enhanced map image');
                      setMapLoadError(true);
                    }}
                    onLoad={() => {
                      console.log('✅ Map image loaded successfully');
                    }}
                  />
                  <TouchableOpacity style={styles.mapClickOverlay} onPress={openInGoogleMaps}>
                    <Text style={styles.mapClickText}>🔗 Open in Google Maps</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.mapErrorFallback}>
                  <Text style={styles.mapErrorIcon}>🗺️</Text>
                  <Text style={styles.mapErrorTitle}>Enhanced Pollen Map</Text>
                  <Text style={styles.mapErrorSubtitle}>📍 {location}</Text>
                  <Text style={styles.mapErrorCoords}>
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </Text>
                  <TouchableOpacity style={styles.mapErrorButton} onPress={openInGoogleMaps}>
                    <Text style={styles.mapErrorButtonText}>🔗 Open in Google Maps</Text>
                  </TouchableOpacity>
                  <Text style={styles.mapErrorInfo}>
                    ℹ️ Interactive pollen data visualization available in Google Maps
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <View style={styles.controlSection}>
              <Text style={styles.controlTitle}>🗺️ Map Type</Text>
              <View style={styles.mapTypeButtons}>
                {[
                  { type: 'roadmap', label: '🛣️ Road', color: '#2196F3' },
                  { type: 'satellite', label: '🛰️ Satellite', color: '#4CAF50' },
                  { type: 'hybrid', label: '🌐 Hybrid', color: '#FF9800' },
                ].map((mapTypeOption) => (
                  <TouchableOpacity
                    key={mapTypeOption.type}
                    style={[
                      styles.mapTypeButton,
                      { backgroundColor: mapTypeOption.color },
                      mapType === mapTypeOption.type && styles.mapTypeButtonActive,
                    ]}
                    onPress={() => setMapType(mapTypeOption.type as any)}
                  >
                    <Text style={styles.mapTypeButtonText}>{mapTypeOption.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.controlSection}>
              <Text style={styles.controlTitle}>🔍 Zoom Level: {zoomLevel}</Text>
              <View style={styles.zoomControls}>
                <TouchableOpacity
                  style={[styles.zoomButton, zoomLevel <= 1 && styles.zoomButtonDisabled]}
                  onPress={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
                  disabled={zoomLevel <= 1}
                >
                  <Text style={styles.zoomButtonText}>➖</Text>
                </TouchableOpacity>
                <Text style={styles.zoomLevel}>{zoomLevel}</Text>
                <TouchableOpacity
                  style={[styles.zoomButton, zoomLevel >= 20 && styles.zoomButtonDisabled]}
                  onPress={() => setZoomLevel(Math.min(20, zoomLevel + 1))}
                  disabled={zoomLevel >= 20}
                >
                  <Text style={styles.zoomButtonText}>➕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Layer Controls */}
          <View style={styles.layerControls}>
            <Text style={styles.layerControlsTitle}>🎛️ Pollen Layers</Text>
            <View style={styles.layerButtons}>
              {layerButtons.map((layer) => (
                <TouchableOpacity
                  key={layer.id}
                  style={[
                    styles.layerButton,
                    { backgroundColor: layer.color },
                    selectedLayer === layer.id && styles.layerButtonActive,
                  ]}
                  onPress={() => setSelectedLayer(layer.id as any)}
                >
                  <Text style={styles.layerButtonText}>{layer.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Current Conditions */}
          <View style={styles.conditionsCard}>
            <Text style={styles.conditionsTitle}>📊 Current Conditions</Text>
            <View style={[styles.pollenLevelBadge, { backgroundColor: getPollenColor(pollenCount) }]}>
              <Text style={styles.pollenLevelText}>Overall: {pollenCount.toUpperCase()}</Text>
            </View>
            
            {pollenTypes.length > 0 && (
              <View style={styles.pollenTypesList}>
                {pollenTypes.slice(0, 5).map((pollen, index) => (
                  <View key={index} style={styles.pollenTypeItem}>
                    <Text style={styles.pollenTypeName}>{pollen.displayName}</Text>
                    <View style={[styles.pollenTypeBadge, { backgroundColor: getPollenColor(pollen.category) }]}>
                      <Text style={styles.pollenTypeBadgeText}>{pollen.category}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Legend */}
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>🎨 Map Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>📍 Your Location</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>L - Low Pollen</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>M - Moderate Pollen</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>H - High Pollen</Text>
              </View>
            </View>
          </View>

          {/* Heatmap Information */}
          {heatmapData && (
            <View style={styles.heatmapInfoCard}>
              <Text style={styles.heatmapInfoTitle}>🌈 Heatmap Data Available</Text>
              <Text style={styles.heatmapInfoText}>
                Enhanced pollen visualization layers are available for this location. 
                These provide detailed pollen concentration maps for different plant types.
              </Text>
              
              <View style={styles.availableLayers}>
                {heatmapData.tiles?.tree_upi && (
                  <View style={styles.availableLayer}>
                    <Text style={styles.availableLayerText}>🌳 Tree Pollen Heatmap</Text>
                  </View>
                )}
                {heatmapData.tiles?.grass_upi && (
                  <View style={styles.availableLayer}>
                    <Text style={styles.availableLayerText}>🌱 Grass Pollen Heatmap</Text>
                  </View>
                )}
                {heatmapData.tiles?.weed_upi && (
                  <View style={styles.availableLayer}>
                    <Text style={styles.availableLayerText}>🌿 Weed Pollen Heatmap</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#4CAF50',
  },
  headerContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  enhancedMapContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },  enhancedMapImage: {
    width: '100%',
    height: height * 0.4,
    resizeMode: 'cover',
  },mapClickOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  } as any,
  mapClickText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  nativeFullscreenPlaceholder: {
    height: height * 0.4,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  fullscreenMapSubtext: {
    fontSize: 18,
    color: '#1565C0',
    marginBottom: 4,
  },
  fullscreenMapCoords: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 20,
  },
  openMapsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  openMapsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  layerControls: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  layerControlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  layerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: '48%',
    alignItems: 'center',
  },
  layerButtonActive: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  layerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  conditionsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  conditionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pollenLevelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pollenLevelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pollenTypesList: {
    gap: 8,
  },
  pollenTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pollenTypeName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pollenTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  pollenTypeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  legendCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  heatmapInfoCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  heatmapInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  heatmapInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  availableLayers: {
    gap: 6,
  },
  availableLayer: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
  },  availableLayerText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  mapControls: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  controlSection: {
    marginBottom: 16,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mapTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mapTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
  },
  mapTypeButtonActive: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mapTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  zoomButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },  zoomLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  mapErrorFallback: {
    height: height * 0.4,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  mapErrorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapErrorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  mapErrorSubtitle: {
    fontSize: 18,
    color: '#1565C0',
    marginBottom: 12,
  },
  mapErrorCoords: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 20,
  },
  mapErrorButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  mapErrorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapErrorInfo: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
