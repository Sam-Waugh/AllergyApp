// frontend/src/components/ChildForm.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Child, ProfileForm } from '../models';

interface ChildFormProps {
  child?: Child | null;
  onSubmit: (childData: ProfileForm) => void;
  onCancel: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ child, onSubmit, onCancel }) => {
  const [name, setName] = useState(child?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(child?.dateOfBirth || '');
  const [allergies, setAllergies] = useState(child?.allergies?.join(', ') || '');
  const [medications, setMedications] = useState(child?.medications?.join(', ') || '');
  const [conditions, setConditions] = useState(child?.conditions?.join(', ') || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !dateOfBirth.trim()) {
      setError('Name and Date of Birth are required.');
      return;
    }
    // Basic date format validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        setError('Please enter the date in YYYY-MM-DD format.');
        return;
    }
    
    const formData: ProfileForm = {
      name: name.trim(),
      dateOfBirth: dateOfBirth.trim(),
      allergies: allergies.split(',').map(a => a.trim()).filter(a => a.length > 0),
      medications: medications.split(',').map(m => m.trim()).filter(m => m.length > 0),
      conditions: conditions.split(',').map(c => c.trim()).filter(c => c.length > 0),
    };
    
    onSubmit(formData);
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{child ? 'Edit Child' : 'Add New Child'}</Text>
      
      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter child's name"
      />
      
      <Text style={styles.label}>Date of Birth *</Text>
      <TextInput
        style={styles.input}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="YYYY-MM-DD"
      />
      
      <Text style={styles.label}>Allergies</Text>
      <TextInput
        style={styles.input}
        value={allergies}
        onChangeText={setAllergies}
        placeholder="Enter allergies separated by commas"
        multiline
      />
      
      <Text style={styles.label}>Medications</Text>
      <TextInput
        style={styles.input}
        value={medications}
        onChangeText={setMedications}
        placeholder="Enter medications separated by commas"
        multiline
      />
      
      <Text style={styles.label}>Conditions</Text>
      <TextInput
        style={styles.input}
        value={conditions}
        onChangeText={setConditions}
        placeholder="Enter conditions separated by commas"
        multiline
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{child ? 'Update' : 'Add Child'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#00A896',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default ChildForm;
