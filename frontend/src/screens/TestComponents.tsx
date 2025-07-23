import React from 'react';
import { View, Text } from 'react-native';

// Test individual component imports to identify which one is undefined
const TestComponents = () => {
  // Test LoadingSpinner import
  let LoadingSpinnerTest;
  try {
    const { LoadingSpinner } = require('../components/LoadingSpinner');
    LoadingSpinnerTest = LoadingSpinner;
    console.log('✅ LoadingSpinner imported successfully');
  } catch (error) {
    console.error('❌ LoadingSpinner import failed:', error);
    LoadingSpinnerTest = () => <Text>LoadingSpinner Failed</Text>;
  }

  // Test PollenMapView import
  let PollenMapViewTest;
  try {
    const { PollenMapView } = require('../components/PollenMapView');
    PollenMapViewTest = PollenMapView;
    console.log('✅ PollenMapView imported successfully');
  } catch (error) {
    console.error('❌ PollenMapView import failed:', error);
    PollenMapViewTest = () => <Text>PollenMapView Failed</Text>;
  }

  // Test FullscreenMapModal import
  let FullscreenMapModalTest;
  try {
    const { FullscreenMapModal } = require('../components/FullscreenMapModal');
    FullscreenMapModalTest = FullscreenMapModal;
    console.log('✅ FullscreenMapModal imported successfully');
  } catch (error) {
    console.error('❌ FullscreenMapModal import failed:', error);
    FullscreenMapModalTest = () => <Text>FullscreenMapModal Failed</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Component Import Test</Text>
      
      <Text>Testing LoadingSpinner:</Text>
      <LoadingSpinnerTest />
      
      <Text style={{ marginTop: 20 }}>Testing PollenMapView:</Text>
      <PollenMapViewTest 
        latitude={54.5973}
        longitude={-5.9301}
        location="Test Location"
        pollenCount="moderate"
      />
      
      <Text style={{ marginTop: 20 }}>Testing FullscreenMapModal:</Text>
      <FullscreenMapModalTest
        visible={false}
        onClose={() => {}}
        latitude={54.5973}
        longitude={-5.9301}
        location="Test Location"
        pollenCount="moderate"
      />
    </View>
  );
};

export default TestComponents;
