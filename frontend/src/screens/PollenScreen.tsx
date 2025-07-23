import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchCurrentWeather, fetchCurrentLocationWeather, fetchCurrentLocationWeatherPublic, fetchCurrentWeatherByCoords } from '../store/slices/environmentSlice';
import { Colors } from '../constants/Colors';
// Import components
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PollenMapView } from '../components/PollenMapViewPlatform'; // Using platform-specific component
import { TopBar } from '../components/modern';
import { PollenTypeData, DailyPollenForecast, PollenSummary, PollenHeatmapData } from '../models';

const { width } = Dimensions.get('window');

// Enhanced helper function to get pollen level color
const getPollenColor = (category: string): string => {
  switch (category.toUpperCase()) {
    case 'NONE':
      return Colors.success; // Green
    case 'VERY_LOW':
      return '#8BC34A'; // Light Green
    case 'LOW':
      return '#CDDC39'; // Lime
    case 'MODERATE':
      return Colors.warning; // Amber
    case 'HIGH':
      return Colors.secondary; // Coral
    case 'VERY_HIGH':
      return Colors.error; // Red
    default:
      return '#9E9E9E'; // Gray
  }
};

// Enhanced helper function to get pollen icon
const getPollenIcon = (pollenType: string): string => {
  const type = pollenType.toUpperCase();
  if (type.includes('TREE')) return '🌳';
  if (type.includes('GRASS')) return '🌱';
  if (type.includes('WEED')) return '🌿';
  return '🌼';
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
};

// Helper function to get pollen recommendations
const getPollenRecommendations = (category: string): string[] => {
  switch (category.toUpperCase()) {
    case 'NONE':
    case 'VERY_LOW':
      return ['Perfect day for outdoor activities!', 'Enjoy time outside'];
    case 'LOW':
      return ['Generally safe for outdoor activities', 'Check forecast if sensitive'];
    case 'MODERATE':
      return [
        'Limit outdoor activities if sensitive',
        'Keep windows closed',
        'Take allergy medication as prescribed',
      ];
    case 'HIGH':
      return [
        'Limit outdoor activities',
        'Keep windows closed',
        'Use air conditioning',
        'Take allergy medication preventively',
      ];
    case 'VERY_HIGH':
      return [
        'Avoid outdoor activities',
        'Stay indoors with windows closed',
        'Use air purifiers',
        'Consult healthcare provider',
      ];
    default:
      return ['Check local weather for pollen updates'];
  }
};

