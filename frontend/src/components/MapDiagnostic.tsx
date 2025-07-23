import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';

interface MapDiagnosticProps {
  latitude: number;
  longitude: number;
  location: string;
}

export const MapDiagnostic: React.FC<MapDiagnosticProps> = ({
  latitude,
  longitude,
  location,
}) => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<string[]>([]);

  useEffect(() => {
    const info: string[] = [];
    
    // Platform detection
    info.push(`Platform: ${Platform.OS}`);
    info.push(`Platform Version: ${Platform.Version}`);
    
    // Coordinate validation
    info.push(`Coordinates: ${latitude}, ${longitude}`);
    info.push(`Coordinates Valid: ${!isNaN(latitude) && !isNaN(longitude)}`);
    
    // react-native-maps detection
    try {
      const maps = require('react-native-maps');
      info.push(`react-native-maps: ✅ Available`);
      info.push(`MapView: ${maps.default ? '✅' : '❌'}`);
      info.push(`Marker: ${maps.Marker ? '✅' : '❌'}`);
      info.push(`PROVIDER_GOOGLE: ${maps.PROVIDER_GOOGLE ? '✅' : '❌'}`);
    } catch (error) {
      info.push(`react-native-maps: ❌ Error - ${error.message}`);
    }
    
    // Environment
    info.push(`Location: ${location}`);
    
    setDiagnosticInfo(info);
  }, [latitude, longitude, location]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Map Diagnostic</Text>
      {diagnosticInfo.map((info, index) => (
        <Text key={index} style={styles.infoText}>
          {info}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
