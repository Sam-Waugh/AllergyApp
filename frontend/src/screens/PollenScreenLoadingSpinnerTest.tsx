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
// Test with LoadingSpinner only
import { LoadingSpinner } from '../components/LoadingSpinner';

// Test version with LoadingSpinner import only
export default function PollenScreen() {
  const dispatch = useAppDispatch();
  const { currentWeather, error } = useAppSelector((state) => state.environment);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPollenData();
  }, []);

  const loadPollenData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      await dispatch(fetchCurrentLocationWeatherPublic()).unwrap();
    } catch (err) {
      console.error('Failed to load pollen data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    loadPollenData();
  };

  if (loading && !currentWeather) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading pollen data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌸 Pollen Forecast</Text>
          <Text style={styles.headerSubtitle}>
            Test version - LoadingSpinner component imported
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
          <Text style={styles.testTitle}>🧪 LoadingSpinner Test</Text>
          <Text style={styles.testText}>✅ LoadingSpinner imported</Text>
          <Text style={styles.testText}>✅ LoadingSpinner component rendered</Text>
          <Text style={styles.testText}>✅ No map component imports</Text>
          
          <Text style={styles.testNote}>
            If this works, the issue is with PollenMapView, not LoadingSpinner.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  testText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 6,
  },
  testNote: {
    fontSize: 12,
    color: '#555',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
