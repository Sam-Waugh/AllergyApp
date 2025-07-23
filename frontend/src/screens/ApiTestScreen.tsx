import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const API_BASE = 'http://127.0.0.1:8090/api/v1';

export default function ApiTestScreen() {
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const createTestUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@allergyapp.com',
          password: 'testpassword123',
          full_name: 'Test User'
        })
      });
      
      if (response.ok) {
        setError('✅ User created successfully');
      } else if (response.status === 400) {
        setError('✅ User already exists');
      } else {
        setError(`❌ User creation failed: ${response.status}`);
      }
    } catch (err) {
      setError(`❌ Network error: ${err}`);
    }
  };

  const getToken = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: 'test@allergyapp.com',
          password: 'testpassword123'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        setError('✅ Token obtained');
      } else {
        setError(`❌ Token failed: ${response.status}`);
      }
    } catch (err) {
      setError(`❌ Token error: ${err}`);
    }
  };

  const testPollenAPI = async () => {
    if (!token) {
      setError('❌ No token available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/environment/current?lat=40.7128&lon=-74.0060&include_heatmap=true`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setApiData(data);
        setError('✅ Pollen API working');
      } else {
        setError(`❌ API failed: ${response.status}`);
      }
    } catch (err) {
      setError(`❌ API error: ${err}`);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 API Test Screen</Text>
      
      <TouchableOpacity style={styles.button} onPress={createTestUser}>
        <Text style={styles.buttonText}>1. Create Test User</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={getToken}>
        <Text style={styles.buttonText}>2. Get Auth Token</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, !token && styles.buttonDisabled]} 
        onPress={testPollenAPI}
        disabled={!token}
      >
        <Text style={styles.buttonText}>3. Test Pollen API</Text>
      </TouchableOpacity>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {token && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Token:</Text>
          <Text style={styles.tokenText}>{token.substring(0, 50)}...</Text>
        </View>
      )}
      
      {loading && <Text style={styles.loadingText}>Loading...</Text>}
      
      {apiData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>🌿 Pollen API Response:</Text>
          <Text style={styles.dataText}>Location: {apiData.location}</Text>
          <Text style={styles.dataText}>Temperature: {apiData.temperature}°C</Text>
          <Text style={styles.dataText}>Pollen Count: {apiData.pollen_count}</Text>
          
          {apiData.daily_pollen_info && (
            <>
              <Text style={styles.dataTitle}>📊 Enhanced Pollen Data:</Text>
              <Text style={styles.dataText}>
                Days: {String(apiData.daily_pollen_info.length)}
              </Text>
              {apiData.daily_pollen_info[0]?.pollen_types && (
                <>
                  <Text style={styles.dataText}>
                    Types: {String(apiData.daily_pollen_info[0].pollen_types.length)}
                  </Text>
                  {apiData.daily_pollen_info[0].pollen_types.map((pollen: any, index: number) => (
                    <Text key={index} style={styles.pollenText}>
                      • {pollen.display_name}: {pollen.category} (Index: {pollen.index_value})
                    </Text>
                  ))}
                </>
              )}
            </>
          )}
          
          {apiData.plant_description && (
            <Text style={styles.dataText}>
              Plants: {apiData.plant_description.substring(0, 100)}...
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
  },
  tokenContainer: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  tokenLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  dataContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  dataText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  pollenText: {
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 2,
    color: '#666',
  },
});
