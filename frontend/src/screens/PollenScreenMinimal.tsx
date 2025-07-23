import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

// Absolutely minimal PollenScreen with no custom component imports
export default function PollenScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🌸 Pollen Screen - Minimal Test</Text>
        <Text style={styles.subtitle}>
          This is a minimal version with no custom components
        </Text>
        <Text style={styles.test}>
          ✅ If you can see this, React is working correctly
        </Text>
        <Text style={styles.test}>
          ✅ The error is likely in a custom component import
        </Text>
        <Text style={styles.test}>
          ✅ Navigation to this screen is functional
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  test: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
  },
});
