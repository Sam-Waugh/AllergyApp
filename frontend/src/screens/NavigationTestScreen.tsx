import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NavigationTestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Navigation Fixed!</Text>
      <Text style={styles.subtitle}>The TabNavigator is now working properly</Text>
      <Text style={styles.description}>
        You should be able to navigate between all tabs without errors.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
