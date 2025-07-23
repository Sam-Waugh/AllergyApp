/**
 * Edit Child Screen - HIPAA-compliant child profile editing
 * 
 * This screen provides a comprehensive form for editing existing child profiles
 * with medical information, medications, and medical history.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../models';
import {
  ChildProfile,
  ChildResponse,
  UpdateChildRequest,
  GenderType,
  AllergyInfo,
  MedicationInfo,
  SeverityType,
  COMMON_ALLERGENS,
  COMMON_SYMPTOMS
} from '../models/ChildProfile';
import {
  TopBar,
  ModernButton,
  Avatar,
} from '../components/modern';

type EditChildRouteProp = RouteProp<RootStackParamList, 'EditChild'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function EditChildScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditChildRouteProp>();
  const { user, isAuthenticated, logout } = useAuth();
  const { childId } = route.params;

  // Loading and form states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [child, setChild] = useState<ChildProfile | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<GenderType>('other');
  const [allergies, setAllergies] = useState<AllergyInfo[]>([]);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [notes, setNotes] = useState('');

  // Modal states
  const [allergyModalVisible, setAllergyModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<SeverityType>('mild');
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDosage, setNewMedicationDosage] = useState('');
  const [newMedicationFrequency, setNewMedicationFrequency] = useState('');

  // Load child data
  useEffect(() => {
    loadChildData();
  }, [childId]);

  const loadChildData = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please log in to edit child profile');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const childData = await firebaseService.getChildProfile(childId);
      
      if (!childData) {
        Alert.alert('Error', 'Child not found');
        navigation.goBack();
        return;
      }

      setChild(childData);
      setFirstName(childData.first_name);
      setLastName(childData.last_name);
      setDateOfBirth(childData.date_of_birth);
      setGender(childData.gender as GenderType);
      setAllergies(childData.known_allergies || []);
      setMedications(childData.current_medications || []);
      setMedicalHistory(childData.medical_notes || '');
      setNotes(''); // Notes might be stored separately
    } catch (error) {
      console.error('Error loading child data:', error);
      Alert.alert('Error', 'Failed to load child profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'Please enter a first name');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter a last name');
      return;
    }

    if (!dateOfBirth) {
      Alert.alert('Validation Error', 'Please enter a date of birth');
      return;
    }

    try {
      setSaving(true);
      
      const updateData: UpdateChildRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth,
        gender: gender,
        allergies: allergies,
        medications: medications,
        medical_history: medicalHistory.trim(),
        notes: notes.trim(),
      };

      await firebaseService.updateChildProfile(childId, updateData);
      
      Alert.alert('Success', 'Child profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Error updating child:', error);
      Alert.alert('Error', 'Failed to update child profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllergy = () => {
    if (!newAllergyName.trim()) {
      Alert.alert('Validation Error', 'Please enter an allergy name');
      return;
    }

    const newAllergy: AllergyInfo = {
      allergen: newAllergyName.trim(),
      severity: newAllergySeverity,
      reaction_type: [],
      notes: '',
      verified_by_doctor: false
    };

    setAllergies([...allergies, newAllergy]);
    setNewAllergyName('');
    setNewAllergySeverity('mild');
    setAllergyModalVisible(false);
  };

  const handleRemoveAllergy = (index: number) => {
    const updatedAllergies = allergies.filter((_, i) => i !== index);
    setAllergies(updatedAllergies);
  };

  const handleAddMedication = () => {
    if (!newMedicationName.trim()) {
      Alert.alert('Validation Error', 'Please enter a medication name');
      return;
    }

    const newMedication: MedicationInfo = {
      name: newMedicationName.trim(),
      dosage: newMedicationDosage.trim(),
      frequency: newMedicationFrequency.trim(),
      start_date: new Date().toISOString().split('T')[0],
      active: true,
      side_effects: [],
      notes: ''
    };

    setMedications([...medications, newMedication]);
    setNewMedicationName('');
    setNewMedicationDosage('');
    setNewMedicationFrequency('');
    setMedicationModalVisible(false);
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = medications.filter((_, i) => i !== index);
    setMedications(updatedMedications);
  };

  const handleDeleteChild = () => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${firstName} ${lastName}? This action cannot be undone and will remove all associated data including daily logs and photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Child',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await firebaseService.deleteChildProfile(childId);
              Alert.alert('Success', `${firstName} ${lastName} has been deleted successfully`, [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('ManageChildren')
                }
              ]);
            } catch (error) {
              console.error('Error deleting child:', error);
              Alert.alert('Error', `Failed to delete child: ${error.message}`);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar
          title="Edit Child"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading child profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar
          title="Edit Child"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Child not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Edit Child"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        actions={[
          {
            icon: 'checkmark',
            label: 'Save',
            onPress: handleSave,
          },
        ]}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Header with Avatar */}
            <View style={styles.header}>
              <Avatar 
                name={`${firstName} ${lastName}`} 
                size="large" 
              />
              <Text style={styles.childName}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.childAge}>
                Born: {formatDate(dateOfBirth)}
              </Text>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['male', 'female', 'other'].map((genderOption) => (
                    <TouchableOpacity
                      key={genderOption}
                      style={[
                        styles.genderOption,
                        gender === genderOption && styles.genderOptionSelected
                      ]}
                      onPress={() => setGender(genderOption as GenderType)}
                    >
                      <Text style={[
                        styles.genderText,
                        gender === genderOption && styles.genderTextSelected
                      ]}>
                        {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Allergies Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Allergies</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setAllergyModalVisible(true)}
                >
                  <Ionicons name="add" size={20} color="#1976D2" />
                </TouchableOpacity>
              </View>
              
              {allergies.length === 0 ? (
                <Text style={styles.emptyText}>No allergies added</Text>
              ) : (
                allergies.map((allergy, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>{allergy.allergen}</Text>
                      <Text style={styles.listItemSubtitle}>
                        Severity: {allergy.severity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveAllergy(index)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Medications Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medications</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setMedicationModalVisible(true)}
                >
                  <Ionicons name="add" size={20} color="#1976D2" />
                </TouchableOpacity>
              </View>
              
              {medications.length === 0 ? (
                <Text style={styles.emptyText}>No medications added</Text>
              ) : (
                medications.map((medication, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>{medication.name}</Text>
                      <Text style={styles.listItemSubtitle}>
                        {medication.dosage} - {medication.frequency}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMedication(index)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Medical History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical History</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={medicalHistory}
                onChangeText={setMedicalHistory}
                placeholder="Enter medical history, conditions, or other relevant information..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes or observations..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Save Button */}
            <View style={styles.buttonContainer}>
              <ModernButton
                title={saving ? "Saving..." : "Save Changes"}
                variant="primary"
                onPress={handleSave}
                disabled={saving}
                style={styles.saveButton}
              />
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>⚠️ Danger Zone</Text>
              <Text style={styles.dangerZoneDescription}>
                These actions cannot be undone. Please be careful.
              </Text>
              
              <ModernButton
                title="🗑️ Delete This Child"
                variant="outline"
                onPress={handleDeleteChild}
                disabled={saving}
                style={styles.dangerButton}
              />
              
              <Text style={styles.dangerZoneNote}>
                "Delete This Child" will remove this child's profile and all associated data permanently.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Allergy Modal */}
      <Modal
        visible={allergyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAllergyModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAllergyModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Allergy</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleAddAllergy}
            >
              <Text style={styles.modalSaveText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allergy Name *</Text>
              <TextInput
                style={styles.input}
                value={newAllergyName}
                onChangeText={setNewAllergyName}
                placeholder="e.g., Peanuts, Dust, Pollen"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Severity</Text>
              <View style={styles.severityContainer}>
                {['mild', 'moderate', 'severe'].map((severityOption) => (
                  <TouchableOpacity
                    key={severityOption}
                    style={[
                      styles.severityOption,
                      newAllergySeverity === severityOption && styles.severityOptionSelected
                    ]}
                    onPress={() => setNewAllergySeverity(severityOption as SeverityType)}
                  >
                    <Text style={[
                      styles.severityText,
                      newAllergySeverity === severityOption && styles.severityTextSelected
                    ]}>
                      {severityOption.charAt(0).toUpperCase() + severityOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Medication Modal */}
      <Modal
        visible={medicationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMedicationModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setMedicationModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleAddMedication}
            >
              <Text style={styles.modalSaveText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medication Name *</Text>
              <TextInput
                style={styles.input}
                value={newMedicationName}
                onChangeText={setNewMedicationName}
                placeholder="e.g., Benadryl, EpiPen"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={styles.input}
                value={newMedicationDosage}
                onChangeText={setNewMedicationDosage}
                placeholder="e.g., 25mg, 1 tablet"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <TextInput
                style={styles.input}
                value={newMedicationFrequency}
                onChangeText={setNewMedicationFrequency}
                placeholder="e.g., As needed, Daily, Twice daily"
                placeholderTextColor="#999999"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  childName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  childAge: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderOptionSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  genderText: {
    fontSize: 16,
    color: '#666666',
  },
  genderTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    height: 48,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  severityOptionSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  severityText: {
    fontSize: 16,
    color: '#666666',
  },
  severityTextSelected: {
    color: '#FF9800',
    fontWeight: '500',
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  dangerZoneDescription: {
    fontSize: 14,
    color: '#B71C1C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F44336',
    borderWidth: 2,
    marginBottom: 12,
  },
  dangerZoneNote: {
    fontSize: 12,
    color: '#B71C1C',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
});
