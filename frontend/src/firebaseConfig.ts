// Firebase configuration and initialization for Expo/React Native
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  enableNetwork, 
  disableNetwork, 
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Import auth - ensure the module is fully loaded
import * as firebaseAuth from 'firebase/auth';
const { getAuth, connectAuthEmulator } = firebaseAuth;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
};

console.log('Environment variables check:');
console.log('EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET');
console.log('EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
console.log('Firebase config resolved:', firebaseConfig);
console.log('Test mode:', process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE);

// Initialize Firebase App
let app;
try {
  console.log('Attempting to initialize Firebase app...');
  // Use getApps to check if app already exists
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully (new app)');
  } else {
    app = getApp();
    console.log('Firebase app already exists, using existing app');
  }
} catch (error) {
  console.error('Failed to initialize Firebase app:', error);
  console.error('Error type:', typeof error);
  console.error('Error message:', error.message);
  console.error('Firebase config used:', JSON.stringify(firebaseConfig, null, 2));
  app = null;
}

// Initialize Firestore with different settings based on test mode
let firestore;
if (app) {
  try {
    if (process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true') {
      // For test mode, use demo project with offline persistence only
      console.log('Initializing Firestore in test mode');
      firestore = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true, // Use long polling for demo mode
      });
    } else {
      // For production mode
      firestore = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: false,
      });
    }
    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    firestore = null;
  }
} else {
  firestore = null;
}

// Initialize Firebase Auth (optional - not critical for app functionality)
let auth = null;

// Simple auth initialization without blocking the app
const tryInitializeAuth = () => {
  if (!app) {
    console.log('No Firebase app available for Auth initialization');
    return;
  }

  try {
    console.log('Attempting optional Firebase Auth initialization...');
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase Auth initialization failed (this is optional):', error.message);
    console.log('📝 Note: App will continue to work without Firebase Auth');
    auth = null;
  }
};

// Try to initialize Auth, but don't block the app if it fails
if (app) {
  // Try immediately first
  tryInitializeAuth();
  
  // If it failed, try once more after a short delay
  if (!auth) {
    setTimeout(() => {
      if (!auth) {
        console.log('Retrying optional Auth initialization...');
        tryInitializeAuth();
      }
    }, 500);
  }
} else {
  console.log('No Firebase app available for Auth initialization');
}

// Initialize Firebase Storage
let storage;
if (app) {
  try {
    storage = getStorage(app);
    console.log('Firebase Storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Storage:', error);
    storage = null;
  }
} else {
  storage = null;
}

// For test mode, disable network and work offline
if (process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true' && firestore) {
  console.log('Firebase running in test mode - working offline');
  try {
    // Disable network to work purely offline with cached data
    disableNetwork(firestore);
  } catch (error) {
    console.log('Network already disabled or not available');
  }
}

// For development/demo mode, connect to emulators if needed
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIRESTORE_EMULATOR === 'true' && process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE !== 'true') {
  try {
    if (firestore) {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
    if (auth) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}

// Utility functions for managing offline/online state
export const enableFirestoreNetwork = () => {
  if (firestore) {
    return enableNetwork(firestore);
  } else {
    console.warn('Firestore not available, cannot enable network');
    return Promise.resolve();
  }
};

export const disableFirestoreNetwork = () => {
  if (firestore) {
    return disableNetwork(firestore);
  } else {
    console.warn('Firestore not available, cannot disable network');
    return Promise.resolve();
  }
};

// HIPAA compliance utilities
export const validateHIPAACompliance = () => {
  // Validate that we're using HTTPS (only in browser environment)
  if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'https:' && !__DEV__) {
    throw new Error('HIPAA compliance requires HTTPS connection');
  }
  
  // Validate Firebase configuration
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'demo-project') {
    console.warn('Firebase project not properly configured for production');
  }
  
  return true;
};

// Initialize HIPAA compliance validation
try {
  validateHIPAACompliance();
} catch (error) {
  console.error('HIPAA compliance validation failed:', error);
}

// Safe getter functions for Firebase services
export const getFirebaseAuth = () => {
  if (auth) {
    return auth;
  }
  
  // Try one more time if auth isn't available (non-blocking)
  if (app && !auth) {
    try {
      auth = getAuth(app);
      console.log('Late Auth initialization succeeded');
      return auth;
    } catch (error) {
      console.warn('Late Auth initialization failed (app will continue without Auth):', error.message);
      return null;
    }
  }
  
  return auth;
};

export const getFirebaseApp = () => app;
export const getFirebaseFirestore = () => firestore;
export const getFirebaseStorage = () => storage;

// Export Firebase instances (with null safety)
export { app, firestore, storage };
export { auth };
