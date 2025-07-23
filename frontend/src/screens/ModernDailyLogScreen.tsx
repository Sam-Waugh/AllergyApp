import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, DailyLogForm, DailyLog } from '../models';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useAppSelector } from '../store';
import { Colors } from '../constants/Colors';
import {
  TopBar,
  ModernButton,
  MetricCard,
  Chip,
} from '../components/modern';
import Slider from '../components/modern/Slider';

type DailyLogRouteProp = RouteProp<RootStackParamList, 'DailyLog'>;

const MOOD_OPTIONS = [
  { label: '😢', value: 1 },
  { label: '😕', value: 2 },
  { label: '😐', value: 3 },
  { label: '😊', value: 4 },
  { label: '😄', value: 5 },
];

const COMMON_TRIGGERS = [
  'Pollen', 'Dust', 'Pet Dander', 'Food', 'Weather',
  'Stress', 'Exercise', 'Medication', 'Other'
];

export default function ModernDailyLogScreen() {
  const route = useRoute<DailyLogRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Get selected child from Redux store as fallback
  const selectedChildFromStore = useAppSelector((state) => state.children.selectedChild);
  
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [childId, setChildId] = useState(route.params?.childId || '');
  const [activeTab, setActiveTab] = useState<'new' | 'previous'>('new');
  const [previousLogs, setPreviousLogs] = useState<DailyLog[]>([]);

  console.log('=== DAILY LOG SCREEN RENDERED ===');
  console.log('Route params:', route.params);
  console.log('Initial childId from route:', route.params?.childId);
  console.log('Selected child from Redux store:', selectedChildFromStore);
  console.log('Current childId state:', childId);
  console.log('User:', user?.email);
  console.log('Active tab:', activeTab);

  // Initialize child ID with multiple fallback strategies
  useEffect(() => {
    const initializeChildId = async () => {
      console.log('🔄 Initializing child ID...');
      
      // Strategy 1: Use route parameter (highest priority)
      if (route.params?.childId) {
        console.log('✅ Using child ID from route params:', route.params.childId);
        setChildId(route.params.childId);
        return;
      }
      
      // Strategy 2: Use Redux store selected child
      if (selectedChildFromStore?.id) {
        console.log('✅ Using child ID from Redux store:', selectedChildFromStore.id);
        setChildId(selectedChildFromStore.id);
        return;
      }
      
      // Strategy 3: Fetch first child from Firebase (fallback)
      if (user && !childId) {
        try {
          console.log('🔄 No childId from route or store, fetching user children...');
          const children = await firebaseService.getUserChildren();
          console.log('📝 User children:', children);
          if (children.length > 0) {
            console.log('✅ Using first child from Firebase:', children[0].child_id);
            setChildId(children[0].child_id);
          } else {
            console.log('❌ No children found for user');
          }
        } catch (error) {
          console.error('❌ Error getting user children:', error);
        }
      }
    };
    
    initializeChildId();
  }, [user, route.params?.childId, selectedChildFromStore]);
  
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

  useEffect(() => {
    if (activeTab === 'previous') {
      loadPreviousLogs();
    }
  }, [activeTab, childId]);

  const handleSymptomChange = (symptom: string, value: number) => {
    setLogData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptom]: value,
      },
    }));
  };

  const handleMoodChange = (mood: number) => {
    setLogData(prev => ({ ...prev, mood }));
  };

  const handleTriggerToggle = (trigger: string) => {
    setLogData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger],
    }));
  };

  const handleNotesChange = (notes: string) => {
    setLogData(prev => ({ ...prev, notes }));
  };

  const handleSave = async () => {
    if (!user || !childId) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    setLoading(true);
    try {
      await firebaseService.createDailyLog(childId, logData);
      
      Alert.alert('Success', 'Daily log saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving daily log:', error);
      Alert.alert('Error', 'Failed to save daily log');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousLogs = async () => {
    console.log('=== LOADING PREVIOUS LOGS ===');
    console.log('User:', user);
    console.log('Child ID:', childId);
    
    if (!user || !childId) {
      console.log('❌ Missing user or childId');
      Alert.alert('Error', 'User or child information is missing');
      return;
    }
    
    setLoadingLogs(true);
    try {
      console.log('🔄 Calling firebaseService.getChildDailyLogs...');
      const logs = await firebaseService.getChildDailyLogs(childId, 30);
      console.log('✅ Retrieved logs:', logs.length, 'logs');
      console.log('Logs data:', JSON.stringify(logs, null, 2));
      setPreviousLogs(logs);
    } catch (error) {
      console.error('❌ Error loading previous logs:', error);
      Alert.alert('Error', `Failed to load previous logs: ${error.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getSeverityColor = (total: number) => {
    if (total <= 5) return '#4CAF50';
    if (total <= 15) return '#FF9800';
    return '#F44336';
  };

  const getSeverityLabel = (total: number) => {
    if (total === 0) return 'No symptoms';
    if (total <= 5) return 'Mild';
    if (total <= 15) return 'Moderate';
    return 'Severe';
  };

  const createTestLog = async () => {
    if (!user || !childId) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    try {
      const testLogData: DailyLogForm = {
        symptoms: {
          rash: 3,
          cough: 2,
          runnyNose: 4,
          itching: 1,
          wheezing: 0,
        },
        mood: 3,
        triggers: ['Pollen', 'Dust'],
        notes: 'Test log entry created for debugging',
      };

      await firebaseService.createDailyLog(childId, testLogData);
      Alert.alert('Success', 'Test log created! Now check Previous Logs tab.');
      
      // Refresh the logs if we're on the previous tab
      if (activeTab === 'previous') {
        await loadPreviousLogs();
      }
    } catch (error) {
      console.error('Error creating test log:', error);
      Alert.alert('Error', 'Failed to create test log');
    }
  };

  const getSymptomsTotal = () => {
    return Object.values(logData.symptoms).reduce((sum, val) => sum + val, 0);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar
        title="Daily Symptom Log"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        actions={activeTab === 'new' ? [
          {
            icon: 'checkmark',
            label: 'Save',
            onPress: handleSave,
          },
        ] : [
          {
            icon: 'refresh',
            label: 'Refresh',
            onPress: loadPreviousLogs,
          },
          {
            icon: 'add',
            label: 'Test Log',
            onPress: createTestLog,
          },
        ]}
      />
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            New Log
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'previous' && styles.activeTab]}
          onPress={() => setActiveTab('previous')}
        >
          <Text style={[styles.tabText, activeTab === 'previous' && styles.activeTabText]}>
            Previous Logs
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? renderNewLogForm() : renderPreviousLogs()}
    </View>
  );

  function renderNewLogForm() {
    return (
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Symptoms"
              value={getSymptomsTotal().toString()}
              color={getSymptomsTotal() > 10 ? '#F44336' : getSymptomsTotal() > 5 ? '#FF9800' : '#4CAF50'}
            />
            <MetricCard
              title="Mood"
              value={MOOD_OPTIONS.find(m => m.value === logData.mood)?.label || '😐'}
              color="#2196F3"
            />
            <MetricCard
              title="Triggers"
              value={logData.triggers.length.toString()}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Severity</Text>
          <Text style={styles.sectionSubtitle}>Rate each symptom from 0-5</Text>
          
          <Slider
            label="Skin Rash"
            icon="🔴"
            value={logData.symptoms.rash}
            onChange={(value) => handleSymptomChange('rash', value)}
          />
          
          <Slider
            label="Cough"
            icon="🔵"
            value={logData.symptoms.cough}
            onChange={(value) => handleSymptomChange('cough', value)}
          />
          
          <Slider
            label="Runny Nose"
            icon="💧"
            value={logData.symptoms.runnyNose}
            onChange={(value) => handleSymptomChange('runnyNose', value)}
          />
          
          <Slider
            label="Itching"
            icon="✋"
            value={logData.symptoms.itching}
            onChange={(value) => handleSymptomChange('itching', value)}
          />
          
          <Slider
            label="Wheezing"
            icon="💨"
            value={logData.symptoms.wheezing}
            onChange={(value) => handleSymptomChange('wheezing', value)}
          />
        </View>

        {/* Mood Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodContainer}>
            {MOOD_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={logData.mood === option.value}
                onPress={() => handleMoodChange(option.value)}
                style={styles.moodChip}
              />
            ))}
          </View>
        </View>

        {/* Triggers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Possible Triggers</Text>
          <Text style={styles.sectionSubtitle}>Select all that may have caused symptoms</Text>
          <View style={styles.triggersContainer}>
            {COMMON_TRIGGERS.map((trigger) => (
              <Chip
                key={trigger}
                label={trigger}
                selected={logData.triggers.includes(trigger)}
                onPress={() => handleTriggerToggle(trigger)}
                style={styles.triggerChip}
              />
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any additional details about today's symptoms, activities, or observations..."
            value={logData.notes}
            onChangeText={handleNotesChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <ModernButton
            title={loading ? 'Saving...' : 'Save Daily Log'}
            variant="primary"
            onPress={handleSave}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </View>
      </ScrollView>
    );
  }

  function renderPreviousLogs() {
    return (
      <View style={styles.content}>
        {loadingLogs ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading previous logs...</Text>
          </View>
        ) : previousLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Previous Logs</Text>
            <Text style={styles.emptySubtitle}>
              Start logging daily symptoms to see them here
            </Text>
            <ModernButton
              title="Create First Log"
              variant="primary"
              onPress={() => setActiveTab('new')}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <FlatList
            data={previousLogs}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            renderItem={({ item }) => (
              <View style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View>
                    <Text style={styles.logDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.logTime}>
                      {new Date(item.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.logMetrics}>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(Object.values(item.symptoms).reduce((sum, val) => sum + val, 0)) }
                    ]}>
                      <Text style={styles.severityText}>
                        {getSeverityLabel(Object.values(item.symptoms).reduce((sum, val) => sum + val, 0))}
                      </Text>
                    </View>
                    <Text style={styles.moodIndicator}>
                      {MOOD_OPTIONS.find(m => m.value === item.mood)?.label || '😐'}
                    </Text>
                  </View>
                </View>

                {/* Symptoms Overview */}
                <View style={styles.symptomsOverview}>
                  <Text style={styles.logSectionTitle}>Symptoms</Text>
                  <View style={styles.symptomsGrid}>
                    {Object.entries(item.symptoms).map(([symptom, value]) => (
                      value > 0 && (
                        <View key={symptom} style={styles.symptomItem}>
                          <Text style={styles.symptomName}>
                            {symptom.charAt(0).toUpperCase() + symptom.slice(1).replace(/([A-Z])/g, ' $1')}
                          </Text>
                          <Text style={styles.symptomValue}>{String(value)}/10</Text>
                        </View>
                      )
                    ))}
                  </View>
                </View>

                {/* Triggers */}
                {item.triggers && item.triggers.length > 0 && (
                  <View style={styles.triggersOverview}>
                    <Text style={styles.logSectionTitle}>Triggers</Text>
                    <View style={styles.triggersGrid}>
                      {item.triggers.map((trigger, index) => (
                        <View key={index} style={styles.triggerBadge}>
                          <Text style={styles.triggerText}>{trigger}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Notes */}
                {item.notes && (
                  <View style={styles.notesOverview}>
                    <Text style={styles.logSectionTitle}>Notes</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodChip: {
    flex: 1,
  },
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  buttonContainer: {
    paddingVertical: 16,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Previous logs styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  logTime: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  logMetrics: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  moodIndicator: {
    fontSize: 20,
  },
  symptomsOverview: {
    marginBottom: 12,
  },
  logSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomItem: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  symptomName: {
    fontSize: 14,
    color: '#666666',
  },
  symptomValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  triggersOverview: {
    marginBottom: 12,
  },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  triggerText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  notesOverview: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
