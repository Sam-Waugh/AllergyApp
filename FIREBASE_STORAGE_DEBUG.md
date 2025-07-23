# Firebase Storage Debug Guide

## Current Issue
Getting `storage/unknown` error when uploading photos to Firebase Storage.

## Environment Configuration
- Project ID: ``
- Storage Bucket: ``
- Test Mode: Currently enabled for testing

## Potential Causes and Solutions

### 1. Firebase Storage Rules
The Firebase Storage security rules might be blocking uploads. Default rules require authentication.

**Recommended Rules for Testing:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow read and write access to all users (for testing only)
      allow read, write: if true;
    }
  }
}
```

**Production Rules (more secure):**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /children/{childId}/photos/{photoId} {
      // Allow authenticated users to upload photos for children they have access to
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Firebase Storage Not Enabled
- Go to Firebase Console > Storage
- Ensure Storage is enabled for the project
- Check that the storage bucket exists

### 3. Authentication Issues
- The app might not be properly authenticated with Firebase
- User ID needs to be set before uploading

### 4. Network/Connectivity Issues
- Check internet connection
- Verify Firebase project is accessible

## Testing Steps

1. **Test with Mock Storage (Current)**
   - Set `EXPO_PUBLIC_FIREBASE_TEST_MODE=true`
   - Photo uploads should work with local storage simulation

2. **Test Real Firebase Storage**
   - Set `EXPO_PUBLIC_FIREBASE_TEST_MODE=false`
   - Update Firebase Storage rules to allow uploads
   - Try photo upload again

3. **Check Firebase Console**
   - Go to Firebase Console
   - Check Storage section
   - Verify bucket exists and has correct permissions

## Next Steps

1. Verify photo upload works in test mode (current setting)
2. Update Firebase Storage rules in console
3. Re-enable real Firebase Storage
4. Test again with detailed logging
