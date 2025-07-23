// frontend/src/screens/ManageChildrenScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { firebaseService } from '../services/firebaseService';
import { ChildResponse } from '../models/ChildProfile';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../models';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ManageChildrenScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = async () => {
    try {
      setError(null);
      
      if (!isAuthenticated) {
        console.log('User not authenticated, waiting...');
        return;
      }

      console.log('Loading children for user:', user?.email);
      const childrenData = await firebaseService.getUserChildren();
      setChildren(childrenData);
      console.log('Loaded children:', childrenData.length);
    } catch (err) {
      console.error('Failed to load children:', err);
      setError('Failed to load children profiles');
      // Only show alert if it's not an authentication error (which we're handling)
      if (!err.message.includes('not authenticated')) {
        Alert.alert('Error', 'Failed to load children profiles. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load children when screen focuses and user is authenticated
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && isAuthenticated) {
        loadChildren();
      } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setError('Please log in to view children profiles');
      }
    }, [isAuthenticated, authLoading])
  );

  const handleRefresh = () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    loadChildren();
  };

  const handleAddChild = () => {
    navigation.navigate('AddChild', {
      onChildAdded: () => {
        console.log('Child added callback received');
        loadChildren(); // Refresh the children list
      }
    });
  };

  // Debug function to view database contents
  const debugViewDatabase = async () => {
    try {
      const data = await firebaseService.debugViewDatabase();
      Alert.alert(
        'Database Contents', 
        `Found ${data.totalEntries || Object.keys(data).length} entries:\n• ${data.logEntries || 0} access logs\n• ${data.dailyLogEntries || 0} daily logs\n\nCheck console for details.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to view database contents');
    }
  };

  // Debug function to flush logs manually
  const debugFlushLogs = async () => {
    try {
      await firebaseService.flushLogs();
      Alert.alert(
        'Logs Flushed', 
        'Access logs have been flushed to storage. Check console for details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to flush logs');
    }
  };

  const handleViewChild = (child: ChildResponse) => {
    // For now, navigate to Profile screen with childId as parameter
    navigation.navigate('Profile', { 
      childId: child.child_id
    });
  };

  const calculateAge = (dateOfBirth: string): string => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  const renderChildCard = ({ item }: { item: ChildResponse }) => (
    <TouchableOpacity 
      style={styles.childCard}
      onPress={() => handleViewChild(item)}
      activeOpacity={0.7}
    >
      <View style={styles.childCardHeader}>
        <View style={styles.childAvatar}>
          <Text style={styles.childAvatarText}>
            {item.first_name.charAt(0)}{item.last_name.charAt(0)}
          </Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.childAge}>
            {calculateAge(item.date_of_birth)}
          </Text>
          <Text style={styles.childGender}>
            {item.gender.replace('_', ' ')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Children Added</Text>
      <Text style={styles.emptyStateDescription}>
        Add your first child's profile to start tracking their health and symptoms.
      </Text>
      <TouchableOpacity style={styles.addFirstChildButton} onPress={handleAddChild}>
        <Text style={styles.addFirstChildButtonText}>Add First Child</Text>
      </TouchableOpacity>
    </View>
  );

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-circle-outline" size={64} color="#007AFF" />
        <Text style={styles.headerTitle}>Welcome to Allergy App</Text>
        <Text style={styles.loadingText}>Automatically signing you in...</Text>
        <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading children profiles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Children</Text>
          {user && <Text style={styles.userInfo}>Logged in as {user.email}</Text>}
        </View>
        <View style={styles.headerButtons}>
          {/* Debug buttons (only in test mode) */}
          {process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true' && (
            <>
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={debugFlushLogs}
              >
                <Ionicons name="document-text" size={20} color="#FF9500" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={debugViewDatabase}
              >
                <Ionicons name="bug" size={20} color="#FF9500" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddChild}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadChildren}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Children List */}
      {children.length > 0 ? (
        <FlatList
          data={children}
          renderItem={renderChildCard}
          keyExtractor={(item) => item.child_id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : !loading && !error ? (
        renderEmptyState()
      ) : null}

      {/* HIPAA Compliance Notice */}
      <View style={styles.hipaaNotice}>
        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
        <Text style={styles.hipaaNoticeText}>
          All data is encrypted and HIPAA compliant
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  childCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  childAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childGender: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstChildButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addFirstChildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hipaaNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0f8ff',
  },
  hipaaNoticeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
});

export default ManageChildrenScreen;
