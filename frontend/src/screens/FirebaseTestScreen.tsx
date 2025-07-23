import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: string;
}

export default function FirebaseTestScreen() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { isAuthenticated } = useAuth();

  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    const result: TestResult = {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    // Test 1: Check Firebase mode
    addTestResult(
      'Firebase Mode Check',
      'success',
      `Running in ${process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true' ? 'TEST MODE (Mock Data)' : 'PRODUCTION MODE (Real Firebase)'}`
    );

    // Test 2: Authentication status
    addTestResult(
      'Authentication',
      isAuthenticated ? 'success' : 'error',
      `User authentication: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`
    );

    if (!isAuthenticated) {
      addTestResult('Test Stopped', 'error', 'Cannot continue without authentication');
      setIsRunning(false);
      return;
    }

    // Test 3: Create a test child
    try {
      const testChild = {
        first_name: 'Test',
        last_name: 'Child',
        date_of_birth: '2015-01-01',
        gender: 'prefer_not_to_say' as const,
        weight_kg: 30,
        height_cm: 120,
        allergies: [
          { allergen: 'Peanuts', severity: 'moderate' as const, diagnosis_date: '2020-01-01' }
        ],
        medications: [
          { name: 'EpiPen', dosage: '0.15mg', frequency: 'As needed', prescribing_doctor: 'Dr. Test' }
        ],
        emergency_contacts: [
          { name: 'Test Parent', relationship: 'Parent', phone_primary: '555-0123', phone_secondary: '', email: 'test@example.com' }
        ],
        medical_notes: 'Test child for Firebase connectivity',
      };

      const childResponse = await firebaseService.createChildProfile(testChild);
      addTestResult(
        'Create Child',
        'success',
        `Successfully created test child with ID: ${childResponse.child_id}`
      );

      // Test 4: Create a test daily log
      try {
        const testLogData = {
          date: new Date().toISOString().split('T')[0],
          symptoms: {
            rash: 2,
            cough: 0,
            runnyNose: 1,
            itching: 3,
            wheezing: 0,
          },
          mood: 4,
          triggers: ['Outdoor pollen', 'Dust'],
          notes: 'Test daily log for Firebase connectivity',
        };

        const logResponse = await firebaseService.createDailyLog(childResponse.child_id, testLogData);
        addTestResult(
          'Create Daily Log',
          'success',
          `Successfully created test log with ID: ${logResponse.id}`
        );

        // Test 5: Retrieve the daily log
        const retrievedLogs = await firebaseService.getChildDailyLogs(childResponse.child_id, 5);
        addTestResult(
          'Retrieve Daily Logs',
          'success',
          `Successfully retrieved ${retrievedLogs.length} daily logs`
        );

        // Test 6: Retrieve all children
        const allChildren = await firebaseService.getUserChildren();
        addTestResult(
          'Retrieve Children',
          'success',
          `Successfully retrieved ${allChildren.length} children`
        );

        // Test 7: Update child (optional)
        try {
          await firebaseService.updateChildProfile(childResponse.child_id, { medical_notes: 'Updated test notes' });
          addTestResult(
            'Update Child',
            'success',
            'Successfully updated child profile'
          );
        } catch (error) {
          addTestResult(
            'Update Child',
            'error',
            `Failed to update child: ${error.message}`
          );
        }

        // Test 8: Clean up - delete test data
        try {
          // In a real scenario, you might want to keep test data
          // await firebaseService.deleteChild(childResponse.child_id);
          addTestResult(
            'Cleanup',
            'success',
            'Test data preserved (delete manually if needed)'
          );
        } catch (error) {
          addTestResult(
            'Cleanup',
            'error',
            `Cleanup failed: ${error.message}`
          );
        }

      } catch (error) {
        addTestResult(
          'Create Daily Log',
          'error',
          `Failed to create daily log: ${error.message}`
        );
      }

    } catch (error) {
      addTestResult(
        'Create Child',
        'error',
        `Failed to create child: ${error.message}`
      );
    }

    setIsRunning(false);
    
    // Show completion alert
    const successCount = testResults.filter(r => r.status === 'success').length;
    const totalTests = testResults.length;
    
    Alert.alert(
      'Firebase Tests Complete',
      `${successCount}/${totalTests} tests passed. ${
        successCount === totalTests 
          ? '🎉 All tests successful! Firebase is working correctly.' 
          : '⚠️ Some tests failed. Check the results below.'
      }`
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firebase Connection Test</Text>
        <Text style={styles.subtitle}>
          Mode: {process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true' ? 'Test (Mock)' : 'Production (Real)'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.runButton]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🔄 Running Tests...' : '🚀 Run Firebase Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results ({String(testResults.length)})</Text>
        
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet. Click "Run Firebase Tests" to start.</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTest}>
                  {getStatusIcon(result.status)} {result.test}
                </Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
              <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                {result.message}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>💡 Tips:</Text>
        <Text style={styles.infoText}>
          • Test mode uses mock data stored locally{'\n'}
          • Production mode uses real Firebase Firestore{'\n'}
          • Make sure you're authenticated before running tests{'\n'}
          • Check console logs for detailed error information
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  resultItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
  info: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
