import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PollenMapViewProps {
  latitude: number;
  longitude: number;
  location: string;
  pollenCount: string;
  heatmapData?: any;
  pollenTypes?: any[];
  onMapPress?: () => void;
}

export const PollenMapView: React.FC<PollenMapViewProps> = ({
  latitude,
  longitude,
  location,
  pollenCount,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Map Component Test</Text>
      <Text style={styles.info}>Location: {location}</Text>
      <Text style={styles.info}>Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
      <Text style={styles.info}>Pollen Level: {pollenCount}</Text>
      <Text style={styles.note}>
        ✅ This is a simplified test version of PollenMapView
      </Text>
      <Text style={styles.note}>
        If this displays, the component structure is working correctly.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 8,
    margin: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
});
