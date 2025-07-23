import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchCurrentWeather, fetchCurrentLocationWeather, fetchCurrentLocationWeatherPublic } from '../store/slices/environmentSlice';
import { firebaseService } from '../services/firebaseService';
import { ChildResponse } from '../models/ChildProfile';
import { DailyLog } from '../models';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import {
  TopBar,
  Avatar,
  ModernButton,
  Chip,
  MetricCard,
} from '../components/modern';

// Helper function to get pollen level color
const getPollenColor = (category: string): string => {
  switch (category.toUpperCase()) {
    case 'NONE':
    case 'VERY_LOW':
      return Colors.success; // Green
    case 'LOW':
      return '#8BC34A'; // Light Green
    case 'MODERATE':
      return Colors.warning; // Amber
    case 'HIGH':
      return Colors.secondary; // Coral
    case 'VERY_HIGH':
      return Colors.error; // Red
    default:
      return '#9E9E9E'; // Gray
  }
};

const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'mild':
      return Colors.success;
    case 'moderate':
      return Colors.warning;
    case 'severe':
      return Colors.error;
    default:
      return '#9E9E9E';
  }
};

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Local state for children and logs from Firebase
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildResponse | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Keep Redux state for weather only
  const { currentWeather } = useAppSelector((state) => state.environment);

  // Load children from Firebase
  const loadChildren = async () => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping children load');
        return;
      }
      
      console.log('Loading children from Firebase...');
      const childrenData = await firebaseService.getUserChildren();
      console.log('Loaded children for HomeScreen:', childrenData);
      
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Failed to load children in HomeScreen:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load daily logs for selected child
  const loadDailyLogs = async (childId: string) => {
    try {
      setLogsLoading(true);
      console.log('Loading daily logs for child:', childId);
      const logs = await firebaseService.getChildDailyLogs(childId, 10);
      console.log('Loaded daily logs for HomeScreen:', logs.length);
      setDailyLogs(logs);
    } catch (error) {
      console.error('Failed to load daily logs in HomeScreen:', error);
      setDailyLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load children when screen focuses and user is authenticated
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadChildren();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated])
  );

  // Load logs when selected child changes
  useEffect(() => {
    if (selectedChild && isAuthenticated) {
      loadDailyLogs(selectedChild.child_id);
    }
  }, [selectedChild, isAuthenticated]);

  useEffect(() => {
    // Load weather data
    console.log('Current weather data:', currentWeather);
    
    // Try to get current location first, fallback to New York
    dispatch(fetchCurrentLocationWeatherPublic()).catch(() => {
      console.log('Location fetch failed, using fallback');
      dispatch(fetchCurrentWeather('New York, NY'));
    });
  }, [dispatch]);

  // Calculate symptom severity metrics
  const calculateMetrics = () => {
    if (!dailyLogs.length) {
      return { mild: 0, moderate: 0, severe: 0 };
    }

    let mild = 0, moderate = 0, severe = 0;
    
    dailyLogs.forEach(log => {
      if (log.symptoms) {
        Object.values(log.symptoms).forEach((severity: any) => {
          if (typeof severity === 'number') {
            if (severity <= 2) mild++;
            else if (severity <= 4) moderate++;
            else if (severity >= 5) severe++;
          }
        });
      }
    });
    
    return { mild, moderate, severe };
  };

  const metrics = calculateMetrics();

  const topBarActions = [
    {
      icon: 'settings-outline' as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
      label: 'Settings',
      onPress: () => navigation.navigate('Settings' as never),
    },
  ];

  const handleManageChildren = () => {
    navigation.navigate('ManageChildren' as never);
  };

  const handleViewHistory = () => {
    if (selectedChild) {
      (navigation as any).navigate('DailyLog', { childId: selectedChild.child_id });
    } else {
      Alert.alert('No Child Selected', 'Please select a child first.');
    }
  };

  const handleLogSymptoms = () => {
    if (selectedChild) {
      (navigation as any).navigate('DailyLog', { childId: selectedChild.child_id });
    } else {
      Alert.alert('No Child Selected', 'Please select a child first.');
    }
  };

  const handleTakePhoto = () => {
    if (selectedChild) {
      (navigation as any).navigate('ImageDiary', { childId: selectedChild.child_id });
    } else {
      Alert.alert('No Child Selected', 'Please select a child first.');
    }
  };

  const handleViewReport = () => {
    (navigation as any).navigate('DoctorReport');
  };

  const BrandedTitle = () => (
    <View style={styles.brandedTitleContainer}>
      <Text style={styles.brandedTitleSymply}>Symply</Text>
      <Text style={styles.brandedTitleAllergy}>ALLERGY</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <TopBar 
        titleComponent={<BrandedTitle />}
        actions={topBarActions}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <Ionicons name="analytics-outline" size={32} color={Colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>Good Morning!</Text>
              <Text style={styles.welcomeSubtitle}>Track your allergy journey with Symply Allergy</Text>
            </View>
          </View>
        </View>

        {/* Child Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Child</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipContainer}
            contentContainerStyle={styles.chipContent}
          >
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : children.length > 0 ? (
              children.map((child) => (
                <Chip
                  key={child.child_id}
                  label={child.first_name}
                  selected={selectedChild?.child_id === child.child_id}
                  onPress={() => setSelectedChild(child)}
                  style={styles.chip}
                />
              ))
            ) : (
              <View style={styles.noChildrenContainer}>
                <Text style={styles.noChildrenText}>No children found</Text>
                <ModernButton
                  title="Add First Child"
                  onPress={handleManageChildren}
                  variant="outline"
                  size="small"
                />
              </View>
            )}
          </ScrollView>
          
          <Text style={styles.sectionInfo}>
            {selectedChild 
              ? `Viewing symptoms for ${selectedChild.first_name}`
              : 'Choose the child to view their symptoms'
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.buttonContainer}>
            <ModernButton
              title="Add Log"
              onPress={handleLogSymptoms}
              variant="primary"
              disabled={!selectedChild}
              style={styles.actionButton}
            />
            <ModernButton
              title="Take Photo"
              onPress={handleTakePhoto}
              variant="secondary"
              disabled={!selectedChild}
              style={styles.actionButton}
            />
            <ModernButton
              title="View Report"
              onPress={handleViewReport}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
          {!selectedChild && (
            <Text style={styles.actionHint}>Select a child above to enable logging actions</Text>
          )}
        </View>

        {/* Recent Log Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Log Preview</Text>
            <Text style={styles.sectionSubtitle}>Severity Summary</Text>
          </View>
          
          <View style={styles.metricsContainer}>
            <MetricCard
              title="Mild Symptoms"
              value={metrics.mild}
              color={getSeverityColor('mild')}
              style={styles.metricCard}
            />
            <MetricCard
              title="Moderate Symptoms"
              value={metrics.moderate}
              color={getSeverityColor('moderate')}
              style={styles.metricCard}
            />
            <MetricCard
              title="Severe Symptoms"
              value={metrics.severe}
              color={getSeverityColor('severe')}
              style={styles.metricCard}
            />
          </View>
        </View>

        {/* Environment Data */}
        {currentWeather && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Environmental Conditions</Text>
              <Text style={styles.sectionSubtitle}>Current conditions in your area</Text>
            </View>
            
            <View style={styles.environmentCard}>
              <View style={styles.environmentRow}>
                <Text style={styles.environmentLabel}>Temperature</Text>
                <Text style={styles.environmentValue}>
                  {currentWeather.temperature}°C
                </Text>
              </View>
              
              {currentWeather.dailyPollenInfo && currentWeather.dailyPollenInfo.length > 0 && (
                <View style={styles.environmentRow}>
                  <Text style={styles.environmentLabel}>Pollen Level</Text>
                  <View style={styles.pollenContainer}>
                    <View 
                      style={[
                        styles.pollenIndicator,
                        { backgroundColor: getPollenColor('MODERATE') }
                      ]} 
                    />
                    <Text style={styles.environmentValue}>
                      Moderate
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.environmentRow}>
                <Text style={styles.environmentLabel}>Air Quality</Text>
                <Text style={styles.environmentValue}>
                  Good
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 8,
  },
  sectionInfo: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
    marginTop: 8,
  },
  chipContainer: {
    marginBottom: 8,
  },
  chipContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#666666',
    padding: 16,
  },
  noChildrenContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  noChildrenText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  actionHint: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
    color: '#000000',
  },
  sectionSubtitle: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
  },
  environmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  environmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  environmentLabel: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
  },
  environmentValue: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    color: '#000000',
  },
  pollenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollenIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  brandedTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: -2, // Negative gap to bring them closer together
  },
  brandedTitleSymply: {
    fontSize: 26, // Increased from 24 to make it slightly bigger
    fontWeight: '600',
    color: Colors.primary, // Teal color
    lineHeight: 28,
  },
  brandedTitleAllergy: {
    fontSize: 14, // Keep same size
    fontWeight: '600',
    color: Colors.secondary, // Coral color
    lineHeight: 16,
    letterSpacing: 1.5,
    marginTop: 2, // Changed from -4 to 2 to move it down and add space
    marginLeft: 12, // Indent to align A with the y in Symply
  },
});
