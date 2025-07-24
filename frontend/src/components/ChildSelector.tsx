import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors';
import { Avatar } from './modern';

interface ChildSelectorProps {
  showLabel?: boolean;
  variant?: 'compact' | 'full';
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({ 
  showLabel = true,
  variant = 'full'
}) => {
  const { children, selectedChild, setSelectedChildId } = useChild();
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    setModalVisible(false);
  };

  if (children.length === 0) {
    return (
      <View style={styles.noChildrenContainer}>
        <Text style={styles.noChildrenText}>No children profiles found</Text>
      </View>
    );
  }

  if (children.length === 1) {
    // If only one child, show selected child without dropdown
    const child = children[0];
    return (
      <View style={[styles.container, variant === 'compact' && styles.compactContainer]}>
        {showLabel && <Text style={styles.label}>Selected Profile</Text>}
        <View style={styles.selectedChild}>
          <Avatar 
            name={`${child.first_name} ${child.last_name}`} 
            size={variant === 'compact' ? 'small' : 'medium'} 
          />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>
              {child.first_name} {child.last_name}
            </Text>
            {variant === 'full' && (
              <Text style={styles.childDetails}>
                {calculateAge(child.date_of_birth)} • {child.gender}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, variant === 'compact' && styles.compactContainer]}>
      {showLabel && <Text style={styles.label}>Selected Profile</Text>}
      
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectedChild}>
          {selectedChild ? (
            <>
              <Avatar 
                name={`${selectedChild.first_name} ${selectedChild.last_name}`} 
                size={variant === 'compact' ? 'small' : 'medium'} 
              />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>
                  {selectedChild.first_name} {selectedChild.last_name}
                </Text>
                {variant === 'full' && (
                  <Text style={styles.childDetails}>
                    {calculateAge(selectedChild.date_of_birth)} • {selectedChild.gender}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.selectText}>Select a child</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Profile</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.childrenList}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.child_id}
                  style={[
                    styles.childOption,
                    selectedChild?.child_id === child.child_id && styles.selectedOption
                  ]}
                  onPress={() => handleChildSelect(child.child_id)}
                >
                  <Avatar 
                    name={`${child.first_name} ${child.last_name}`} 
                    size="medium" 
                  />
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>
                      {child.first_name} {child.last_name}
                    </Text>
                    <Text style={styles.childDetails}>
                      {calculateAge(child.date_of_birth)} • {child.gender}
                    </Text>
                  </View>
                  {selectedChild?.child_id === child.child_id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  compactContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  noChildrenContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noChildrenText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedChild: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childInfo: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  childDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  childrenList: {
    maxHeight: 400,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
});

export default ChildSelector;
