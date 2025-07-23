import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ProfileService from '../services/ProfileService';

interface OfflineControlsProps {
  onModeChange?: (isOffline: boolean) => void;
}

const OfflineControls: React.FC<OfflineControlsProps> = ({ onModeChange }) => {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleOfflineMode = async () => {
    setIsLoading(true);
    try {
      if (isOfflineMode) {
        // Enable online mode
        const result = await ProfileService.enableOnlineMode();
        if (result.success) {
          setIsOfflineMode(false);
          Alert.alert('Online Mode', 'App is now online. Data will sync with Firebase.');
          onModeChange?.(false);
        } else {
          Alert.alert('Error', result.error || 'Failed to enable online mode');
        }
      } else {
        // Enable offline mode
        const result = await ProfileService.enableOfflineMode();
        if (result.success) {
          setIsOfflineMode(true);
          Alert.alert('Offline Mode', 'App is now offline. Changes will sync when back online.');
          onModeChange?.(true);
        } else {
          Alert.alert('Error', result.error || 'Failed to enable offline mode');
        }
      }
    } catch (error) {
      console.error('Error toggling offline mode:', error);
      Alert.alert('Error', 'Failed to change mode');
    } finally {
      setIsLoading(false);
    }
  };

  const testOfflineData = async () => {
    try {
      const result = await ProfileService.getChildren();
      if (result.success) {
        Alert.alert(
          'Data Retrieved',
          `Found ${result.data?.length || 0} children. ${result.message || ''}`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to retrieve data');
      }
    } catch (error) {
      console.error('Error testing offline data:', error);
      Alert.alert('Error', 'Failed to test data retrieval');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: isOfflineMode ? '#ff6b6b' : '#51cf66' }]} />
        <Text style={styles.statusText}>
          {isOfflineMode ? 'Offline Mode' : 'Online Mode'}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.toggleButton]}
          onPress={toggleOfflineMode}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Switching...' : `Go ${isOfflineMode ? 'Online' : 'Offline'}`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testOfflineData}
        >
          <Text style={styles.buttonText}>Test Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  toggleButton: {
    backgroundColor: '#007bff',
  },
  testButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default OfflineControls;
