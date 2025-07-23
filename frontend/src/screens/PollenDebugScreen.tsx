import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchCurrentWeather, fetchCurrentLocationWeather } from '../store/slices/environmentSlice';

export default function PollenDebugScreen() {
  const dispatch = useAppDispatch();
  const { currentWeather, isLoading, error } = useAppSelector((state) => state.environment);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentWeather) {
      setDebugInfo({
        hasBasicData: !!currentWeather.location,
        hasDailyPollenInfo: !!(currentWeather.dailyPollenInfo && currentWeather.dailyPollenInfo.length > 0),
        hasPollenSummary: !!currentWeather.pollenSummary,
        hasHeatmapTiles: !!currentWeather.heatmapTiles,
        hasPlantDescriptions: !!(currentWeather.plantDescriptions && currentWeather.plantDescriptions.length > 0),
        rawData: currentWeather,
        dailyPollenCount: currentWeather.dailyPollenInfo ? currentWeather.dailyPollenInfo.length : 0,
        firstDayPollenTypes: currentWeather.dailyPollenInfo && currentWeather.dailyPollenInfo[0] ? 
          currentWeather.dailyPollenInfo[0].pollenTypes?.length || 0 : 0
      });
    }
  }, [currentWeather]);

  const loadData = async () => {
    try {
      await dispatch(fetchCurrentLocationWeather()).unwrap();
    } catch (error) {
      console.log('Location fetch failed, using fallback');
      try {
        await dispatch(fetchCurrentWeather('New York, NY')).unwrap();
      } catch (fallbackError) {
        console.error('Failed to fetch weather data:', fallbackError);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Pollen Debug Screen</Text>
        <Text style={styles.headerSubtitle}>Enhanced UI Troubleshooting</Text>
      </View>

      {isLoading && (
        <View style={styles.card}>
          <Text style={styles.loadingText}>Loading pollen data...</Text>
        </View>
      )}

      {error && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorTitle}>❌ Error Loading Data</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {debugInfo && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Data Analysis</Text>
          
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Basic Weather Data:</Text>
            <Text style={[styles.debugValue, debugInfo.hasBasicData ? styles.success : styles.error]}>
              {debugInfo.hasBasicData ? '✅ Available' : '❌ Missing'}
            </Text>
          </View>

          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Enhanced Daily Pollen Info:</Text>
            <Text style={[styles.debugValue, debugInfo.hasDailyPollenInfo ? styles.success : styles.error]}>
              {debugInfo.hasDailyPollenInfo ? `✅ Available (${debugInfo.dailyPollenCount} days)` : '❌ Missing'}
            </Text>
          </View>

          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Pollen Summary:</Text>
            <Text style={[styles.debugValue, debugInfo.hasPollenSummary ? styles.success : styles.error]}>
              {debugInfo.hasPollenSummary ? '✅ Available' : '❌ Missing'}
            </Text>
          </View>

          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Heatmap Tiles:</Text>
            <Text style={[styles.debugValue, debugInfo.hasHeatmapTiles ? styles.success : styles.error]}>
              {debugInfo.hasHeatmapTiles ? '✅ Available' : '❌ Missing'}
            </Text>
          </View>

          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Plant Descriptions:</Text>
            <Text style={[styles.debugValue, debugInfo.hasPlantDescriptions ? styles.success : styles.error]}>
              {debugInfo.hasPlantDescriptions ? '✅ Available' : '❌ Missing'}
            </Text>
          </View>

          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>First Day Pollen Types:</Text>
            <Text style={styles.debugValue}>
              {debugInfo.firstDayPollenTypes} types
            </Text>
          </View>
        </View>
      )}

      {currentWeather && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌸 Current Pollen Status</Text>
          <Text style={styles.dataText}>Location: {currentWeather.location}</Text>
          <Text style={styles.dataText}>Legacy Pollen Count: {currentWeather.pollenCount}</Text>
          <Text style={styles.dataText}>Temperature: {currentWeather.temperature}°C</Text>
          <Text style={styles.dataText}>Humidity: {currentWeather.humidity}%</Text>
        </View>
      )}      {debugInfo?.hasDailyPollenInfo && currentWeather?.dailyPollenInfo && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📅 Enhanced Daily Pollen Info</Text>
          {currentWeather.dailyPollenInfo.map((day, index) => (
            <View key={index} style={styles.dayDebug}>
              <Text style={styles.dayTitle}>Day {String(index + 1)}: {day.dayName || 'Unknown'} ({day.date || 'Unknown date'})</Text>
              <Text style={styles.dataText}>Overall Index: {day.overallIndex}</Text>
              <Text style={styles.dataText}>Dominant Pollen: {day.dominantPollen}</Text>
              <Text style={styles.dataText}>Pollen Types: {String(day.pollenTypes.length)}</Text>
              
              {day.pollenTypes.slice(0, 3).map((pollen, pollenIndex) => (
                <View key={pollenIndex} style={styles.pollenDebug}>
                  <Text style={styles.pollenText}>
                    {pollen.displayName}: {pollen.category} (Index: {pollen.indexValue})
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}      {debugInfo?.hasPollenSummary && currentWeather?.pollenSummary && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Pollen Summary</Text>
          <Text style={styles.dataText}>Today's Dominant: {currentWeather.pollenSummary.todayDominant}</Text>
          <Text style={styles.dataText}>Today's Index: {currentWeather.pollenSummary.todayIndex}</Text>
          <Text style={styles.dataText}>Peak Day: {currentWeather.pollenSummary.peakDay}</Text>
          <Text style={styles.dataText}>Forecast Days: {currentWeather.pollenSummary.forecastDays}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔧 Troubleshooting Steps</Text>
        <Text style={styles.troubleshootText}>
          1. Check if Enhanced Daily Pollen Info shows "✅ Available" above
        </Text>
        <Text style={styles.troubleshootText}>
          2. If data is available but UI looks basic, try force-refreshing the app
        </Text>
        <Text style={styles.troubleshootText}>
          3. Check the main Pollen tab to see if enhanced features appear
        </Text>
        <Text style={styles.troubleshootText}>
          4. If still issues, the enhanced components may need to reload
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF5722',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
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
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  debugLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  debugValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#F44336',
  },
  dataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dayDebug: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pollenDebug: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  pollenText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  troubleshootText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
