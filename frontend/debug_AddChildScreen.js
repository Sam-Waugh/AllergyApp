/**
 * Simple debug script to test the AddChildScreen functionality
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

export default function DebugAddChild() {
  const [step, setStep] = useState(1);
  
  const handleNext = () => {
    console.log('Debug: Next button pressed, current step:', step);
    Alert.alert('Debug', `Moving from step ${step} to ${step + 1}`);
    setStep(step + 1);
  };

  const handleBack = () => {
    console.log('Debug: Back button pressed, current step:', step);
    Alert.alert('Debug', `Moving from step ${step} to ${step - 1}`);
    setStep(step - 1);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Debug AddChild Screen</Text>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Current Step: {step}</Text>
      
      <TouchableOpacity 
        onPress={handleNext}
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>Next Step</Text>
      </TouchableOpacity>
      
      {step > 1 && (
        <TouchableOpacity 
          onPress={handleBack}
          style={{ backgroundColor: '#666', padding: 15, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Previous Step</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
