/**
 * Add Profile Screen - HIPAA-compliant profile creation
 * 
 * This screen provides a comprehensive form for creating profiles
 * with medical information, emergency contacts, and HIPAA consent tracking.
 */

import React, { useState, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import {
  CreateChildRequest,
  GenderType,
  AllergyInfo,
  AllergyType,
  MedicationInfo,
  EmergencyContact,
  MedicalProvider,
  SeverityType,
  ValidationError,
  FamilyMedicalHistoryInfo,
  AllergicReactionEntry,
  COMMON_ALLERGENS,
  COMMON_SYMPTOMS,
  FAMILY_RELATIONS,
  COMMON_HEREDITARY_CONDITIONS,
  ALLERGIC_REACTION_SYMPTOMS,
  ALLERGIC_REACTION_TREATMENTS
} from '../models/ChildProfile';

interface AddChildScreenProps {
  route?: {
    params?: {
      onProfileAdded?: () => void;
    };
  };
}

export default function AddChildScreen({ route }: AddChildScreenProps) {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Debug logging for development
  console.log('AddChildScreen: Current step:', currentStep, 'Loading:', loading);

  // Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<GenderType>('prefer_not_to_say');

  // Medical Information
  const [allergies, setAllergies] = useState<AllergyInfo[]>([]);
  const [medications, setMedications] = useState<MedicationInfo[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [familyMedicalHistory, setFamilyMedicalHistory] = useState<FamilyMedicalHistoryInfo[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', relationship: '', phone_primary: '', phone_secondary: '', email: '' }
  ]);

  // Primary Doctor
  const [primaryDoctor, setPrimaryDoctor] = useState<MedicalProvider | undefined>(undefined);

  // HIPAA Consent
  const [hipaaConsent, setHipaaConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);

  // Modal states
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showFamilyMedicalHistoryModal, setShowFamilyMedicalHistoryModal] = useState(false);
  const [showHipaaModal, setShowHipaaModal] = useState(false);

  // Modal state for forms
  const [newAllergen, setNewAllergen] = useState('');
  const [newAllergyType, setNewAllergyType] = useState<AllergyType>('ige');
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDosage, setNewMedicationDosage] = useState('');
  const [newMedicationFrequency, setNewMedicationFrequency] = useState('');
  const [newFamilyCondition, setNewFamilyCondition] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('mother');
  const [newFamilyAgeOfOnset, setNewFamilyAgeOfOnset] = useState('');
  const [newFamilyNotes, setNewFamilyNotes] = useState('');
  const [newFamilyIsHereditary, setNewFamilyIsHereditary] = useState(true);

  // Validation
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateCurrentStep = (): boolean => {
    const newErrors: ValidationError[] = [];

    switch (currentStep) {
      case 1: // Basic Information
        
        if (!firstName.trim()) {
          newErrors.push({ field: 'firstName', message: 'First name is required' });
        }
        if (!lastName.trim()) {
          newErrors.push({ field: 'lastName', message: 'Last name is required' });
        }
        if (!dateOfBirth) {
          newErrors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
        } else {
          const today = new Date();
          const birthDate = new Date(dateOfBirth);
          if (birthDate > today) {
            newErrors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
          }
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age >= 18) {
            newErrors.push({ field: 'dateOfBirth', message: 'Child must be under 18 years old' });
          }
        }
        break;

      case 2: // Medical Information (optional, but validate if provided)
        
        allergies.forEach((allergy, index) => {
          if (!allergy.allergen.trim()) {
            newErrors.push({ field: `allergy_${index}`, message: 'Allergen name is required' });
          }
        });
        medications.forEach((medication, index) => {
          if (!medication.name.trim()) {
            newErrors.push({ field: `medication_${index}`, message: 'Medication name is required' });
          }
          if (!medication.dosage.trim()) {
            newErrors.push({ field: `medication_${index}_dosage`, message: 'Dosage is required' });
          }
        });
        break;

      case 3: // Emergency Contacts
        
        if (emergencyContacts.length === 0 || !emergencyContacts[0].name.trim()) {
          newErrors.push({ field: 'emergencyContact', message: 'At least one emergency contact is required' });
        }
        emergencyContacts.forEach((contact, index) => {
          if (contact.name.trim() && !contact.phone_primary.trim()) {
            newErrors.push({ field: `contact_${index}_phone`, message: 'Primary phone is required' });
          }
        });
        break;

      case 4: // HIPAA Consent
        
        if (!hipaaConsent) {
          newErrors.push({ field: 'hipaaConsent', message: 'HIPAA consent is required' });
        }
        if (!dataProcessingConsent) {
          newErrors.push({ field: 'dataProcessingConsent', message: 'Data processing consent is required' });
        }
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    console.log('handleNext - Step:', currentStep, 'of', totalSteps);
    
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        console.log('Final step - calling handleSubmit');
        handleSubmit();
      }
    } else {
      Alert.alert('Validation Error', 'Please check all required fields before proceeding.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('Creating profile...');
    
    if (!validateCurrentStep()) {
      Alert.alert('Validation Failed', 'Please check all required fields');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to create a profile.');
      return;
    }

    setLoading(true);

    try {
      // Clean family medical history entries to remove undefined values
      const cleanFamilyMedicalHistory = familyMedicalHistory
        .filter(h => h.condition.trim())
        .map(history => {
          const cleanEntry: any = {};
          if (history.condition) cleanEntry.condition = history.condition;
          if (history.relation) cleanEntry.relation = history.relation;
          if (history.age_of_onset !== undefined) cleanEntry.age_of_onset = history.age_of_onset;
          if (history.notes !== undefined) cleanEntry.notes = history.notes;
          if (history.is_hereditary !== undefined) cleanEntry.is_hereditary = history.is_hereditary;
          return cleanEntry as FamilyMedicalHistoryInfo;
        });

      const childData: CreateChildRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth,
        gender,
        known_allergies: allergies.filter(a => a.allergen.trim()),
        current_medications: medications.filter(m => m.name.trim()),
        allergic_reactions: [], // Can be added later via EditChild screen
        medical_conditions: medicalConditions.filter(c => c.trim()),
        medical_notes: medicalNotes.trim() || undefined,
        family_medical_history: cleanFamilyMedicalHistory.length > 0 ? cleanFamilyMedicalHistory : undefined,
        emergency_contacts: emergencyContacts.filter(c => c.name.trim()),
        primary_doctor: primaryDoctor
      };

      console.log('Creating profile for:', childData.first_name, childData.last_name);
      
      const response = await firebaseService.createChildProfile(childData);
      console.log('Profile created successfully!');

      console.log('About to show success alert...');
      
      // Success handler function
      const handleSuccess = () => {
        console.log('Success handler called');
        console.log('Calling onProfileAdded callback...');
        route?.params?.onProfileAdded?.();
        console.log('Navigating back...');
        navigation.goBack();
      };
      
      // For web compatibility, try both Alert and a simple timeout
      if (Platform.OS === 'web') {
        console.log('Running on web - using native alert and timeout');
        
        // Show native browser alert
        alert(`${response.first_name}'s profile has been created successfully!`);
        
        // Execute success handler
        handleSuccess();
      } else {
        // Use React Native Alert
        Alert.alert(
          'Success',
          `${response.first_name}'s profile has been created successfully!`,
          [
            {
              text: 'OK',
              onPress: handleSuccess
            }
          ]
        );
      }
      console.log('Alert handling completed');

    } catch (error) {
      console.error('Failed to create profile:', error);
      
      Alert.alert(
        'Error',
        `Failed to create profile: ${error.message || 'Unknown error'}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const addAllergy = (allergen: string, allergyType: AllergyType = 'ige') => {
    const newAllergy: AllergyInfo = {
      allergen,
      allergy_type: allergyType,
      reaction_type: [],
      verified_by_doctor: false
    };
    setAllergies([...allergies, newAllergy]);
    setShowAllergyModal(false);
  };

  const addMedication = (name: string, dosage: string, frequency: string) => {
    const newMedication: MedicationInfo = {
      name,
      dosage,
      frequency,
      side_effects: [],
      active: true
    };
    setMedications([...medications, newMedication]);
    setShowMedicationModal(false);
  };

  const addFamilyMedicalHistory = (condition: string, relation: string, ageOfOnset?: number, notes?: string, isHereditary?: boolean) => {
    const newFamilyHistory: FamilyMedicalHistoryInfo = {
      condition,
      relation,
      age_of_onset: ageOfOnset,
      notes,
      is_hereditary: isHereditary
    };
    setFamilyMedicalHistory([...familyMedicalHistory, newFamilyHistory]);
    setShowFamilyMedicalHistoryModal(false);
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: '', relationship: '', phone_primary: '', phone_secondary: '', email: '' }
    ]);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const resetAllergyForm = () => {
    setNewAllergen('');
    setNewAllergyType('ige');
  };

  const resetMedicationForm = () => {
    setNewMedicationName('');
    setNewMedicationDosage('');
    setNewMedicationFrequency('');
  };

  const resetFamilyMedicalHistoryForm = () => {
    setNewFamilyCondition('');
    setNewFamilyRelation('mother');
    setNewFamilyAgeOfOnset('');
    setNewFamilyNotes('');
    setNewFamilyIsHereditary(true);
  };

  const handleAddAllergy = () => {
    console.log('handleAddAllergy called with:', newAllergen, newAllergyType);
    if (newAllergen.trim()) {
      addAllergy(newAllergen.trim(), newAllergyType);
      resetAllergyForm();
    } else {
      Alert.alert('Error', 'Please enter an allergen name');
    }
  };

  const handleAddMedication = () => {
    console.log('handleAddMedication called with:', newMedicationName, newMedicationDosage, newMedicationFrequency);
    if (newMedicationName.trim() && newMedicationDosage.trim() && newMedicationFrequency.trim()) {
      addMedication(newMedicationName.trim(), newMedicationDosage.trim(), newMedicationFrequency.trim());
      resetMedicationForm();
    } else {
      Alert.alert('Error', 'Please fill in all medication fields (name, dosage, and frequency)');
    }
  };

  const handleAddFamilyMedicalHistory = () => {
    console.log('handleAddFamilyMedicalHistory called with:', newFamilyCondition, newFamilyRelation);
    if (newFamilyCondition.trim() && newFamilyRelation.trim()) {
      const ageOfOnset = newFamilyAgeOfOnset ? parseInt(newFamilyAgeOfOnset) : undefined;
      addFamilyMedicalHistory(
        newFamilyCondition.trim(),
        newFamilyRelation,
        ageOfOnset,
        newFamilyNotes.trim() || undefined,
        newFamilyIsHereditary
      );
      resetFamilyMedicalHistoryForm();
    } else {
      Alert.alert('Error', 'Please enter a condition and select a family relation');
    }
  };

  const renderAllergyModal = () => (
    <Modal
      visible={showAllergyModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAllergyModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAllergyModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Allergy</Text>
          <TouchableOpacity onPress={handleAddAllergy}>
            <Text style={styles.modalSaveText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allergen *</Text>
            <TextInput
              style={styles.input}
              value={newAllergen}
              onChangeText={setNewAllergen}
              placeholder="e.g., Peanuts, Pollen, Dust"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Allergy Type</Text>
            <View style={styles.genderContainer}>
              {(['ige', 'non_ige'] as AllergyType[]).map((allergyType) => (
                <TouchableOpacity
                  key={allergyType}
                  style={[
                    styles.genderOption,
                    newAllergyType === allergyType && styles.genderOptionSelected
                  ]}
                  onPress={() => setNewAllergyType(allergyType)}
                >
                  <Text style={[
                    styles.genderOptionText,
                    newAllergyType === allergyType && styles.genderOptionTextSelected
                  ]}>
                    {allergyType === 'ige' ? 'IgE-mediated (Immediate)' : 'Non-IgE (Delayed)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Common Allergens</Text>
            <View style={styles.commonItemsContainer}>
              {COMMON_ALLERGENS.map((allergen) => (
                <TouchableOpacity
                  key={allergen}
                  style={styles.commonItemButton}
                  onPress={() => setNewAllergen(allergen)}
                >
                  <Text style={styles.commonItemText}>{allergen}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderMedicationModal = () => (
    <Modal
      visible={showMedicationModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMedicationModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowMedicationModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Medication</Text>
          <TouchableOpacity onPress={handleAddMedication}>
            <Text style={styles.modalSaveText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              value={newMedicationName}
              onChangeText={setNewMedicationName}
              placeholder="e.g., Albuterol, EpiPen"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              value={newMedicationDosage}
              onChangeText={setNewMedicationDosage}
              placeholder="e.g., 2 puffs, 0.3mg"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frequency *</Text>
            <TextInput
              style={styles.input}
              value={newMedicationFrequency}
              onChangeText={setNewMedicationFrequency}
              placeholder="e.g., as needed, twice daily"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderFamilyMedicalHistoryModal = () => (
    <Modal
      visible={showFamilyMedicalHistoryModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFamilyMedicalHistoryModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFamilyMedicalHistoryModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Family Medical History</Text>
          <TouchableOpacity onPress={handleAddFamilyMedicalHistory}>
            <Text style={styles.modalSaveText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medical Condition *</Text>
            <TextInput
              style={styles.input}
              value={newFamilyCondition}
              onChangeText={setNewFamilyCondition}
              placeholder="e.g., Allergies, Asthma, Diabetes"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Family Relation *</Text>
            <View style={styles.genderContainer}>
              {FAMILY_RELATIONS.map((relation) => (
                <TouchableOpacity
                  key={relation}
                  style={[
                    styles.genderOption,
                    newFamilyRelation === relation && styles.genderOptionSelected
                  ]}
                  onPress={() => setNewFamilyRelation(relation)}
                >
                  <Text style={[
                    styles.genderOptionText,
                    newFamilyRelation === relation && styles.genderOptionTextSelected
                  ]}>
                    {relation.charAt(0).toUpperCase() + relation.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age of Onset (optional)</Text>
            <TextInput
              style={styles.input}
              value={newFamilyAgeOfOnset}
              onChangeText={setNewFamilyAgeOfOnset}
              placeholder="e.g., 25"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newFamilyNotes}
              onChangeText={setNewFamilyNotes}
              placeholder="Any additional details..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                newFamilyIsHereditary && styles.genderOptionSelected
              ]}
              onPress={() => setNewFamilyIsHereditary(!newFamilyIsHereditary)}
            >
              <Text style={[
                styles.genderOptionText,
                newFamilyIsHereditary && styles.genderOptionTextSelected
              ]}>
                {newFamilyIsHereditary ? '✓ ' : ''}Hereditary condition
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Common Hereditary Conditions</Text>
            <View style={styles.commonItemsContainer}>
              {COMMON_HEREDITARY_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={styles.commonItemButton}
                  onPress={() => setNewFamilyCondition(condition)}
                >
                  <Text style={styles.commonItemText}>{condition}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderHipaaModal = () => (
    <Modal
      visible={showHipaaModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowHipaaModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowHipaaModal(false)}>
            <Text style={styles.modalCancelText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Privacy Notice</Text>
          <View style={{width: 50}} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.hipaaText}>
            <Text style={styles.hippaBold}>HIPAA Privacy Notice{'\n\n'}</Text>
            
            This application is designed to help you track and manage your child's allergy information. We take the privacy and security of your health information very seriously.
            {'\n\n'}
            
            <Text style={styles.hippaBold}>Information We Collect:{'\n'}</Text>
            • Child's basic information (name, date of birth){'\n'}
            • Medical information (allergies, medications, symptoms){'\n'}
            • Emergency contact information{'\n'}
            • Symptom tracking data{'\n\n'}
            
            <Text style={styles.hippaBold}>How We Use This Information:{'\n'}</Text>
            • To help you track and manage allergy symptoms{'\n'}
            • To provide personalized allergen alerts{'\n'}
            • To maintain emergency contact accessibility{'\n'}
            • To generate health reports for medical providers{'\n\n'}
            
            <Text style={styles.hippaBold}>Data Security:{'\n'}</Text>
            • All data is encrypted in transit and at rest{'\n'}
            • Access is limited to authorized personnel only{'\n'}
            • Regular security audits and monitoring{'\n'}
            • Compliance with HIPAA security standards{'\n\n'}
            
            <Text style={styles.hippaBold}>Your Rights:{'\n'}</Text>
            • Access and review your child's information{'\n'}
            • Request corrections to inaccurate data{'\n'}
            • Request deletion of data (subject to legal requirements){'\n'}
            • Receive a copy of this privacy notice{'\n\n'}
            
            By using this application, you acknowledge that you have read and understand this privacy notice.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );

  const getErrorForField = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const renderBasicInformation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.input, getErrorForField('firstName') && styles.inputError]}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
        />
        {getErrorForField('firstName') && (
          <Text style={styles.errorText}>{getErrorForField('firstName')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={[styles.input, getErrorForField('lastName') && styles.inputError]}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
        />
        {getErrorForField('lastName') && (
          <Text style={styles.errorText}>{getErrorForField('lastName')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, getErrorForField('dateOfBirth') && styles.inputError]}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="2020-01-01"
        />
        {getErrorForField('dateOfBirth') && (
          <Text style={styles.errorText}>{getErrorForField('dateOfBirth')}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          {[
            { label: 'Prefer not to say', value: 'prefer_not_to_say' },
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderOption,
                gender === option.value && styles.genderOptionSelected
              ]}
              onPress={() => setGender(option.value as GenderType)}
            >
              <Text style={[
                styles.genderOptionText,
                gender === option.value && styles.genderOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderMedicalInformation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical Information</Text>
      <Text style={styles.subtitle}>This information helps track allergic reactions and symptoms</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Known Allergies</Text>
        {allergies.map((allergy, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>
              {allergy.allergen} ({allergy.allergy_type === 'ige' ? 'IgE-mediated' : 'Non-IgE'})
            </Text>
            <TouchableOpacity onPress={() => setAllergies(allergies.filter((_, i) => i !== index))}>
              <Ionicons name="close-circle" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setShowAllergyModal(true);
        }}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Allergy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Medications</Text>
        {medications.map((medication, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>{medication.name} - {medication.dosage}</Text>
            <TouchableOpacity onPress={() => setMedications(medications.filter((_, i) => i !== index))}>
              <Ionicons name="close-circle" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setShowMedicationModal(true);
        }}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Medication</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Medical History</Text>
        {familyMedicalHistory.map((history, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.familyHistoryItem}>
              <Text style={styles.listItemText}>
                {history.condition} ({history.relation})
                {history.is_hereditary && <Text style={styles.hereditaryBadge}> • Hereditary</Text>}
              </Text>
              {history.age_of_onset && (
                <Text style={styles.ageOfOnsetText}>Age of onset: {history.age_of_onset}</Text>
              )}
              {history.notes && (
                <Text style={styles.notesText}>{history.notes}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setFamilyMedicalHistory(familyMedicalHistory.filter((_, i) => i !== index))}>
              <Ionicons name="close-circle" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setShowFamilyMedicalHistoryModal(true);
        }}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Family Medical History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Additional Medical Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={medicalNotes}
          onChangeText={setMedicalNotes}
          placeholder="Any additional medical information..."
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderEmergencyContacts = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>At least one emergency contact is required</Text>

      {emergencyContacts.map((contact, index) => (
        <View key={index} style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Contact {String(index + 1)}</Text>
            {index > 0 && (
              <TouchableOpacity onPress={() => removeEmergencyContact(index)}>
                <Ionicons name="trash" size={20} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.input}
            value={contact.name}
            onChangeText={(text) => {
              const updated = [...emergencyContacts];
              updated[index].name = text;
              setEmergencyContacts(updated);
            }}
            placeholder="Full name"
          />

          <TextInput
            style={styles.input}
            value={contact.relationship}
            onChangeText={(text) => {
              const updated = [...emergencyContacts];
              updated[index].relationship = text;
              setEmergencyContacts(updated);
            }}
            placeholder="Relationship (e.g., Mother, Father)"
          />

          <TextInput
            style={styles.input}
            value={contact.phone_primary}
            onChangeText={(text) => {
              const updated = [...emergencyContacts];
              updated[index].phone_primary = text;
              setEmergencyContacts(updated);
            }}
            placeholder="Primary phone number"
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            value={contact.phone_secondary || ''}
            onChangeText={(text) => {
              const updated = [...emergencyContacts];
              updated[index].phone_secondary = text;
              setEmergencyContacts(updated);
            }}
            placeholder="Secondary phone (optional)"
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            value={contact.email || ''}
            onChangeText={(text) => {
              const updated = [...emergencyContacts];
              updated[index].email = text;
              setEmergencyContacts(updated);
            }}
            placeholder="Email (optional)"
            keyboardType="email-address"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addEmergencyContact}>
        <Ionicons name="add" size={20} color="#007AFF" />
        <Text style={styles.addButtonText}>Add Another Contact</Text>
      </TouchableOpacity>

      {getErrorForField('emergencyContact') && (
        <Text style={styles.errorText}>{getErrorForField('emergencyContact')}</Text>
      )}
    </View>
  );

  const renderHIPAAConsent = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Privacy & Consent</Text>
      <Text style={styles.subtitle}>Please review and accept the privacy terms</Text>

      <View style={styles.consentSection}>
        <View style={styles.consentItem}>
          <Switch
            value={hipaaConsent}
            onValueChange={setHipaaConsent}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={hipaaConsent ? '#007AFF' : '#f4f3f4'}
          />
          <View style={styles.consentText}>
            <Text style={styles.consentTitle}>HIPAA Authorization *</Text>
            <Text style={styles.consentDescription}>
              I authorize the secure storage and processing of my child's protected health information (PHI) 
              in accordance with HIPAA regulations.
            </Text>
            <TouchableOpacity onPress={() => setShowHipaaModal(true)}>
              <Text style={styles.linkText}>Read full HIPAA notice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {getErrorForField('hipaaConsent') && (
          <Text style={styles.errorText}>{getErrorForField('hipaaConsent')}</Text>
        )}

        <View style={styles.consentItem}>
          <Switch
            value={dataProcessingConsent}
            onValueChange={setDataProcessingConsent}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={dataProcessingConsent ? '#007AFF' : '#f4f3f4'}
          />
          <View style={styles.consentText}>
            <Text style={styles.consentTitle}>Data Processing Consent *</Text>
            <Text style={styles.consentDescription}>
              I consent to the processing of my child's health data for symptom tracking, 
              analysis, and generating health insights.
            </Text>
          </View>
        </View>

        {getErrorForField('dataProcessingConsent') && (
          <Text style={styles.errorText}>{getErrorForField('dataProcessingConsent')}</Text>
        )}
      </View>

      <View style={styles.dataSecurityInfo}>
        <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
        <Text style={styles.dataSecurityText}>
          Your child's data is encrypted and stored securely in compliance with HIPAA regulations. Only you have access to this information.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderBasicInformation();
      case 2: return renderMedicalInformation();
      case 3: return renderEmergencyContacts();
      case 4: return renderHIPAAConsent();
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Profile</Text>
        <View style={styles.headerRight}></View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.disabledButton]} 
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps ? (loading ? 'Creating...' : 'Create Profile') : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderAllergyModal()}
      {renderMedicationModal()}
      {renderFamilyMedicalHistoryModal()}
      {renderHipaaModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 24,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e1e1e1',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  contactCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  consentSection: {
    marginBottom: 24,
  },
  consentItem: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  consentText: {
    flex: 1,
    marginLeft: 12,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  consentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  dataSecurityInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  dataSecurityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#ff4444',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  commonItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  commonItemButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  commonItemText: {
    fontSize: 14,
    color: '#2196F3',
  },
  hipaaText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  hippaBold: {
    fontWeight: 'bold',
  },
  familyHistoryItem: {
    flex: 1,
  },
  hereditaryBadge: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: '600',
  },
  ageOfOnsetText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
