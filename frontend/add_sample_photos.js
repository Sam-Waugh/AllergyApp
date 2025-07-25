/**
 * Script to add sample photos to Firestore for testing
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase config (using the same from .env)
const firebaseConfig = {
  apiKey: "AIzaSyBeXcOPqEDNzYAXhHcXzkZRmUAmeDBY6XU",
  authDomain: "allergyapp-1a030.firebaseapp.com",
  projectId: "allergyapp-1a030",
  storageBucket: "allergyapp-1a030.firebasestorage.app",
  messagingSenderId: "683185921702",
  appId: "1:683185921702:web:5cfe5d040da7d482001e67"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function addSamplePhotos() {
  console.log('Adding sample photos to Firestore...');
  
  // Sample child ID - you'll need to replace with actual child ID from your Firestore
  const childId = 'sample_child_id_replace_me';
  
  const samplePhotos = [
    {
      child_id: childId,
      local_uri: 'file:///path/to/photo1.jpg',
      description: 'Hives on arm after eating peanuts',
      body_area: 'arm',
      severity_rating: 3,
      photo_type: 'symptom',
      tags: ['hives', 'peanut-reaction'],
      taken_at: new Date('2025-01-20T10:30:00Z').toISOString(),
      created_at: new Date().toISOString(),
      data_classification: 'PHI',
      storage_type: 'local'
    },
    {
      child_id: childId,
      local_uri: 'file:///path/to/photo2.jpg', 
      description: 'Facial swelling from dairy',
      body_area: 'face',
      severity_rating: 4,
      photo_type: 'symptom',
      tags: ['swelling', 'dairy-reaction'],
      taken_at: new Date('2025-01-18T15:45:00Z').toISOString(),
      created_at: new Date().toISOString(),
      data_classification: 'PHI',
      storage_type: 'local'
    },
    {
      child_id: childId,
      local_uri: 'file:///path/to/photo3.jpg',
      description: 'Skin rash on back',
      body_area: 'back',
      severity_rating: 2,
      photo_type: 'symptom',
      tags: ['rash', 'unknown-trigger'],
      taken_at: new Date('2025-01-15T09:20:00Z').toISOString(),
      created_at: new Date().toISOString(),
      data_classification: 'PHI',
      storage_type: 'local'
    }
  ];

  try {
    for (const photo of samplePhotos) {
      const docRef = await addDoc(collection(firestore, 'photos'), photo);
      console.log('Added photo with ID:', docRef.id);
    }
    console.log('Sample photos added successfully!');
  } catch (error) {
    console.error('Error adding sample photos:', error);
  }
}

// Run the script
addSamplePhotos();
