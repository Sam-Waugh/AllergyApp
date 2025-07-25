import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { firebaseService } from '../services/firebaseService';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

export default function FirestoreDebugScreen() {
  const debugFirestore = async () => {
    try {
      console.log('=== FIRESTORE DEBUG ===');
      
      // Check all photos
      const photosQuery = query(collection(firestore, 'photos'), limit(20));
      const photosSnapshot = await getDocs(photosQuery);
      console.log('Total photos found:', photosSnapshot.size);
      
      photosSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Photo ID:', doc.id);
        console.log('Photo data:', data);
        console.log('---');
      });
      
      // Check all children
      const childrenQuery = query(collection(firestore, 'children'), limit(10));
      const childrenSnapshot = await getDocs(childrenQuery);
      console.log('Total children found:', childrenSnapshot.size);
      
      childrenSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Child ID:', doc.id);
        console.log('Child name:', data.first_name, data.last_name);
        console.log('Child data:', data);
        console.log('---');
      });
      
      // Check daily logs
      const logsQuery = query(collection(firestore, 'daily_logs'), limit(10));
      const logsSnapshot = await getDocs(logsQuery);
      console.log('Total daily logs found:', logsSnapshot.size);
      
      logsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Log ID:', doc.id);
        console.log('Log child_id:', data.child_id);
        console.log('Log date:', data.date);
        console.log('---');
      });
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  useEffect(() => {
    debugFirestore();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Firestore Debug</Text>
      <Button title="Run Debug" onPress={debugFirestore} />
    </View>
  );
}
