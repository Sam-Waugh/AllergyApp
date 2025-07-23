import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Input, Button, Card } from '../components';
import OfflineControls from '../components/OfflineControls';
import { AuthService, ProfileService, LogService } from '../services';
import { LoginRequest, RegisterRequest } from '../services/AuthService';

export default function TestScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loginData, setLoginData] = useState<LoginRequest>({
    email: 'test@example.com',
    password: 'password123'
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = await AuthService.getAuthToken();
    setAuthToken(token);
    addTestResult(`Auth Status: ${token ? 'Logged in' : 'Not logged in'}`);
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testBackendConnection = async () => {
    setIsLoading(true);
    addTestResult('Testing backend connection...');
    
    try {
      // Test basic API connection by attempting to get user profile
      const response = await ProfileService.getUserProfile();
      if (response.success) {
        addTestResult('✅ Backend connected successfully');
        addTestResult(`User: ${JSON.stringify(response.data)}`);
      } else {
        addTestResult(`❌ Backend error: ${response.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Connection failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testRegister = async () => {
    setIsLoading(true);
    addTestResult('Testing user registration...');
    
    const registerData: RegisterRequest = {
      email: loginData.email,
      password: loginData.password,
      name: 'Test User'
    };

    try {
      const response = await AuthService.register(registerData);
      if (response.success) {
        addTestResult('✅ Registration successful');
        addTestResult(`User: ${JSON.stringify(response.data)}`);
      } else {
        addTestResult(`❌ Registration failed: ${response.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Registration error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testLogin = async () => {
    setIsLoading(true);
    addTestResult('Testing user login...');
    
    try {
      const response = await AuthService.login(loginData);
      if (response.success && response.data) {
        addTestResult('✅ Login successful');
        addTestResult(`Token: ${response.data.access_token.substring(0, 20)}...`);
        addTestResult(`User: ${response.data.user.name} (${response.data.user.email})`);
        setAuthToken(response.data.access_token);
      } else {
        addTestResult(`❌ Login failed: ${response.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Login error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testGetChildren = async () => {
    if (!authToken) {
      addTestResult('❌ Please login first');
      return;
    }

    setIsLoading(true);
    addTestResult('Testing get children...');
    
    try {
      const response = await ProfileService.getChildren();
      if (response.success) {
        addTestResult('✅ Get children successful');
        addTestResult(`Children count: ${response.data?.length || 0}`);
        if (response.data && response.data.length > 0) {
          addTestResult(`First child: ${response.data[0].name}`);
        }
      } else {
        addTestResult(`❌ Get children failed: ${response.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Get children error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testCreateChild = async () => {
    if (!authToken) {
      addTestResult('❌ Please login first');
      return;
    }

    setIsLoading(true);
    addTestResult('Testing create child profile...');
      const childData = {
      name: 'Test Child',
      dateOfBirth: '2020-01-01',
      allergies: ['peanuts', 'milk'],
      medications: ['inhaler'],
      conditions: ['eczema', 'asthma'],
      notes: 'Test child for API integration'
    };

    try {
      const response = await ProfileService.createChildProfile(childData);
      if (response.success) {
        addTestResult('✅ Create child successful');
        addTestResult(`Child: ${response.data?.name} (ID: ${response.data?.id})`);
      } else {
        addTestResult(`❌ Create child failed: ${response.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Create child error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testLogout = async () => {
    setIsLoading(true);
    addTestResult('Testing logout...');
    
    try {
      await AuthService.logout();
      setAuthToken(null);
      addTestResult('✅ Logout successful');
    } catch (error) {
      addTestResult(`❌ Logout error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>API Integration Test</Text>
          <Text style={styles.headerSubtitle}>
            Backend Server: http://localhost:8080
          </Text>
        </View>

        <OfflineControls 
          onModeChange={(isOffline) => {
            addTestResult(`Mode changed to: ${isOffline ? 'Offline' : 'Online'}`);
          }}
        />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Test</Text>
          
          <Input
            label="Email"
            value={loginData.email}
            onChangeText={(email) => setLoginData(prev => ({ ...prev, email }))}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            label="Password"
            value={loginData.password}
            onChangeText={(password) => setLoginData(prev => ({ ...prev, password }))}
            placeholder="Enter password"
            secureTextEntry
          />

          <View style={styles.buttonGrid}>
            <Button
              title="Test Connection"
              onPress={testBackendConnection}
              variant="outline"
              style={styles.gridButton}
            />
            <Button
              title="Register"
              onPress={testRegister}
              variant="outline"
              style={styles.gridButton}
            />
            <Button
              title="Login"
              onPress={testLogin}
              variant="primary"
              style={styles.gridButton}
            />
            <Button
              title="Get Children"
              onPress={testGetChildren}
              variant="outline"
              style={styles.gridButton}
              disabled={!authToken}
            />
            <Button
              title="Create Child"
              onPress={testCreateChild}
              variant="outline"
              style={styles.gridButton}
              disabled={!authToken}
            />
            <Button
              title="Logout"
              onPress={testLogout}
              variant="outline"
              style={styles.gridButton}
              disabled={!authToken}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <Button
              title="Clear"
              onPress={clearResults}
              variant="outline"
              size="small"
            />
          </View>
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Running test...</Text>
            </View>
          )}
          
          <View style={styles.resultsContainer}>
            {testResults.length === 0 ? (
              <Text style={styles.noResults}>No test results yet</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.resultText}>
                  {result}
                </Text>
              ))
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  gridButton: {
    flex: 1,
    minWidth: '45%',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
