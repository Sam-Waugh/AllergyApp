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
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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
      
      // Initialize Firebase service with user ID
      if (user?.id) {
        console.log('Setting Firebase service user ID:', user.id);
        await firebaseService.setUserId(user.id);
      }
      
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
    photos: [],
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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to access photos.');
      return false;
    }
    return true;
  };

  const handleAddPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: () => takePhoto() },
        { text: 'Photo Library', onPress: () => pickImage() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      addPhotoToLog(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      addPhotoToLog(result.assets[0].uri);
    }
  };

  const addPhotoToLog = (uri: string) => {
    setLogData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), {
        uri,
        description: '',
        bodyPart: '',
        severity: 0,
      }],
    }));
  };

  const saveIndividualPhoto = async (index: number) => {
    // DISABLED: Individual photo saving removed - photos are now saved with the complete daily log
    Alert.alert('Info', 'Photos will be saved when you save the daily log. Please fill in symptoms and mood, then tap "Save Daily Log".');
  };

  const removePhoto = (index: number) => {
    setLogData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || [],
    }));
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setLogData(prev => ({
      ...prev,
      photos: prev.photos?.map((photo, i) => 
        i === index ? { ...photo, description } : photo
      ) || [],
    }));
  };

  const updatePhotoBodyPart = (index: number, bodyPart: string) => {
    setLogData(prev => ({
      ...prev,
      photos: prev.photos?.map((photo, i) => 
        i === index ? { ...photo, bodyPart } : photo
      ) || [],
    }));
  };

  const handleSave = async () => {
    if (!user || !childId) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    setLoading(true);
    try {
      // First create the daily log
      const dailyLog = await firebaseService.createDailyLog(childId, logData);
      console.log('Created daily log:', dailyLog);
      console.log('=== DAILY LOG CREATION DEBUG ===');
      console.log('New daily log ID:', dailyLog.id);
      console.log('Photos in logData:', logData.photos?.length || 0);

      // Save photo metadata if any exist (photos stay on device)
      if (logData.photos && logData.photos.length > 0) {
        console.log('=== PHOTO METADATA SAVING DEBUG ===');
        console.log('Number of photos to save metadata for:', logData.photos.length);
        console.log('Daily log ID for linking:', dailyLog.id);
        console.log('Child ID:', childId);
        
        const metadataPromises = logData.photos.map(async (photo, i) => {
          try {
            console.log(`=== PHOTO ${i + 1} METADATA SAVE START ===`);
            console.log(`Photo ${i + 1} URI:`, photo.uri);
            console.log(`Photo ${i + 1} description:`, photo.description);
            console.log(`Photo ${i + 1} body part:`, photo.bodyPart);
            
            // Save photo metadata only
            const photoMetadata = {
              log_entry_id: dailyLog.id,
              local_uri: photo.uri,
              description: photo.description || 'Daily log photo',
              body_area: photo.bodyPart || '',
              severity_rating: photo.severity || 0,
              photo_type: 'symptom',
              original_filename: `daily_log_photo_${Date.now()}_${i + 1}.jpg`,
              tags: ['daily-log', 'symptom'],
              taken_at: new Date().toISOString(),
              file_size: 0, // Will be calculated when needed
              mime_type: 'image/jpeg'
            };
            
            console.log(`Complete photo metadata for photo ${i + 1}:`, JSON.stringify(photoMetadata, null, 2));
            const result = await firebaseService.savePhotoMetadata(childId, photoMetadata);
            
            console.log(`=== PHOTO ${i + 1} METADATA SAVE RESULT ===`);
            console.log('Saved photo metadata result:', JSON.stringify(result, null, 2));
            return result;
          } catch (photoError) {
            console.error(`=== PHOTO ${i + 1} METADATA SAVE ERROR ===`);
            console.error('Photo error details:', photoError);
            // Don't throw, just log and continue with other photos
            return null;
          }
        });
        
        const metadataResults = await Promise.all(metadataPromises);
        const successfulSaves = metadataResults.filter(result => result !== null);
        console.log(`Successfully saved metadata for ${successfulSaves.length} out of ${logData.photos.length} photos`);
      }
      
      Alert.alert('Success', 'Daily log saved successfully! Photos remain on your device for privacy.', [
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
      console.log('=== DETAILED LOGS DEBUG ===');
      logs.forEach((log, index) => {
        console.log(`=== LOG ${index + 1} DETAILED DEBUG ===`);
        console.log('Log ID:', log.id);
        console.log('Log date:', log.date);
        console.log('Log created at:', log.createdAt);
        console.log('Has photos:', !!log.photos);
        console.log('Photo count:', log.photos?.length || 0);
        
        if (log.photos && log.photos.length > 0) {
          console.log('Photos details:');
          log.photos.forEach((photo, photoIndex) => {
            console.log(`  Photo ${photoIndex + 1}:`, {
              id: photo.id,
              localUri: photo.localUri,
              photoUrl: photo.photoUrl,
              description: photo.description,
              bodyPart: photo.bodyPart,
              takenAt: photo.takenAt
            });
          });
        } else {
          console.log('No photos found for this log');
        }
      });
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
            <MetricCard
              title="Photos"
              value={(logData.photos?.length || 0).toString()}
              color="#FF5722"
            />
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Take photos of symptoms or reactions</Text>
          
          {logData.photos && logData.photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {logData.photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <View style={styles.photoWrapper}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.photoDescriptionInput}
                    placeholder="Describe this photo..."
                    value={photo.description}
                    onChangeText={(text) => updatePhotoDescription(index, text)}
                    multiline
                    numberOfLines={2}
                  />
                  <TextInput
                    style={styles.photoBodyPartInput}
                    placeholder="Body part (e.g., arm, face)"
                    value={photo.bodyPart}
                    onChangeText={(text) => updatePhotoBodyPart(index, text)}
                  />
                  <TouchableOpacity
                    style={[styles.savePhotoButton, { backgroundColor: '#2196F3' }]}
                    onPress={() => Alert.alert(
                      'Save Daily Log', 
                      'To save photos, please save the complete daily log with your symptoms and mood. Would you like to save the daily log now?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Save Daily Log', onPress: () => {
                          // Scroll to the save button or trigger save
                          Alert.alert('Info', 'Please scroll down and tap "Save Daily Log" to save all your photos and symptoms together.');
                        }}
                      ]
                    )}
                  >
                    <Ionicons name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.savePhotoText}>Save Daily Log</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noPhotosContainer}>
              <Ionicons name="camera-outline" size={48} color="#CCCCCC" />
              <Text style={styles.noPhotosText}>No photos added yet</Text>
              <Text style={styles.noPhotosSubtext}>Tap "Add Photo" to capture symptoms</Text>
            </View>
          )}
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

                {/* Photos */}
                {item.photos && item.photos.length > 0 && (
                  <View style={styles.photosOverview}>
                    <Text style={styles.logSectionTitle}>Photos ({item.photos.length})</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosHorizontalContainer}
                    >
                      {item.photos.map((photo, photoIndex) => (
                        <View key={photo.id || photoIndex} style={styles.logPhotoContainer}>
                          <Image 
                            source={{ uri: photo.localUri || photo.photoUrl }} 
                            style={styles.logPhotoImage}
                            resizeMode="cover"
                          />
                          {photo.description && (
                            <Text style={styles.logPhotoDescription} numberOfLines={2}>
                              {photo.description}
                            </Text>
                          )}
                          {photo.bodyPart && (
                            <Text style={styles.logPhotoBodyPart}>
                              📍 {photo.bodyPart}
                            </Text>
                          )}
                          {photo.takenAt && (
                            <Text style={styles.logPhotoTime}>
                              📸 {new Date(photo.takenAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          )}
                        </View>
                      ))}
                    </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  photosGrid: {
    gap: 16,
  },
  photoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  photoDescriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoBodyPartInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
  },
  savePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
    justifyContent: 'center',
  },
  savePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  noPhotosText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    fontWeight: '500',
  },
  noPhotosSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
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
  // Photos in previous logs styles
  photosOverview: {
    marginBottom: 12,
  },
  photosHorizontalContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  logPhotoContainer: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  logPhotoImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginBottom: 4,
  },
  logPhotoDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 14,
    marginBottom: 2,
  },
  logPhotoBodyPart: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 1,
  },
  logPhotoTime: {
    fontSize: 10,
    color: '#999999',
  },
});
