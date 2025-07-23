import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';

// Simple test component to verify pollen data and map props
const MapDataTest = () => {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDataFlow = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Get auth token
      console.log('🔄 Step 1: Getting auth token...');
      const authResponse = await fetch('http://localhost:8090/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'username=test@allergyapp.com&password=testpassword123'
      });

      if (!authResponse.ok) {
        throw new Error('Authentication failed');
      }

      const authData = await authResponse.json();
      console.log('✅ Step 1: Auth successful');

      // Step 2: Get environment data
      console.log('🔄 Step 2: Getting environment data...');
      const envResponse = await fetch('http://localhost:8090/api/v1/environment/current?lat=40.7128&lon=-74.0060', {
        headers: { 'Authorization': `Bearer ${authData.access_token}` }
      });

      if (!envResponse.ok) {
        throw new Error('Environment data fetch failed');
      }

      const envData = await envResponse.json();
      console.log('✅ Step 2: Environment data received');
      console.log('📋 Environment data:', envData);

      setTestData(envData);
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const renderMapProps = () => {
    if (!testData) return null;

    const mapProps = {
      latitude: testData.latitude,
      longitude: testData.longitude,
      location: testData.location,
      pollenCount: testData.pollen_count,
      heatmapData: testData.heatmap_tiles,
      pollenTypes: testData.daily_pollen_info?.[0]?.pollen_types || []
    };

    return (
      <View style={styles.propsContainer}>
        <Text style={styles.propsTitle}>🗺️ Map Component Props:</Text>
        {Object.entries(mapProps).map(([key, value]) => (
          <View key={key} style={styles.propRow}>
            <Text style={styles.propKey}>{key}:</Text>
            <Text style={styles.propValue}>
              {typeof value === 'object' && value !== null 
                ? Array.isArray(value) 
                  ? `Array[${value.length}]`
                  : 'Object'
                : String(value)
              }
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Map Data Flow Test</Text>
      
      <Button 
        title={loading ? "Testing..." : "Test Data Flow"} 
        onPress={testDataFlow}
        disabled={loading}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error: {error}</Text>
        </View>
      )}

      {testData && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>✅ Test Results:</Text>
          
          <View style={styles.basicInfo}>
            <Text style={styles.infoText}>📍 Location: {testData.location}</Text>
            <Text style={styles.infoText}>🌡️ Temperature: {testData.temperature}°C</Text>
            <Text style={styles.infoText}>🌸 Pollen Count: {testData.pollen_count}</Text>
          </View>

          {renderMapProps()}

          <View style={styles.validationContainer}>
            <Text style={styles.validationTitle}>🔍 Validation:</Text>
            <Text style={[styles.validationItem, 
              testData.latitude && testData.longitude ? styles.validPass : styles.validFail
            ]}>
              {testData.latitude && testData.longitude ? '✅' : '❌'} Valid coordinates
            </Text>
            <Text style={[styles.validationItem, 
              testData.location ? styles.validPass : styles.validFail
            ]}>
              {testData.location ? '✅' : '❌'} Location name
            </Text>
            <Text style={[styles.validationItem, 
              testData.pollen_count ? styles.validPass : styles.validFail
            ]}>
              {testData.pollen_count ? '✅' : '❌'} Pollen count
            </Text>
            <Text style={[styles.validationItem, 
              testData.daily_pollen_info && testData.daily_pollen_info.length > 0 ? styles.validPass : styles.validFail
            ]}>
              {testData.daily_pollen_info && testData.daily_pollen_info.length > 0 ? '✅' : '❌'} Enhanced pollen data
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  basicInfo: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  propsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  propsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  propRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  propKey: {
    fontWeight: 'bold',
    width: 120,
  },
  propValue: {
    flex: 1,
    color: '#666',
  },
  validationContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  validationItem: {
    fontSize: 14,
    marginBottom: 5,
  },
  validPass: {
    color: '#2e7d32',
  },
  validFail: {
    color: '#d32f2f',
  },
});

export default MapDataTest;
