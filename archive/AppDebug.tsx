import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import DebugLocationScreen from './src/screens/DebugLocationScreen';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <DebugLocationScreen />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </Provider>
  );
}
