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
  AllergyType,
  FamilyMedicalHistoryInfo,
  AllergicReactionEntry,
  SeverityType,
  COMMON_ALLERGENS,
  COMMON_SYMPTOMS,
  FAMILY_RELATIONS,
  COMMON_HEREDITARY_CONDITIONS,
  ALLERGIC_REACTION_SYMPTOMS,
  ALLERGIC_REACTION_TREATMENTS
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
  const [allergicReactions, setAllergicReactions] = useState<AllergicReactionEntry[]>([]);
  const [familyMedicalHistory, setFamilyMedicalHistory] = useState<FamilyMedicalHistoryInfo[]>([]);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [notes, setNotes] = useState('');

  // Modal states
  const [allergyModalVisible, setAllergyModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [allergicReactionModalVisible, setAllergicReactionModalVisible] = useState(false);
  const [familyMedicalHistoryModalVisible, setFamilyMedicalHistoryModalVisible] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');
  const [newAllergyType, setNewAllergyType] = useState<AllergyType>('ige');
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDosage, setNewMedicationDosage] = useState('');
  const [newMedicationFrequency, setNewMedicationFrequency] = useState('');
  const [newReactionDate, setNewReactionDate] = useState('');
  const [newReactionTime, setNewReactionTime] = useState('');
  const [newReactionAllergen, setNewReactionAllergen] = useState('');
  const [newReactionSymptoms, setNewReactionSymptoms] = useState<string[]>([]);
  const [newReactionSeverity, setNewReactionSeverity] = useState<SeverityType>('mild');
  const [newReactionTreatment, setNewReactionTreatment] = useState<string[]>([]);
  const [newReactionLocation, setNewReactionLocation] = useState('');
  const [newReactionProvider, setNewReactionProvider] = useState('');
  const [newReactionNotes, setNewReactionNotes] = useState('');
  const [newFamilyCondition, setNewFamilyCondition] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('');
  const [newFamilyAgeOfOnset, setNewFamilyAgeOfOnset] = useState('');
  const [newFamilyNotes, setNewFamilyNotes] = useState('');
  const [newFamilyIsHereditary, setNewFamilyIsHereditary] = useState(false);

  // Edit mode states
  const [editingAllergyIndex, setEditingAllergyIndex] = useState<number | null>(null);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);
  const [editingAllergicReactionIndex, setEditingAllergicReactionIndex] = useState<number | null>(null);
  const [editingFamilyHistoryIndex, setEditingFamilyHistoryIndex] = useState<number | null>(null);

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
      setAllergicReactions(childData.allergic_reactions || []);
      setFamilyMedicalHistory(childData.family_medical_history || []);
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
      
      // Clean family medical history entries to remove undefined values
      const cleanFamilyMedicalHistory = familyMedicalHistory.map(history => {
        const cleanEntry: any = {};
        if (history.condition) cleanEntry.condition = history.condition;
        if (history.relation) cleanEntry.relation = history.relation;
        if (history.age_of_onset !== undefined) cleanEntry.age_of_onset = history.age_of_onset;
        if (history.notes !== undefined) cleanEntry.notes = history.notes;
        if (history.is_hereditary !== undefined) cleanEntry.is_hereditary = history.is_hereditary;
        return cleanEntry as FamilyMedicalHistoryInfo;
      });

      // Clean allergic reactions entries to remove undefined values
      const cleanAllergicReactions = allergicReactions.map(reaction => {
        const cleanEntry: any = {};
        if (reaction.date) cleanEntry.date = reaction.date;
        if (reaction.time !== undefined) cleanEntry.time = reaction.time;
        if (reaction.allergen) cleanEntry.allergen = reaction.allergen;
        if (reaction.symptoms) cleanEntry.symptoms = reaction.symptoms;
        if (reaction.severity) cleanEntry.severity = reaction.severity;
        if (reaction.treatment_given) cleanEntry.treatment_given = reaction.treatment_given;
        if (reaction.location !== undefined) cleanEntry.location = reaction.location;
        if (reaction.healthcare_provider !== undefined) cleanEntry.healthcare_provider = reaction.healthcare_provider;
        if (reaction.notes !== undefined) cleanEntry.notes = reaction.notes;
        if (reaction.resolved_date !== undefined) cleanEntry.resolved_date = reaction.resolved_date;
        if (reaction.follow_up_required !== undefined) cleanEntry.follow_up_required = reaction.follow_up_required;
        return cleanEntry as AllergicReactionEntry;
      });
      
      const updateData: Partial<ChildProfile> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth,
        gender: gender,
        known_allergies: allergies,
        current_medications: medications,
        allergic_reactions: cleanAllergicReactions,
        family_medical_history: cleanFamilyMedicalHistory,
        medical_notes: medicalHistory.trim(),
      };

      // Remove undefined values to prevent Firebase errors
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      ) as Partial<ChildProfile>;

      await firebaseService.updateChildProfile(childId, cleanUpdateData);
      
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

    const allergyData: AllergyInfo = {
      allergen: newAllergyName.trim(),
      allergy_type: newAllergyType,
      reaction_type: [],
      notes: '',
      verified_by_doctor: false
    };

    if (editingAllergyIndex !== null) {
      // Edit existing allergy
      const updatedAllergies = [...allergies];
      updatedAllergies[editingAllergyIndex] = {
        ...updatedAllergies[editingAllergyIndex],
        ...allergyData
      };
      setAllergies(updatedAllergies);
    } else {
      // Add new allergy
      setAllergies([...allergies, allergyData]);
    }

    // Reset form
    setNewAllergyName('');
    setNewAllergyType('ige');
    setEditingAllergyIndex(null);
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

    const medicationData: MedicationInfo = {
      name: newMedicationName.trim(),
      dosage: newMedicationDosage.trim(),
      frequency: newMedicationFrequency.trim(),
      start_date: new Date().toISOString().split('T')[0],
      active: true,
      side_effects: [],
      notes: ''
    };

    if (editingMedicationIndex !== null) {
      // Edit existing medication
      const updatedMedications = [...medications];
      updatedMedications[editingMedicationIndex] = {
        ...updatedMedications[editingMedicationIndex],
        ...medicationData
      };
      setMedications(updatedMedications);
    } else {
      // Add new medication
      setMedications([...medications, medicationData]);
    }

    // Reset form
    setNewMedicationName('');
    setNewMedicationDosage('');
    setNewMedicationFrequency('');
    setEditingMedicationIndex(null);
    setMedicationModalVisible(false);
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = medications.filter((_, i) => i !== index);
    setMedications(updatedMedications);
  };

  const handleEditAllergy = (index: number) => {
    const allergy = allergies[index];
    setNewAllergyName(allergy.allergen);
    setNewAllergyType(allergy.allergy_type);
    setEditingAllergyIndex(index);
    setAllergyModalVisible(true);
  };

  const handleEditMedication = (index: number) => {
    const medication = medications[index];
    setNewMedicationName(medication.name);
    setNewMedicationDosage(medication.dosage);
    setNewMedicationFrequency(medication.frequency);
    setEditingMedicationIndex(index);
    setMedicationModalVisible(true);
  };

  const handleAddNewAllergy = () => {
    setNewAllergyName('');
    setNewAllergyType('ige');
    setEditingAllergyIndex(null);
    setAllergyModalVisible(true);
  };

  const handleAddNewMedication = () => {
    setNewMedicationName('');
    setNewMedicationDosage('');
    setNewMedicationFrequency('');
    setEditingMedicationIndex(null);
    setMedicationModalVisible(true);
  };

  const handleAddFamilyMedicalHistory = () => {
    if (!newFamilyCondition.trim() || !newFamilyRelation.trim()) {
      Alert.alert('Validation Error', 'Please enter a condition and select a family relation');
      return;
    }

    const familyHistoryData: FamilyMedicalHistoryInfo = {
      condition: newFamilyCondition.trim(),
      relation: newFamilyRelation,
      age_of_onset: newFamilyAgeOfOnset ? parseInt(newFamilyAgeOfOnset) : undefined,
      notes: newFamilyNotes.trim() || undefined,
      is_hereditary: newFamilyIsHereditary
    };

    if (editingFamilyHistoryIndex !== null) {
      // Edit existing family history
      const updatedFamilyHistory = [...familyMedicalHistory];
      updatedFamilyHistory[editingFamilyHistoryIndex] = familyHistoryData;
      setFamilyMedicalHistory(updatedFamilyHistory);
    } else {
      // Add new family history
      setFamilyMedicalHistory([...familyMedicalHistory, familyHistoryData]);
    }

    // Reset form
    setNewFamilyCondition('');
    setNewFamilyRelation('');
    setNewFamilyAgeOfOnset('');
    setNewFamilyNotes('');
    setNewFamilyIsHereditary(false);
    setEditingFamilyHistoryIndex(null);
    setFamilyMedicalHistoryModalVisible(false);
  };

  const handleRemoveFamilyMedicalHistory = (index: number) => {
    const updatedFamilyHistory = familyMedicalHistory.filter((_, i) => i !== index);
    setFamilyMedicalHistory(updatedFamilyHistory);
  };

  const handleEditFamilyMedicalHistory = (index: number) => {
    const familyHistory = familyMedicalHistory[index];
    setNewFamilyCondition(familyHistory.condition);
    setNewFamilyRelation(familyHistory.relation);
    setNewFamilyAgeOfOnset(familyHistory.age_of_onset?.toString() || '');
    setNewFamilyNotes(familyHistory.notes || '');
    setNewFamilyIsHereditary(familyHistory.is_hereditary);
    setEditingFamilyHistoryIndex(index);
    setFamilyMedicalHistoryModalVisible(true);
  };

  const handleAddNewFamilyMedicalHistory = () => {
    setNewFamilyCondition('');
    setNewFamilyRelation('');
    setNewFamilyAgeOfOnset('');
    setNewFamilyNotes('');
    setNewFamilyIsHereditary(false);
    setEditingFamilyHistoryIndex(null);
    setFamilyMedicalHistoryModalVisible(true);
  };

  const handleAddAllergicReaction = () => {
    if (!newReactionDate.trim() || !newReactionAllergen.trim()) {
      Alert.alert('Validation Error', 'Please enter a date and allergen for the reaction');
      return;
    }

    const reactionData: AllergicReactionEntry = {
      date: newReactionDate.trim(),
      time: newReactionTime.trim() || undefined,
      allergen: newReactionAllergen.trim(),
      symptoms: newReactionSymptoms,
      severity: newReactionSeverity,
      treatment_given: newReactionTreatment,
      location: newReactionLocation.trim() || undefined,
      healthcare_provider: newReactionProvider.trim() || undefined,
      notes: newReactionNotes.trim() || undefined
    };

    if (editingAllergicReactionIndex !== null) {
      // Edit existing reaction
      const updatedReactions = [...allergicReactions];
      updatedReactions[editingAllergicReactionIndex] = reactionData;
      setAllergicReactions(updatedReactions);
    } else {
      // Add new reaction
      setAllergicReactions([...allergicReactions, reactionData]);
    }

    // Reset form
    setNewReactionDate('');
    setNewReactionTime('');
    setNewReactionAllergen('');
    setNewReactionSymptoms([]);
    setNewReactionSeverity('mild');
    setNewReactionTreatment([]);
    setNewReactionLocation('');
    setNewReactionProvider('');
    setNewReactionNotes('');
    setEditingAllergicReactionIndex(null);
    setAllergicReactionModalVisible(false);
  };

  const handleRemoveAllergicReaction = (index: number) => {
    const updatedReactions = allergicReactions.filter((_, i) => i !== index);
    setAllergicReactions(updatedReactions);
  };

  const handleEditAllergicReaction = (index: number) => {
    const reaction = allergicReactions[index];
    setNewReactionDate(reaction.date);
    setNewReactionTime(reaction.time || '');
    setNewReactionAllergen(reaction.allergen);
    setNewReactionSymptoms(reaction.symptoms);
    setNewReactionSeverity(reaction.severity);
    setNewReactionTreatment(reaction.treatment_given);
    setNewReactionLocation(reaction.location || '');
    setNewReactionProvider(reaction.healthcare_provider || '');
    setNewReactionNotes(reaction.notes || '');
    setEditingAllergicReactionIndex(index);
    setAllergicReactionModalVisible(true);
  };

  const handleAddNewAllergicReaction = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    setNewReactionDate(today);
    setNewReactionTime('');
    setNewReactionAllergen('');
    setNewReactionSymptoms([]);
    setNewReactionSeverity('mild');
    setNewReactionTreatment([]);
    setNewReactionLocation('');
    setNewReactionProvider('');
    setNewReactionNotes('');
    setEditingAllergicReactionIndex(null);
    setAllergicReactionModalVisible(true);
  };

  const handleCancelAllergyModal = () => {
    setNewAllergyName('');
    setNewAllergyType('ige');
    setEditingAllergyIndex(null);
    setAllergyModalVisible(false);
  };

  const handleCancelMedicationModal = () => {
    setNewMedicationName('');
    setNewMedicationDosage('');
    setNewMedicationFrequency('');
    setEditingMedicationIndex(null);
    setMedicationModalVisible(false);
  };

  const handleCancelFamilyMedicalHistoryModal = () => {
    setNewFamilyCondition('');
    setNewFamilyRelation('');
    setNewFamilyAgeOfOnset('');
    setNewFamilyNotes('');
    setNewFamilyIsHereditary(false);
    setEditingFamilyHistoryIndex(null);
    setFamilyMedicalHistoryModalVisible(false);
  };

  const handleCancelAllergicReactionModal = () => {
    setNewReactionDate('');
    setNewReactionTime('');
    setNewReactionAllergen('');
    setNewReactionSymptoms([]);
    setNewReactionSeverity('mild');
    setNewReactionTreatment([]);
    setNewReactionLocation('');
    setNewReactionProvider('');
    setNewReactionNotes('');
    setEditingAllergicReactionIndex(null);
    setAllergicReactionModalVisible(false);
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
                  onPress={handleAddNewAllergy}
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
                        Type: {allergy.allergy_type === 'ige' ? 'IgE-mediated (Immediate)' : 'Non-IgE (Delayed)'}
                      </Text>
                    </View>
                    <View style={styles.listItemActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAllergy(index)}
                      >
                        <Ionicons name="pencil" size={18} color="#1976D2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveAllergy(index)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
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
                  onPress={handleAddNewMedication}
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
                    <View style={styles.listItemActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditMedication(index)}
                      >
                        <Ionicons name="pencil" size={18} color="#1976D2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveMedication(index)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Allergic Reactions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Previous Allergic Reactions</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddNewAllergicReaction}
                >
                  <Ionicons name="add" size={20} color="#1976D2" />
                </TouchableOpacity>
              </View>
              
              {allergicReactions.length === 0 ? (
                <Text style={styles.emptyText}>No allergic reactions recorded</Text>
              ) : (
                allergicReactions.map((reaction, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>
                        {reaction.allergen} - {reaction.date}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        Severity: {reaction.severity.charAt(0).toUpperCase() + reaction.severity.slice(1)}
                        {reaction.symptoms.length > 0 && ` • Symptoms: ${reaction.symptoms.slice(0, 2).join(', ')}${reaction.symptoms.length > 2 ? '...' : ''}`}
                      </Text>
                      {reaction.treatment_given.length > 0 && (
                        <Text style={styles.notesText}>
                          Treatment: {reaction.treatment_given.slice(0, 2).join(', ')}{reaction.treatment_given.length > 2 ? '...' : ''}
                        </Text>
                      )}
                      {reaction.notes && (
                        <Text style={styles.notesText}>{reaction.notes}</Text>
                      )}
                    </View>
                    <View style={styles.listItemActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAllergicReaction(index)}
                      >
                        <Ionicons name="pencil" size={18} color="#1976D2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveAllergicReaction(index)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Family Medical History Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Family Medical History</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddNewFamilyMedicalHistory}
                >
                  <Ionicons name="add" size={20} color="#1976D2" />
                </TouchableOpacity>
              </View>
              
              {familyMedicalHistory.length === 0 ? (
                <Text style={styles.emptyText}>No family medical history added</Text>
              ) : (
                familyMedicalHistory.map((history, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>
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
                    <View style={styles.listItemActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditFamilyMedicalHistory(index)}
                      >
                        <Ionicons name="pencil" size={18} color="#1976D2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveFamilyMedicalHistory(index)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
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
        onRequestClose={handleCancelAllergyModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCancelAllergyModal}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAllergyIndex !== null ? 'Edit Allergy' : 'Add Allergy'}
            </Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleAddAllergy}
            >
              <Text style={styles.modalSaveText}>
                {editingAllergyIndex !== null ? 'Save' : 'Add'}
              </Text>
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
              <Text style={styles.label}>Allergy Type</Text>
              <View style={styles.severityContainer}>
                {(['ige', 'non_ige'] as AllergyType[]).map((allergyTypeOption) => (
                  <TouchableOpacity
                    key={allergyTypeOption}
                    style={[
                      styles.severityOption,
                      newAllergyType === allergyTypeOption && styles.severityOptionSelected
                    ]}
                    onPress={() => setNewAllergyType(allergyTypeOption)}
                  >
                    <Text style={[
                      styles.severityText,
                      newAllergyType === allergyTypeOption && styles.severityTextSelected
                    ]}>
                      {allergyTypeOption === 'ige' ? 'IgE-mediated (Immediate)' : 'Non-IgE (Delayed)'}
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
        onRequestClose={handleCancelMedicationModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCancelMedicationModal}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingMedicationIndex !== null ? 'Edit Medication' : 'Add Medication'}
            </Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleAddMedication}
            >
              <Text style={styles.modalSaveText}>
                {editingMedicationIndex !== null ? 'Save' : 'Add'}
              </Text>
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

      {/* Allergic Reaction Modal */}
      <Modal
        visible={allergicReactionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelAllergicReactionModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCancelAllergicReactionModal}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {editingAllergicReactionIndex !== null ? 'Edit Allergic Reaction' : 'Add Allergic Reaction'}
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddAllergicReaction}
            >
              <Text style={styles.modalSaveText}>
                {editingAllergicReactionIndex !== null ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                value={newReactionDate}
                onChangeText={setNewReactionDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time (optional)</Text>
              <TextInput
                style={styles.input}
                value={newReactionTime}
                onChangeText={setNewReactionTime}
                placeholder="HH:MM"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allergen *</Text>
              <TextInput
                style={styles.input}
                value={newReactionAllergen}
                onChangeText={setNewReactionAllergen}
                placeholder="What caused the reaction?"
                placeholderTextColor="#999999"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Severity</Text>
              <View style={styles.optionsContainer}>
                {(['none', 'mild', 'moderate', 'severe', 'critical'] as SeverityType[]).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.option,
                      newReactionSeverity === severity && styles.optionSelected
                    ]}
                    onPress={() => setNewReactionSeverity(severity)}
                  >
                    <Text style={[
                      styles.optionText,
                      newReactionSeverity === severity && styles.optionTextSelected
                    ]}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Symptoms</Text>
              <View style={styles.optionsContainer}>
                {ALLERGIC_REACTION_SYMPTOMS.map((symptom) => (
                  <TouchableOpacity
                    key={symptom}
                    style={[
                      styles.commonItemButton,
                      newReactionSymptoms.includes(symptom) && styles.optionSelected
                    ]}
                    onPress={() => {
                      if (newReactionSymptoms.includes(symptom)) {
                        setNewReactionSymptoms(newReactionSymptoms.filter(s => s !== symptom));
                      } else {
                        setNewReactionSymptoms([...newReactionSymptoms, symptom]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.commonItemText,
                      newReactionSymptoms.includes(symptom) && styles.optionTextSelected
                    ]}>
                      {symptom.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Treatment Given</Text>
              <View style={styles.optionsContainer}>
                {ALLERGIC_REACTION_TREATMENTS.map((treatment) => (
                  <TouchableOpacity
                    key={treatment}
                    style={[
                      styles.commonItemButton,
                      newReactionTreatment.includes(treatment) && styles.optionSelected
                    ]}
                    onPress={() => {
                      if (newReactionTreatment.includes(treatment)) {
                        setNewReactionTreatment(newReactionTreatment.filter(t => t !== treatment));
                      } else {
                        setNewReactionTreatment([...newReactionTreatment, treatment]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.commonItemText,
                      newReactionTreatment.includes(treatment) && styles.optionTextSelected
                    ]}>
                      {treatment.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (optional)</Text>
              <TextInput
                style={styles.input}
                value={newReactionLocation}
                onChangeText={setNewReactionLocation}
                placeholder="Where did the reaction occur?"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Healthcare Provider (optional)</Text>
              <TextInput
                style={styles.input}
                value={newReactionProvider}
                onChangeText={setNewReactionProvider}
                placeholder="Doctor or hospital that treated"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newReactionNotes}
                onChangeText={setNewReactionNotes}
                placeholder="Any additional details about the reaction..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Family Medical History Modal */}
      <Modal
        visible={familyMedicalHistoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelFamilyMedicalHistoryModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCancelFamilyMedicalHistoryModal}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {editingFamilyHistoryIndex !== null ? 'Edit Family Medical History' : 'Add Family Medical History'}
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddFamilyMedicalHistory}
            >
              <Text style={styles.modalSaveText}>
                {editingFamilyHistoryIndex !== null ? 'Update' : 'Add'}
              </Text>
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
                placeholderTextColor="#999999"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Family Relation *</Text>
              <View style={styles.optionsContainer}>
                {FAMILY_RELATIONS.map((relation) => (
                  <TouchableOpacity
                    key={relation}
                    style={[
                      styles.option,
                      newFamilyRelation === relation && styles.optionSelected
                    ]}
                    onPress={() => setNewFamilyRelation(relation)}
                  >
                    <Text style={[
                      styles.optionText,
                      newFamilyRelation === relation && styles.optionTextSelected
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
                placeholderTextColor="#999999"
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
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={[
                  styles.option,
                  newFamilyIsHereditary && styles.optionSelected
                ]}
                onPress={() => setNewFamilyIsHereditary(!newFamilyIsHereditary)}
              >
                <Text style={[
                  styles.optionText,
                  newFamilyIsHereditary && styles.optionTextSelected
                ]}>
                  {newFamilyIsHereditary ? '✓ ' : ''}Hereditary condition
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Common Hereditary Conditions</Text>
              <View style={styles.optionsContainer}>
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
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '500',
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
});
