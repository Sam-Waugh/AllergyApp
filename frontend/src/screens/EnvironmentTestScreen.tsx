import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function EnvironmentTestScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const environment = process.env.EXPO_PUBLIC_ENV;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Environment Variables Test</Text>
        <Text style={styles.subtitle}>Verify API configuration for Expo</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 API Configuration</Text>
        
        <View style={styles.item}>
          <Text style={styles.label}>EXPO_PUBLIC_API_URL:</Text>
          <Text style={[styles.value, apiUrl ? styles.success : styles.error]}>
            {apiUrl || 'NOT SET'}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>EXPO_PUBLIC_API_BASE_URL:</Text>
          <Text style={[styles.value, apiBaseUrl ? styles.success : styles.error]}>
            {apiBaseUrl || 'NOT SET'}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:</Text>
          <Text style={[styles.value, mapsApiKey ? styles.success : styles.error]}>
            {mapsApiKey ? `${mapsApiKey.substring(0, 20)}...` : 'NOT SET'}
          </Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>EXPO_PUBLIC_ENV:</Text>
          <Text style={[styles.value, environment ? styles.success : styles.error]}>
            {environment || 'NOT SET'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Expected vs Actual</Text>
        
        <View style={styles.comparison}>
          <Text style={styles.comparisonTitle}>Expected API URL:</Text>
          <Text style={styles.expected}>http://172.16.0.31:8090/api/v1</Text>
          
          <Text style={styles.comparisonTitle}>Actual API URL:</Text>
          <Text style={[styles.actual, apiUrl === 'http://172.16.0.31:8090/api/v1' ? styles.success : styles.error]}>
            {apiUrl || 'NOT SET'}
          </Text>
        </View>

        <View style={styles.comparison}>
          <Text style={styles.comparisonTitle}>Expected Base URL:</Text>
          <Text style={styles.expected}>http://172.16.0.31:8090</Text>
          
          <Text style={styles.comparisonTitle}>Actual Base URL:</Text>
          <Text style={[styles.actual, apiBaseUrl === 'http://172.16.0.31:8090' ? styles.success : styles.error]}>
            {apiBaseUrl || 'NOT SET'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Status Check</Text>
        {apiUrl && apiUrl.includes('172.16.0.31') ? (
          <View style={styles.statusSuccess}>
            <Text style={styles.statusText}>✅ API URL is configured correctly for Expo</Text>
            <Text style={styles.statusDetail}>Using network IP instead of localhost</Text>
          </View>
        ) : (
          <View style={styles.statusError}>
            <Text style={styles.statusText}>❌ API URL needs to be configured for Expo</Text>
            <Text style={styles.statusDetail}>Should use 172.16.0.31 instead of localhost</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  item: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  success: {
    color: '#28a745',
    backgroundColor: '#d4edda',
  },
  error: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  comparison: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  expected: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#28a745',
    marginBottom: 8,
  },
  actual: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusSuccess: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  statusError: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDetail: {
    fontSize: 14,
    opacity: 0.8,
  },
});
