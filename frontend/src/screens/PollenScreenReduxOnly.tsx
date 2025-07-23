import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchCurrentLocationWeatherPublic } from '../store/slices/environmentSlice';

// Test version with only store imports - no custom components
export default function PollenScreen() {
  const dispatch = useAppDispatch();
  const { currentWeather, error } = useAppSelector((state) => state.environment);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPollenData();
  }, []);

  const loadPollenData = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchCurrentLocationWeatherPublic()).unwrap();
    } catch (err) {
      console.error('Failed to load pollen data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadPollenData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌸 Pollen Forecast</Text>
          <Text style={styles.headerSubtitle}>
            Test version - Redux store only, no custom components
          </Text>
        </View>

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
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>
              📍 {currentWeather.location || 'Loading location...'}
            </Text>
            <Text style={styles.basicInfoText}>
              Temperature: {currentWeather.temperature}°C
            </Text>
            <Text style={styles.basicInfoText}>
              Humidity: {currentWeather.humidity}%
            </Text>
            <Text style={styles.basicInfoText}>
              Pollen Level: {currentWeather.pollenCount || 'N/A'}
            </Text>
          </View>
        )}

        <View style={styles.testCard}>
          <Text style={styles.testTitle}>🧪 Redux Store Test</Text>
          <Text style={styles.testText}>✅ Redux store working</Text>
          <Text style={styles.testText}>✅ Environment slice functional</Text>
          <Text style={styles.testText}>✅ No custom component imports</Text>
          <Text style={styles.testText}>✅ Basic React Native components only</Text>
          
          <Text style={styles.testNote}>
            If this works, the issue is with LoadingSpinner or PollenMapView imports.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    marginTop: 4,
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
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  basicInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  testCard: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  testText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 6,
  },
  testNote: {
    fontSize: 12,
    color: '#555',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
