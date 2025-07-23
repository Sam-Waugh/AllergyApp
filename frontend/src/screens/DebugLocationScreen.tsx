import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// Simple debug component to test location display
export default function DebugLocationScreen() {
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing API call...');
      
      const response = await fetch('http://localhost:8090/api/v1/environment/public/current?lat=37.7749&lon=-122.4194');
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Full API Response:', data);
      console.log('📍 Location field specifically:', data.location);
      
      setLocationData(data);
        } catch (err: any) {
      console.error('❌ API Error:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testWithCoordinates = async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Testing ${name} at (${lat}, ${lon})...`);
      
      const response = await fetch(`http://localhost:8090/api/v1/environment/public/current?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 ${name} Response:`, data);
      console.log(`📍 ${name} Location:`, data.location);
      
      setLocationData(data);
        } catch (err: any) {
      console.error(`❌ ${name} Error:`, err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐛 Location Debug Screen</Text>
      
      {/* Test Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testAPI}>
          <Text style={styles.buttonText}>Test San Francisco</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => testWithCoordinates(40.7128, -74.0060, 'New York')}
        >
          <Text style={styles.buttonText}>Test New York</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => testWithCoordinates(34.0522, -118.2437, 'Los Angeles')}
        >
          <Text style={styles.buttonText}>Test Los Angeles</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <Text style={styles.loading}>Loading...</Text>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Location Data Display */}
      {locationData && (
        <View style={styles.dataContainer}>
          <Text style={styles.sectionTitle}>📊 API Response Data</Text>
          
          {/* Location Display - Main Test */}
          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>Location Field:</Text>
            <Text style={styles.locationValue}>
              {locationData.location || 'NO LOCATION FOUND'}
            </Text>
          </View>

          {/* Coordinates */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Coordinates:</Text>
            <Text style={styles.infoValue}>
              {locationData.latitude}, {locationData.longitude}
            </Text>
          </View>

          {/* Pollen Level */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pollen Count:</Text>
            <Text style={styles.infoValue}>
              {locationData.pollen_count || 'No pollen data'}
            </Text>
          </View>

          {/* Raw Data */}
          <View style={styles.rawDataContainer}>
            <Text style={styles.sectionTitle}>🔍 Raw JSON</Text>
            <Text style={styles.rawData}>
              {JSON.stringify(locationData, null, 2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginVertical: 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
  },
  dataContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  locationCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  locationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  rawDataContainer: {
    marginTop: 20,
    backgroundColor: '#f1f3f4',
    padding: 15,
    borderRadius: 8,
  },
  rawData: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    maxHeight: 200,
  },
});
