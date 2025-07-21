# Firebase and Firestore HIPAA-Compliant Setup Guide

This guide walks you through setting up Firebase and Firestore for HIPAA-compliant storage of Protected Health Information (PHI) for the Allergy App.

## Prerequisites

Before setting up Firebase, ensure you have:
- A Google Cloud Platform account
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google Cloud Project with billing enabled
- HIPAA Business Associate Agreement (BAA) signed with Google Cloud

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name (e.g., "allergy-app-hipaa")
4. Enable Google Analytics (optional, but recommended for monitoring)
5. Choose or create a Google Analytics account

## Step 2: Enable HIPAA Compliance

**Important**: Firebase itself is not HIPAA compliant by default. You need to use Google Cloud's HIPAA-compliant services.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to "IAM & Admin" > "Privacy & Security"
4. Enable "Healthcare API" if processing medical data
5. Sign the HIPAA Business Associate Agreement (BAA)

## Step 3: Configure Firestore with HIPAA Settings

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. **Important**: Choose "Production mode" for HIPAA compliance
4. Select a region that supports HIPAA (us-central1, us-east1, etc.)
5. Set up security rules for PHI protection

### Firestore Security Rules for HIPAA

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Children profiles - only parent can access
    match /children/{childId} {
      allow read, write: if request.auth != null && 
        resource.data.parent_user_id == request.auth.uid;
    }
    
    // Symptom logs - only parent can access
    match /symptom_logs/{logId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/children/$(resource.data.child_id)) &&
        get(/databases/$(database)/documents/children/$(resource.data.child_id)).data.parent_user_id == request.auth.uid;
    }
    
    // Photos - only parent can access
    match /photos/{photoId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/children/$(resource.data.child_id)) &&
        get(/databases/$(database)/documents/children/$(resource.data.child_id)).data.parent_user_id == request.auth.uid;
    }
    
    // Access logs - only system can write, users can read their own
    match /access_logs/{logId} {
      allow read: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow write: if false; // Only server-side writes allowed
    }
  }
}
```

## Step 4: Set Up Firebase Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable sign-in methods:
   - Email/Password (recommended for HIPAA)
   - Google (optional)
4. Configure password requirements:
   - Minimum 8 characters
   - Require uppercase, lowercase, numbers, special characters

## Step 5: Configure Firebase Admin SDK for Backend

### Generate Service Account Key

1. Go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save as `google-services.json` in your backend directory

### Environment Variables

Update your backend `.env` file:

```env
# Firebase Admin SDK Configuration (for HIPAA compliance)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

## Step 6: Configure Frontend Firebase Config

Update your frontend `.env` file:

```env
# Firebase Configuration (HIPAA Compliant)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_USE_FIRESTORE_EMULATOR=false
```

## Step 7: Install Dependencies

### Backend Dependencies

```bash
cd backend
pip install firebase-admin google-cloud-firestore
```

### Frontend Dependencies

```bash
cd frontend
npm install firebase
```

## Step 8: Configure Storage Bucket for Photos

1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Set up security rules for photo access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /children/{childId}/photos/{photoId} {
      allow read, write: if request.auth != null && 
        firestore.exists(/databases/(default)/documents/children/$(childId)) &&
        firestore.get(/databases/(default)/documents/children/$(childId)).data.parent_user_id == request.auth.uid;
    }
  }
}
```

## Step 9: Enable Audit Logging

1. Go to Google Cloud Console
2. Navigate to "Logging" > "Logs Router"
3. Create sinks for audit logs
4. Set up monitoring for PHI access

## Step 10: Testing the Setup

### Backend Testing

```bash
cd backend
python -c "
from config.firebase_config import initialize_firebase, validate_hipaa_compliance
initialize_firebase()
validate_hipaa_compliance()
print('Firebase backend setup successful!')
"
```

### Frontend Testing

```bash
cd frontend
npm start
```

Open the app and try:
1. Creating a user account
2. Adding a child profile
3. Creating a symptom log entry
4. Uploading a photo

## HIPAA Compliance Checklist

- [ ] Google Cloud HIPAA BAA signed
- [ ] Firestore in production mode
- [ ] Security rules implemented
- [ ] Audit logging enabled
- [ ] Data encryption at rest and in transit
- [ ] Access controls implemented
- [ ] User authentication required
- [ ] PHI access logged
- [ ] Data backup and recovery plan
- [ ] Incident response plan

## Security Best Practices

1. **Data Minimization**: Only collect necessary PHI
2. **Access Controls**: Implement role-based access
3. **Audit Trails**: Log all PHI access
4. **Encryption**: Ensure data is encrypted at rest and in transit
5. **Regular Monitoring**: Monitor for unusual access patterns
6. **User Training**: Train users on HIPAA compliance
7. **Regular Audits**: Conduct regular security audits

## Troubleshooting

### Common Issues

1. **Firestore Permission Denied**
   - Check security rules
   - Verify user authentication
   - Ensure proper parent-child relationships

2. **Firebase Admin SDK Errors**
   - Verify service account credentials
   - Check environment variables
   - Ensure project ID is correct

3. **Storage Upload Failures**
   - Check storage security rules
   - Verify file size limits
   - Check user permissions

### Testing Commands

```bash
# Test Firestore connection
curl -X GET "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/health_check/test" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"

# Test Firebase Auth
firebase auth:test --project YOUR_PROJECT_ID
```

## Production Deployment

1. Update security rules for production
2. Enable monitoring and alerting
3. Set up automated backups
4. Configure error reporting
5. Implement rate limiting
6. Set up SSL/TLS certificates

## Support and Resources

- [Firebase HIPAA Documentation](https://firebase.google.com/support/privacy)
- [Google Cloud HIPAA Compliance](https://cloud.google.com/security/compliance/hipaa)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## Legal Disclaimer

This setup guide provides technical implementation details for HIPAA compliance. Please consult with legal and compliance experts to ensure full HIPAA compliance for your specific use case.
