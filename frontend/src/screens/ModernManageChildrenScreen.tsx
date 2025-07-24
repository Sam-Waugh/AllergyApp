import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { firebaseService } from '../services/firebaseService';
import { ChildResponse } from '../models/ChildProfile';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../models';
import {
  TopBar,
  ModernButton,
  Avatar,
  MetricCard,
} from '../components/modern';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ModernManageChildrenScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in to view children');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const childrenData = await firebaseService.getUserChildren();
      setChildren(childrenData);
    } catch (err) {
      console.error('Error loading children:', err);
      setError('Failed to load children. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [loadChildren])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChildren();
  }, [loadChildren]);

  const handleAddChild = () => {
    navigation.navigate('AddChild');
  };

  const handleEditChild = (childId: string) => {
    // Navigate to a dedicated edit screen with full child details
    navigation.navigate('EditChild', { childId });
  };

  const handleDeleteChild = (childId: string, childName: string) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${childName}? This action cannot be undone and will remove all associated data including daily logs and photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await firebaseService.deleteChildProfile(childId);
              Alert.alert('Success', `${childName} has been deleted successfully`);
              await loadChildren(); // Reload the list
            } catch (error) {
              console.error('Error deleting child:', error);
              Alert.alert('Error', `Failed to delete child: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInMs = today.getTime() - birth.getTime();
    const years = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor((ageInMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months}m`;
  };

  const renderChildItem = ({ item }: { item: ChildResponse }) => (
    <TouchableOpacity 
      style={styles.childCard}
      onPress={() => handleEditChild(item.child_id)}
      activeOpacity={0.7}
    >
      <View style={styles.childHeader}>
        <Avatar 
          name={`${item.first_name} ${item.last_name}`} 
          size="medium" 
        />
        <View style={styles.childInfo}>
          <Text style={styles.childName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.childDetails}>
            {calculateAge(item.date_of_birth)} • {item.gender}
          </Text>
          <Text style={styles.childBirth}>
            Born: {new Date(item.date_of_birth).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.childActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditChild(item.child_id);
            }}
          >
            <Ionicons name="pencil" size={18} color="#1976D2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteChild(item.child_id, `${item.first_name} ${item.last_name}`);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.childMetrics}>
        <MetricCard
          title="Age"
          value={calculateAge(item.date_of_birth)}
          color="#2196F3"
        />
        <MetricCard
          title="Profile"
          value="Complete"
          color="#4CAF50"
        />
      </View>
      
      <View style={styles.tapToEditHint}>
        <Ionicons name="chevron-forward" size={16} color="#999999" />
        <Text style={styles.tapToEditText}>Tap to edit details</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Profiles Added</Text>
      <Text style={styles.emptySubtitle}>
        Add a profile to start tracking allergies and symptoms
      </Text>
      <ModernButton
        title="Add First Profile"
        variant="primary"
        onPress={handleAddChild}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
      <Text style={styles.errorTitle}>Error Loading Profiles</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <ModernButton
        title="Retry"
        variant="primary"
        onPress={loadChildren}
        style={styles.retryButton}
      />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar
          title="Manage Profiles"
          showBack={true}
          onBackPress={() => navigation.goBack()}
          actions={[
            {
              icon: 'add',
              label: 'Add',
              onPress: handleAddChild,
            },
          ]}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Manage Profiles"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        actions={[
          {
            icon: 'add',
            label: 'Add',
            onPress: handleAddChild,
          },
        ]}
      />
      
      <View style={styles.content}>
        {error ? (
          renderErrorState()
        ) : children.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.childrenCount}>
                {String(children.length)} {children.length === 1 ? 'Child' : 'Children'}
              </Text>
            </View>
            <FlatList
              data={children}
              renderItem={renderChildItem}
              keyExtractor={(item) => item.child_id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  childrenCount: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 16,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  childBirth: {
    fontSize: 12,
    color: '#999999',
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  childMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  tapToEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tapToEditText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
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
    minWidth: 160,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    minWidth: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
});

export default ModernManageChildrenScreen;
