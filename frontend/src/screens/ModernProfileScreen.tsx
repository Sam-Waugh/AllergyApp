import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { RootStackParamList } from '../models';
import {
  TopBar,
  Avatar,
  ModernButton,
  MetricCard,
  Chip,
} from '../components/modern';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ModernProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const childrenData = await firebaseService.getUserChildren();
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].child_id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load child profiles');
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find(child => child.child_id === selectedChildId);

  const handleAddChild = () => {
    navigation.navigate('AddChild', { onChildAdded: loadChildren });
  };

  const handleManageChildren = () => {
    Alert.alert(
      'Manage Children',
      'Choose an action:',
      [
        {
          text: 'Add New Child',
          onPress: handleAddChild,
        },
        {
          text: 'Navigate to Manager',
          onPress: () => navigation.navigate('ManageChildren'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (selectedChild) {
      // Note: EditChild route doesn't exist in RootStackParamList, this might need to be created
      console.log('Edit profile for child:', selectedChild);
      Alert.alert('Edit Profile', 'Edit profile functionality needs to be implemented');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        title="Profile"
        actions={[
          {
            icon: 'add',
            label: 'Add Child',
            onPress: handleAddChild,
          },
          {
            icon: 'settings-outline',
            label: 'Settings',
            onPress: () => navigation.navigate('Settings'),
          },
        ]}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.userInfo}>
              <Avatar 
                name={user.name || user.email} 
                size="large"
              />
              {/* <View style={styles.userDetails}>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View> */}
            </View>
          </View>
        )}

        {/* Children Selection */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.childrenChips}>
                {children.map((child) => (
                  <Chip
                    key={child.child_id}
                    label={`${child.first_name} ${child.last_name}`}
                    selected={selectedChildId === child.child_id}
                    onPress={() => setSelectedChildId(child.child_id)}
                    style={styles.childChip}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Child Profile Overview */}
        {selectedChild && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Child Information</Text>
              <View style={styles.childInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{selectedChild.first_name} {selectedChild.last_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date of Birth:</Text>
                  <Text style={styles.infoValue}>{selectedChild.date_of_birth}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Age:</Text>
                  <Text style={styles.infoValue}>{Math.floor(selectedChild.age_months / 12)} years, {selectedChild.age_months % 12} months</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gender:</Text>
                  <Text style={styles.infoValue}>{selectedChild.gender}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.section}>
              <View style={styles.buttonGroup}>
                <ModernButton
                  title="View Daily Logs"
                  variant="primary"
                  onPress={() => navigation.navigate('DailyLog', { childId: selectedChildId })}
                  style={styles.actionButton}
                />
                <ModernButton
                  title="Manage Children"
                  variant="outline"
                  onPress={handleManageChildren}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </>
        )}

        {/* Empty State */}
        {children.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Child Profiles</Text>
            <Text style={styles.emptySubtitle}>
              Add a child profile to start tracking allergies and symptoms
            </Text>
            <ModernButton
              title="Add First Child"
              variant="primary"
              onPress={handleAddChild}
              style={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userAvatar: {
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#666666',
  },
  childrenChips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  childChip: {
    marginRight: 8,
  },
  childInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1A1A1A',
    flex: 2,
    textAlign: 'right',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  allergyTag: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  allergyTagText: {
    color: '#C62828',
  },
  medicationTag: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  medicationTagText: {
    color: '#2E7D32',
  },
  conditionTag: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  conditionTagText: {
    color: '#E65100',
  },
  buttonGroup: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
