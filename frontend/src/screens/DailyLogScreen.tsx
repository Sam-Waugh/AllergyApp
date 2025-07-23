import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, DailyLogForm, DailyLog } from '../models';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

type DailyLogRouteProp = RouteProp<RootStackParamList, 'DailyLog'>;

export default function DailyLogScreen() {
  const route = useRoute<DailyLogRouteProp>();
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [childId, setChildId] = useState(route.params?.childId || '');
  const [availableChildren, setAvailableChildren] = useState<any[]>([]);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showPreviousLogs, setShowPreviousLogs] = useState(false);
  const [previousLogs, setPreviousLogs] = useState<DailyLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const [logData, setLogData] = useState<DailyLogForm>({
    symptoms: {
      rash: 0,
      cough: 0,
      runnyNose: 0,
      itching: 0,
      wheezing: 0,
    },
    mood: 3,
    triggers: [],
    notes: '',
  });

  // Load available children if no childId provided
  useEffect(() => {
    const loadChildren = async () => {
      console.log('=== DAILY LOG useEffect TRIGGERED ===');
      console.log('Current childId:', childId);
      console.log('isAuthenticated:', isAuthenticated);
      console.log('user:', user);
      
      // Make sure Firebase service has the user ID
      if (isAuthenticated && user) {
        console.log('Setting user ID in Firebase service:', user.id);
        await firebaseService.setUserId(user.id);
      }
      
      if (!childId && isAuthenticated) {
        try {
          console.log('Loading children for child selection...');
          const children = await firebaseService.getUserChildren();
          console.log('Loaded children:', children.length);
          setAvailableChildren(children);
          
          if (children.length === 1) {
            // If only one child, select it automatically
            console.log('Auto-selecting single child:', children[0].child_id);
            setChildId(children[0].child_id);
          } else if (children.length > 1) {
            // Show child selector
            console.log('Multiple children found, showing selector');
            setShowChildSelector(true);
          } else {
            console.log('No children found');
          }
        } catch (error) {
          console.error('Failed to load children:', error);
        }
      } else {
        console.log('Child already selected or user not authenticated');
      }
    };

    loadChildren();
  }, [isAuthenticated, childId, user]);

  // Handle screen focus - reset form and ensure proper state when tab is activated
  useFocusEffect(
    useCallback(() => {
      console.log('=== DAILY LOG SCREEN FOCUSED ===');
      console.log('Current state - childId:', childId, 'showChildSelector:', showChildSelector);
      
      // Reset form to fresh state when page is focused
      console.log('Resetting form for new input...');
      setLogData({
        symptoms: {
          rash: 0,
          cough: 0,
          runnyNose: 0,
          itching: 0,
          wheezing: 0,
        },
        mood: 3,
        triggers: [],
        notes: '',
      });
      setSelectedTriggers([]);
      setShowPreviousLogs(false); // Close previous logs view if open
      
      // If we somehow lost the child selection state, reload
      if (!childId && !showChildSelector && isAuthenticated && availableChildren.length > 0) {
        console.log('Restoring child selector state on focus');
        setShowChildSelector(true);
      }
      
      console.log('Form refreshed and ready for new input');
    }, [childId, showChildSelector, isAuthenticated, availableChildren.length])
  );

  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  const commonTriggers = [
    'Pollen', 'Dust', 'Pet dander', 'Food', 'Weather', 'Stress',
    'Exercise', 'Chemicals', 'Smoke', 'Perfume'
  ];

  const handleSymptomChange = (symptom: keyof typeof logData.symptoms, value: number) => {
    setLogData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptom]: value,
      },
    }));
  };

  const toggleTrigger = (trigger: string) => {
    const newTriggers = selectedTriggers.includes(trigger)
      ? selectedTriggers.filter(t => t !== trigger)
      : [...selectedTriggers, trigger];
    
    setSelectedTriggers(newTriggers);
    setLogData(prev => ({ ...prev, triggers: newTriggers }));
  };

  const handleSubmit = async () => {
    console.log('=== DAILY LOG SUBMIT PRESSED ===');
    console.log('Child ID:', childId);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('User:', user);
    console.log('Log data:', JSON.stringify(logData, null, 2));
    
    if (!childId) {
      console.log('ERROR: No child ID - showing alert');
      Alert.alert('Error', 'No child selected. Please navigate back and select a child.');
      return;
    }

    if (!isAuthenticated) {
      console.log('ERROR: Not authenticated - showing alert');
      Alert.alert('Error', 'Please log in to save daily logs.');
      return;
    }

    console.log('Validation passed, setting loading to true...');
    setLoading(true);

    try {
      console.log('Creating daily log via Firebase service...');
      const result = await firebaseService.createDailyLog(childId, logData);
      console.log('Daily log created successfully:', result);
      
      // Reset form first
      setLogData({
        symptoms: {
          rash: 0,
          cough: 0,
          runnyNose: 0,
          itching: 0,
          wheezing: 0,
        },
        mood: 3,
        triggers: [],
        notes: '',
      });
      setSelectedTriggers([]);
      
      // Automatically navigate to previous logs view after successful save
      console.log('Log saved successfully, navigating directly to previous logs view...');
      console.log('About to call loadPreviousLogs, childId:', childId);
      
      // Small delay to ensure state is updated before loading logs
      setTimeout(() => {
        console.log('Timeout executed, calling loadPreviousLogs now...');
        loadPreviousLogs();
      }, 100);
      
    } catch (error) {
      console.error('Failed to save daily log:', error);
      console.error('Error details:', error.message, error.stack);
      Alert.alert('Error', 'Failed to save daily log. Please try again.');
    } finally {
      console.log('Setting loading to false...');
      setLoading(false);
    }
  };

  const handleChildSelect = (selectedChildId: string) => {
    console.log('=== CHILD SELECTED IN DAILY LOG ===');
    console.log('Selected child ID:', selectedChildId);
    
    setChildId(selectedChildId);
    setShowChildSelector(false);
    
    console.log('Child selection complete, should show daily log form now');
  };

  const loadPreviousLogs = async () => {
    console.log('=== LOADING PREVIOUS LOGS ===');
    console.log('Child ID:', childId);
    console.log('Current showPreviousLogs state:', showPreviousLogs);
    
    if (!childId) {
      console.log('ERROR: No child ID in loadPreviousLogs');
      Alert.alert('Error', 'No child selected');
      return;
    }

    console.log('Setting loadingLogs to true...');
    setLoadingLogs(true);
    
    try {
      console.log('Fetching logs from Firebase service...');
      const logs = await firebaseService.getChildDailyLogs(childId, 50);
      console.log('Loaded previous logs:', logs.length);
      console.log('Setting previous logs state and showing modal...');
      setPreviousLogs(logs);
      setShowPreviousLogs(true);
      console.log('Modal should now be visible, showPreviousLogs set to true');
    } catch (error) {
      console.error('Failed to load previous logs:', error);
      Alert.alert('Error', 'Failed to load previous logs. Please try again.');
    } finally {
      console.log('Setting loadingLogs to false...');
      setLoadingLogs(false);
    }
  };

  // Debug render state
  console.log('=== DAILY LOG RENDER STATE ===');
  console.log('childId:', childId);
  console.log('showChildSelector:', showChildSelector);
  console.log('showPreviousLogs:', showPreviousLogs);
  console.log('availableChildren:', availableChildren.length);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('loading:', loading);
  console.log('loadingLogs:', loadingLogs);
  console.log('previousLogs count:', previousLogs.length);

  // If no child selected and multiple children available, show selector
  if (showChildSelector && availableChildren.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.childSelectorContainer}>
          <Text style={styles.selectorTitle}>Select a child for daily log</Text>
          <FlatList
            data={availableChildren}
            keyExtractor={(item) => item.child_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.childSelectorItem}
                onPress={() => handleChildSelect(item.child_id)}
              >
                <Text style={styles.childSelectorName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.childSelectorAge}>
                  {item.age_months < 12 ? `${item.age_months} months` : `${Math.floor(item.age_months / 12)} years`}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If no child available at all
  if (!childId && !loading && isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noChildContainer}>
          <Text style={styles.noChildTitle}>No children found</Text>
          <Text style={styles.noChildText}>
            Please add a child profile first to start logging daily health data.
          </Text>
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => navigation.getParent()?.navigate('ManageChildren')}
          >
            <Text style={styles.addChildButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Daily Health Log</Text>
          <Text style={styles.headerSubtitle}>
            Record today's symptoms and triggers
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString()}
          </Text>
          {process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true' && (
            <Text style={styles.debugText}>
              DEBUG: DailyLog Screen - Child ID: {childId || 'None'}
            </Text>
          )}
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms (0-10 scale)</Text>
          
          {Object.entries(logData.symptoms).map(([symptom, value]) => (
            <View key={symptom} style={styles.symptomRow}>
              <Text style={styles.symptomLabel}>
                {symptom.charAt(0).toUpperCase() + symptom.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <View style={styles.scaleContainer}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.scaleButton,
                      value === num && styles.selectedScaleButton,
                    ]}
                    onPress={() => handleSymptomChange(symptom as keyof typeof logData.symptoms, num)}
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        value === num && styles.selectedScaleButtonText,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Mood Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood (1-5 scale)</Text>
          <View style={styles.moodContainer}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.moodButton,
                  logData.mood === num && styles.selectedMoodButton,
                ]}
                onPress={() => setLogData(prev => ({ ...prev, mood: num }))}
              >
                <Text style={styles.moodEmoji}>
                  {num === 1 ? '😢' : num === 2 ? '😞' : num === 3 ? '😐' : num === 4 ? '😊' : '😄'}
                </Text>
                <Text style={styles.moodNumber}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Triggers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Potential Triggers</Text>
          <View style={styles.triggersContainer}>
            {commonTriggers.map((trigger) => (
              <TouchableOpacity
                key={trigger}
                style={[
                  styles.triggerButton,
                  selectedTriggers.includes(trigger) && styles.selectedTriggerButton,
                ]}
                onPress={() => toggleTrigger(trigger)}
              >
                <Text
                  style={[
                    styles.triggerButtonText,
                    selectedTriggers.includes(trigger) && styles.selectedTriggerButtonText,
                  ]}
                >
                  {trigger}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Add any additional notes about today's symptoms, activities, or observations..."
            value={logData.notes}
            onChangeText={(text) => setLogData(prev => ({ ...prev, notes: text }))}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={() => {
            console.log('=== SUBMIT BUTTON PRESSED ===');
            console.log('Button is enabled:', !loading);
            console.log('About to call handleSubmit...');
            handleSubmit();
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Daily Log</Text>
          )}
        </TouchableOpacity>

        {/* View Previous Logs Button */}
        <TouchableOpacity 
          style={[styles.viewLogsButton, loadingLogs && styles.submitButtonDisabled]} 
          onPress={loadPreviousLogs}
          disabled={loadingLogs || !childId}
        >
          {loadingLogs ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.viewLogsButtonText}>📋 View Previous Logs</Text>
          )}
        </TouchableOpacity>

        {/* New Entry Button */}
        <TouchableOpacity 
          style={styles.newEntryButton} 
          onPress={() => {
            console.log('=== NEW ENTRY BUTTON PRESSED ===');
            console.log('Refreshing form for new input...');
            
            // Reset form to fresh state
            setLogData({
              symptoms: {
                rash: 0,
                cough: 0,
                runnyNose: 0,
                itching: 0,
                wheezing: 0,
              },
              mood: 3,
              triggers: [],
              notes: '',
            });
            setSelectedTriggers([]);
            setShowPreviousLogs(false);
            
            Alert.alert('✨ New Entry', 'Form refreshed and ready for new input!', [
              { text: 'OK', style: 'default' }
            ]);
            
            console.log('Form refreshed successfully');
          }}
        >
          <Text style={styles.newEntryButtonText}>✨ New Entry</Text>
        </TouchableOpacity>

        {/* Debug Test Button - Only in test mode */}
        {process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true' && (
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: '#FF9500', marginTop: 10 }]} 
            onPress={() => {
              console.log('=== DEBUG TEST BUTTON PRESSED ===');
              Alert.alert('Test', 'Debug button works! Button pressing is functional.');
            }}
          >
            <Text style={styles.submitButtonText}>🐛 Test Button Press</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Previous Logs Modal */}
      <Modal
        visible={showPreviousLogs}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋 Previous Daily Logs</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPreviousLogs(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {previousLogs.length === 0 ? (
            <View style={styles.noLogsContainer}>
              <Text style={styles.noLogsText}>No previous logs found</Text>
              <Text style={styles.noLogsSubtext}>
                Start logging daily health data to see your history here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={previousLogs}
              keyExtractor={(item) => item.id}
              style={styles.logsList}
              renderItem={({ item }) => (
                <View style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logDate}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.logMood}>
                      Mood: {item.mood}/5 {item.mood >= 4 ? '😊' : item.mood >= 3 ? '😐' : '😔'}
                    </Text>
                  </View>
                  
                  {/* Symptoms */}
                  <View style={styles.logSection}>
                    <Text style={styles.logSectionTitle}>Symptoms:</Text>
                    {Object.entries(item.symptoms).some(([_, value]) => (value as number) > 0) ? (
                      <View style={styles.symptomsGrid}>
                        {Object.entries(item.symptoms).map(([symptom, value]) => 
                          (value as number) > 0 ? (
                            <Text key={symptom} style={styles.symptomChip}>
                              {symptom}: {value}/10
                            </Text>
                          ) : null
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>No symptoms recorded</Text>
                    )}
                  </View>
                  
                  {/* Triggers */}
                  {item.triggers && item.triggers.length > 0 && (
                    <View style={styles.logSection}>
                      <Text style={styles.logSectionTitle}>Triggers:</Text>
                      <View style={styles.triggersGrid}>
                        {item.triggers.map((trigger, index) => (
                          <Text key={index} style={styles.triggerChip}>
                            {trigger}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Notes */}
                  {item.notes && (
                    <View style={styles.logSection}>
                      <Text style={styles.logSectionTitle}>Notes:</Text>
                      <Text style={styles.logNotes}>{item.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
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
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#FFE082',
    fontStyle: 'italic',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  symptomRow: {
    marginBottom: 16,
  },
  symptomLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedScaleButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  scaleButtonText: {
    fontSize: 12,
    color: '#333',
  },
  selectedScaleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMoodButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTriggerButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  triggerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTriggerButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewLogsButton: {
    backgroundColor: '#2196F3',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewLogsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newEntryButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newEntryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  childSelectorContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  selectorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  childSelectorItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childSelectorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childSelectorAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noChildContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noChildTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noChildText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  addChildButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addChildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2196F3',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  noLogsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noLogsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noLogsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  logsList: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  logMood: {
    fontSize: 14,
    color: '#666',
  },
  logSection: {
    marginBottom: 12,
  },
  logSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomChip: {
    backgroundColor: '#FFE0E0',
    color: '#D32F2F',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerChip: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  logNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