export default function PollenScreen() {
  const dispatch = useAppDispatch();
  const { currentWeather, isLoading, error } = useAppSelector((state) => state.environment);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied' | 'unavailable'>('requesting');

  useEffect(() => {
    loadPollenData();
  }, []);  const loadPollenData = async () => {
    try {
      // First try to get user's actual location using public endpoint
      console.log('🔄 Attempting to get user location...');
      setLocationStatus('requesting');
      await dispatch(fetchCurrentLocationWeatherPublic()).unwrap();
      console.log('✅ Successfully loaded user location data');
      setLocationStatus('granted');
      setLastUpdated(new Date());
    } catch (error) {
      console.log('❌ Location fetch failed:', error);
      
      // Check if it's a permission issue
      if (error instanceof Error && error.message.includes('permission')) {
        setLocationStatus('denied');
      } else {
        setLocationStatus('unavailable');
      }
      
      console.log('🔄 Falling back to default location (New York)...');
      try {
        await dispatch(fetchCurrentWeather('New York, NY')).unwrap();
        console.log('✅ Successfully loaded fallback location data');
        setLastUpdated(new Date());
      } catch (fallbackError) {
        console.error('❌ Failed to fetch weather data:', fallbackError);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPollenData();
    setRefreshing(false);
  };
  const testGoogleAPI = () => {
    Alert.alert(
      'Google Pollen API Status',
      'The Google Pollen API may need to be enabled in your Google Cloud Console. Please ensure:\n\n1. Pollen API is enabled\n2. Billing is set up\n3. API key has proper permissions',
      [{ text: 'OK' }]
    );
  };

  const requestLocationAccess = async () => {
    setLocationStatus('requesting');
    await loadPollenData();
  };

  if (isLoading && !currentWeather) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <Ionicons name="analytics-outline" size={48} color={Colors.primary} />
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading pollen data...</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar 
        title="Pollen Tracker" 
        actions={lastUpdated ? [
          {
            icon: 'refresh',
            label: 'Refresh',
            onPress: () => onRefresh(),
          },
        ] : undefined}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[{ paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚠️ Unable to load pollen data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPollenData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {currentWeather && (
        <>
          {/* Current Location & Pollen Level */}
          <View style={styles.locationCard}>
            <View style={styles.locationAndPollenRow}>
              {/* Left Side - Location Info */}
              <View style={styles.locationSection}>
                <Text style={styles.locationTitle}>
                  {currentWeather.location || 'Loading location...'}
                </Text>
                
                {/* Location Status Indicator */}
                {locationStatus === 'requesting' && (
                  <Text style={styles.locationStatus}>
                    🔄 Requesting location permission...
                  </Text>
                )}
                {locationStatus === 'denied' && (
                  <View style={styles.locationWarning}>
                    <Text style={styles.locationWarningText}>
                      ⚠️ Location access denied. Using fallback location.
                    </Text>
                    <Text style={styles.locationHelpText}>
                      Enable location permissions in your browser to get accurate local pollen data.
                    </Text>
                    <TouchableOpacity style={styles.retryLocationButton} onPress={requestLocationAccess}>
                      <Text style={styles.retryLocationButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                )}                {locationStatus === 'unavailable' && (
                  <View style={styles.locationWarning}>
                    <Text style={styles.locationWarningText}>
                      Location unavailable. Using fallback location.
                    </Text>
                    <Text style={styles.locationHelpText}>
                      Location services may not be available on this device/browser.
                    </Text>
                    <TouchableOpacity style={styles.retryLocationButton} onPress={requestLocationAccess}>
                      <Text style={styles.retryLocationButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {locationStatus === 'granted' && (
                  <Text style={styles.locationSuccess}>
                    ✅ Using your current location
                  </Text>
                )}
                  <View style={styles.basicInfo}>
                  <Text style={styles.basicInfoText}>Temperature: {currentWeather.temperature || 'N/A'}°C</Text>
                  <Text style={styles.basicInfoText}>Humidity: {currentWeather.humidity || 'N/A'}%</Text>
                </View>
              </View>

              {/* Right Side - Today's Pollen Level */}
              <View style={styles.pollenSection}>
                <Text style={styles.pollenSectionTitle}>Today's Pollen Level</Text>
                <View style={styles.pollenOverview}>
                  <View
                    style={[
                      styles.pollenLevelBadge,
                      { backgroundColor: getPollenColor(currentWeather.pollenCount || 'moderate') },
                    ]}
                  >
                    <Text style={styles.pollenLevelText}>
                      {(currentWeather.pollenCount || 'moderate').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.pollenDescription}>
                    General pollen level for your area
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          Interactive Pollen Map
          <View style={styles.mapCard}>
            <Text style={styles.sectionTitle}>🗺️ Interactive Pollen Map</Text>
            <PollenMapView 
              latitude={currentWeather.latitude}
              longitude={currentWeather.longitude}
              location={currentWeather.location}
              pollenCount={currentWeather.pollenCount}
              heatmapData={currentWeather.heatmapTiles}
              pollenTypes={currentWeather.dailyPollenInfo?.[0]?.pollenTypes || []}
            />
            <Text style={styles.mapInfo}>
              Real-time pollen information for your exact location
            </Text>
          </View>{/* Enhanced Detailed Pollen Information */}
          {currentWeather.dailyPollenInfo && currentWeather.dailyPollenInfo.length > 0 ? (
            <>
              {/* Pollen Summary Card */}
              {currentWeather.pollenSummary && (
                <View style={styles.summaryCard}>
                  <Text style={styles.sectionTitle}>📊 Pollen Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Today's Dominant</Text>
                      <Text style={styles.summaryValue}>{currentWeather.pollenSummary.todayDominant || 'N/A'}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Today's Index</Text>
                      <Text style={styles.summaryValue}>{currentWeather.pollenSummary.todayIndex || 'N/A'}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Peak Day</Text>
                      <Text style={styles.summaryValue}>{currentWeather.pollenSummary.peakDay || 'N/A'}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Forecast Days</Text>
                      <Text style={styles.summaryValue}>{currentWeather.pollenSummary.forecastDays || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Daily Pollen Forecast */}
              <View style={styles.detailedCard}>
                <Text style={styles.sectionTitle}>📅 Daily Pollen Forecast</Text>
                
                {currentWeather.dailyPollenInfo.map((day, dayIndex) => (
                  <View key={dayIndex} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <View>
                        <Text style={styles.dayTitle}>{day.dayName || 'Unknown Day'}</Text>
                        <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                      </View>
                      <View style={styles.dayMetrics}>
                        <Text style={styles.overallIndex}>Index: {day.overallIndex || 'N/A'}</Text>
                        {day.dominantPollen && (
                          <Text style={styles.dominantPollen}>
                            {getPollenIcon(day.dominantPollen)} {day.dominantPollen}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {day.pollenTypes.map((pollen, pollenIndex) => (
                      <View key={pollenIndex} style={styles.pollenTypeCard}>
                        <View style={styles.pollenTypeHeader}>
                          <View style={styles.pollenTypeTitle}>
                            <Text style={styles.pollenIcon}>{getPollenIcon(pollen.code || '')}</Text>
                            <Text style={styles.pollenTypeName}>{pollen.displayName || 'Unknown'}</Text>
                          </View>
                          <View
                            style={[
                              styles.pollenCategoryBadge,
                              { backgroundColor: getPollenColor(pollen.category || 'moderate') },
                            ]}
                          >
                            <Text style={styles.pollenCategoryText}>{pollen.category || 'MODERATE'}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.pollenMetrics}>
                          <Text style={styles.pollenValue}>
                            Index: {pollen.indexValue || 'N/A'} • Severity: {pollen.severityLevel || 'N/A'}
                          </Text>
                          <Text style={styles.pollenSeason}>
                            {pollen.inSeason === true ? '🌟 In Season' : pollen.inSeason === false ? '❄️ Out of Season' : '❓ Unknown Season'}
                          </Text>
                        </View>

                        {/* Health Impact */}
                        {pollen.healthImpact && (
                          <View style={styles.healthImpactContainer}>
                            <Text style={styles.healthImpactTitle}>Health Impact:</Text>
                            <Text style={styles.healthImpactText}>{pollen.healthImpact || 'No impact information available'}</Text>
                          </View>
                        )}

                        {/* Enhanced Health Recommendations */}
                        {pollen.healthRecommendations && pollen.healthRecommendations.length > 0 && (
                          <View style={styles.recommendationsContainer}>
                            <Text style={styles.recommendationsTitle}>💡 Recommendations:</Text>
                            {pollen.healthRecommendations.map((rec, recIndex) => (
                              <Text key={recIndex} style={styles.recommendation}>
                                • {rec || 'No recommendation available'}
                              </Text>
                            ))}
                          </View>
                        )}

                        {/* Plant Information */}
                        {pollen.plantInfo && (
                          <View style={styles.plantInfoContainer}>
                            <Text style={styles.plantInfoTitle}>🌱 Plant Details:</Text>
                            {pollen.plantInfo.family && (
                              <Text style={styles.plantInfoText}>Family: {pollen.plantInfo.family}</Text>
                            )}
                            {pollen.plantInfo.season && (
                              <Text style={styles.plantInfoText}>Season: {pollen.plantInfo.season}</Text>
                            )}
                            {pollen.plantInfo.crossReaction && (
                              <Text style={styles.plantInfoText}>Cross-reactions: {pollen.plantInfo.crossReaction}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {/* Plant Descriptions */}
              {currentWeather.plantDescriptions && currentWeather.plantDescriptions.length > 0 && (
                <View style={styles.plantDescriptionCard}>
                  <Text style={styles.plantDescriptionTitle}>🌿 Plant Information</Text>
                  {currentWeather.plantDescriptions.map((plant, index) => (
                    <View key={index} style={styles.plantDescription}>
                      <Text style={styles.plantDescriptionText}>
                        {plant ? JSON.stringify(plant) : 'No plant information available'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Heatmap Information */}
              {currentWeather.heatmapTiles && (
                <View style={styles.heatmapCard}>
                  <Text style={styles.sectionTitle}>🗺️ Pollen Heatmap Data</Text>
                  <Text style={styles.heatmapInfo}>
                    Heatmap tiles available for enhanced mapping visualization
                  </Text>
                  <View style={styles.heatmapTiles}>
                    {currentWeather.heatmapTiles.tiles.tree_upi && (
                      <View style={styles.heatmapTile}>
                        <Text style={styles.heatmapTileTitle}>🌳 Tree Pollen</Text>
                        <Text style={styles.heatmapTileInfo}>
                          {currentWeather.heatmapTiles.tiles.tree_upi.displayName || 'Tree Pollen Data'}
                        </Text>
                      </View>
                    )}
                    {currentWeather.heatmapTiles.tiles.grass_upi && (
                      <View style={styles.heatmapTile}>
                        <Text style={styles.heatmapTileTitle}>🌱 Grass Pollen</Text>
                        <Text style={styles.heatmapTileInfo}>
                          {currentWeather.heatmapTiles.tiles.grass_upi.displayName || 'Grass Pollen Data'}
                        </Text>
                      </View>
                    )}
                    {currentWeather.heatmapTiles.tiles.weed_upi && (
                      <View style={styles.heatmapTile}>
                        <Text style={styles.heatmapTileTitle}>🌿 Weed Pollen</Text>
                        <Text style={styles.heatmapTileInfo}>
                          {currentWeather.heatmapTiles.tiles.weed_upi.displayName || 'Weed Pollen Data'}
                        </Text>
                      </View>
                    )}                  </View>
                </View>)}
            </>
          ) : (
            <View style={styles.noDataCard}>
              <Text style={styles.noDataTitle}>📊 Limited Pollen Data</Text>
              <Text style={styles.noDataText}>
                Detailed pollen forecast is not available at the moment. This could be because:
              </Text>
              <Text style={styles.noDataReason}>• Google Pollen API may need to be enabled</Text>
              <Text style={styles.noDataReason}>• API key may need additional permissions</Text>
              <Text style={styles.noDataReason}>• Billing may need to be set up in Google Cloud</Text>
              
              <TouchableOpacity style={styles.apiInfoButton} onPress={testGoogleAPI}>
                <Text style={styles.apiInfoButtonText}>API Setup Information</Text>
              </TouchableOpacity>
              
              <View style={styles.fallbackInfo}>
                <Text style={styles.fallbackTitle}>Current Information Available:</Text>
                <Text style={styles.fallbackText}>
                  General pollen level: {currentWeather.pollenCount || 'moderate'}
                </Text>
                <Text style={styles.fallbackText}>
                  Air quality index: {currentWeather.airQuality || 'N/A'}
                </Text>
                <Text style={styles.fallbackText}>
                  UV index: {currentWeather.uvIndex || 'N/A'}
                </Text>
              </View>
            </View>
          )}
          
          {/* Health Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.sectionTitle}>💡 General Pollen Tips</Text>
            <Text style={styles.tip}>• Check pollen forecasts before outdoor activities</Text>
            <Text style={styles.tip}>• Keep windows closed during high pollen times</Text>
            <Text style={styles.tip}>• Shower and change clothes after being outdoors</Text>
            <Text style={styles.tip}>• Take allergy medications as prescribed</Text>
            <Text style={styles.tip}>• Use air purifiers indoors during peak season</Text>
          </View>
        </>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 8,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  locationCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 8,
  },  basicInfo: {
    flexDirection: 'column',
    marginTop: 8,
  },
  basicInfoText: {
    fontSize: 14,
    color: '#666',
  },
  overviewCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pollenOverview: {
    alignItems: 'center',
  },
  pollenLevelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  pollenLevelText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pollenDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Enhanced Summary Card Styles
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  detailedCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dayCard: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dayMetrics: {
    alignItems: 'flex-end',
  },
  overallIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  dominantPollen: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  pollenTypeCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  pollenTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollenTypeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pollenIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  pollenTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  pollenCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pollenCategoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pollenMetrics: {
    marginBottom: 8,
  },
  pollenValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pollenSeason: {
    fontSize: 12,
    color: '#4CAF50',
  },
  healthImpactContainer: {
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  healthImpactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 4,
  },
  healthImpactText: {
    fontSize: 12,
    color: '#ef6c00',
    lineHeight: 16,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 16,
  },
  plantInfoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  plantInfoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  plantInfoText: {
    fontSize: 12,
    color: '#388e3c',
    lineHeight: 16,
  },
  plantDescriptionCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  plantDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  plantDescription: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  plantDescriptionText: {
    fontSize: 14,
    color: '#388e3c',
    lineHeight: 20,
  },
  // Heatmap Card Styles
  heatmapCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  heatmapInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  heatmapTiles: {
    marginBottom: 16,
  },
  heatmapTile: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  heatmapTileTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  heatmapTileInfo: {
    fontSize: 12,
    color: '#1565C0',
  },
  mapButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  mapButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noDataCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  noDataReason: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  apiInfoButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 16,
  },
  apiInfoButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  fallbackInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tipsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },  mapCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mapInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  locationStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  locationWarning: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  locationWarningText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  locationHelpText: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
  },  locationSuccess: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 5,
    fontWeight: '500',
  },
  retryLocationButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryLocationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // New styles for row layout
  locationAndPollenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationSection: {
    flex: 1,
    marginRight: 16,
  },
  pollenSection: {
    width: 140,
    alignItems: 'center',
  },
  pollenSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
});
