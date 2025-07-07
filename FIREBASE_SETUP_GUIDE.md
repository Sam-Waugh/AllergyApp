# Firebase Database Setup Guide - Real Data Persistence

## 🚀 Overview
This guide will help you set up Firebase Firestore for real data persistence in your Allergy App, replacing the current mock data system.

## 📋 Prerequisites
- Google account
- Firebase project (we'll create one)
- Admin access to modify environment variables

## 🔧 Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `allergy-app-production` (or your preferred name)
4. Choose whether to enable Google Analytics (recommended for production)
5. Click "Create project"

### 1.2 Enable Required Services
1. **Authentication** (optional for now, we have mock auth):
   - Go to Authentication > Sign-in method
   - Enable Email/Password if you want real auth later
   
2. **Firestore Database** (required):
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for now (we'll secure it later)
   - Select your preferred location (choose closest to your users)

## 🔑 Step 2: Get Firebase Configuration

### 2.1 Web App Configuration
1. In Firebase Console, click the gear icon (⚙️) > Project settings
2. Scroll down to "Your apps" section
3. Click "Web" icon (`</>`)
4. Register app with nickname: "allergy-app-web"
5. Copy the config object that looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 2.2 Admin SDK Configuration
1. Go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely (don't commit to git!)
4. Note down the values we'll need for environment variables

## 🔒 Step 3: Update Environment Variables

### 3.1 Frontend Environment (.env)
Replace your current Firebase config with real values:

```bash
# Google Maps API Configuration
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDEI4obOJXITsibr0LyFY2TXx8Q5qg_Xj0

# Backend API Configuration  
EXPO_PUBLIC_API_URL=http://172.16.0.31:8090/api/v1
EXPO_PUBLIC_API_BASE_URL=http://172.16.0.31:8090

# Firebase Configuration (REAL PRODUCTION CONFIG)
EXPO_PUBLIC_FIREBASE_API_KEY=your_real_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_USE_FIRESTORE_EMULATOR=false

# Firebase Production Mode (enable real Firebase)
EXPO_PUBLIC_FIREBASE_TEST_MODE=false

# Environment
EXPO_PUBLIC_ENV=production
```

### 3.2 Backend Environment (.env)
Update with your Admin SDK credentials:

```bash
# Environment Configuration
SECRET_KEY=allergy-app-secret-key-change-in-production-environment
DATABASE_URL=sqlite:///./allergy_app.db
FIREBASE_CREDENTIALS=path/to/your/service-account-file.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Firebase Production Mode (enable real Firebase)
FIREBASE_TEST_MODE=false

# Firebase Admin SDK Configuration (from service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# API Keys
OPENWEATHER_API_KEY=your_openweather_api_key_here
AIRVISUAL_API_KEY=your_airvisual_api_key_here
GOOGLE_MAPS_API_KEY=AIzaSyDEI4obOJXITsibr0LyFY2TXx8Q5qg_Xj0

# CORS settings
CORS_ORIGINS=["http://localhost:3000", "http://localhost:19006"]

# File upload settings
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_DIR=uploads
```

## 🗃️ Step 4: Configure Firestore Database Structure

### 4.1 Create Collections
Your app will automatically create these collections, but here's the structure:

```
firestore/
├── users/
│   └── {userId}/
│       ├── profile: { name, email, created_at }
│       └── children/
│           └── {childId}/
│               ├── profile: { first_name, last_name, date_of_birth, ... }
│               └── daily_logs/
│                   └── {logId}: { date, symptoms, mood, triggers, notes }
└── audit_logs/
    └── {logId}: { user_id, action, timestamp, data }
```

### 4.2 Set Security Rules
1. Go to Firestore Database > Rules
2. Replace with secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Children data under user
      match /children/{childId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Daily logs under children
        match /daily_logs/{logId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // Audit logs (admin only)
    match /audit_logs/{logId} {
      allow read, write: if false; // Only server-side access
    }
  }
}
```

## ⚡ Step 5: Test the Connection

### 5.1 Quick Test Script
Create a test file to verify connection:

```typescript
// test-firebase-connection.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  try {
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Firebase connection successful!',
      timestamp: new Date()
    });
    console.log('✅ Firebase connected! Document ID:', docRef.id);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
}

testConnection();
```

## 🔄 Step 6: Switch from Mock to Real Data

The app is already designed to switch between mock and real Firebase data based on environment variables. When you update the `.env` files:

1. Set `EXPO_PUBLIC_FIREBASE_TEST_MODE=false`
2. Set `FIREBASE_TEST_MODE=false` 
3. Restart both frontend and backend servers

The app will automatically:
- ✅ Connect to real Firestore instead of mock data
- ✅ Save children profiles to Firebase
- ✅ Store daily logs in Firestore
- ✅ Provide real-time data synchronization
- ✅ Enable audit logging for HIPAA compliance

## 🛡️ Step 7: Security Considerations

### 7.1 Environment Security
- Never commit `.env` files with real credentials
- Use different Firebase projects for development/production
- Regularly rotate API keys and service account keys

### 7.2 HIPAA Compliance
- Enable Firebase audit logs
- Set up proper user authentication
- Configure data retention policies
- Implement data encryption at rest (Firebase does this by default)

## 🚨 Important Notes

1. **Billing**: Firebase has generous free tiers, but monitor usage
2. **Authentication**: Currently using mock auth - consider implementing real Firebase Auth later
3. **Backup**: Set up regular Firestore backups for production
4. **Monitoring**: Enable Firebase Performance and Crashlytics

## 🔧 Troubleshooting

### Common Issues:
1. **Permission denied**: Check Firestore security rules
2. **Invalid API key**: Verify Firebase config in `.env`
3. **Network errors**: Check CORS settings and network connectivity
4. **Auth errors**: Ensure authentication is properly configured

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Web app registered in Firebase
- [ ] Service account key generated
- [ ] Frontend `.env` updated with real config
- [ ] Backend `.env` updated with Admin SDK config
- [ ] Firestore security rules configured
- [ ] Test mode disabled (`FIREBASE_TEST_MODE=false`)
- [ ] App restarted and tested
- [ ] Data persistence verified

Once completed, your Allergy App will have full Firebase Firestore integration with real data persistence! 🎉
