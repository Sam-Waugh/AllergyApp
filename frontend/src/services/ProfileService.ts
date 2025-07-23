import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  query,
  getDoc,
  setDoc,
  getDocsFromCache,
  getDocFromCache,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { firestore, storage } from '../firebaseConfig';
import { Child, ProfileForm, User, ApiResponse } from '../models';

const CHILDREN_COLLECTION = 'children';
const USERS_COLLECTION = 'users';
const PROFILE_PHOTOS_PATH = 'profile-photos';

class ProfileService {
  // Create new child profile using Firestore
  async createChildProfile(profileData: ProfileForm): Promise<ApiResponse<Child>> {
    try {
      const childrenRef = collection(firestore, CHILDREN_COLLECTION);
      const now = new Date().toISOString();
      
      const newChild = {
        name: profileData.name,
        dateOfBirth: profileData.dateOfBirth,
        allergies: profileData.allergies || [],
        medications: profileData.medications || [],
        conditions: profileData.conditions || [],
        photoUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(childrenRef, newChild);
      
      const child: Child = {
        id: docRef.id,
        name: profileData.name,
        dateOfBirth: profileData.dateOfBirth,
        allergies: profileData.allergies || [],
        medications: profileData.medications || [],
        conditions: profileData.conditions || [],
        photoUrl: '',
        createdAt: now,
        updatedAt: now,
      };

      return {
        success: true,
        data: child,
        message: 'Child profile created successfully'
      };
    } catch (error) {
      console.error('Error creating child profile:', error);
      return {
        success: false,
        error: 'Failed to create child profile in local storage'
      };
    }
  }

  // Get all children for current user from Firestore with offline support
  async getChildren(): Promise<ApiResponse<Child[]>> {
    try {
      const childrenRef = collection(firestore, CHILDREN_COLLECTION);
      const q = query(childrenRef, orderBy('createdAt', 'desc'));
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (networkError) {
        // Try cache as fallback
        console.log('Network failed, trying cache');
        querySnapshot = await getDocsFromCache(q);
      }
      
      const children: Child[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        children.push({
          id: doc.id,
          name: data.name,
          dateOfBirth: data.dateOfBirth,
          allergies: data.allergies || [],
          medications: data.medications || [],
          conditions: data.conditions || [],
          photoUrl: data.photoUrl || '',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
      
      console.log(`Retrieved ${children.length} children from ${querySnapshot.metadata.fromCache ? 'cache' : 'server'}`);
      return {
        success: true,
        data: children,
        message: `Found ${children.length} children${querySnapshot.metadata.fromCache ? ' (offline)' : ''}`
      };
    } catch (error) {
      console.error('Error fetching children:', error);
      return {
        success: false,
        error: 'Failed to fetch children from local storage'
      };
    }
  }

  // Get specific child profile from Firestore with offline support
  async getChildProfile(childId: string): Promise<ApiResponse<Child>> {
    try {
      const childRef = doc(firestore, CHILDREN_COLLECTION, childId);
      
      let docSnap;
      try {
        docSnap = await getDoc(childRef);
      } catch (networkError) {
        // Try cache as fallback
        console.log('Network failed, trying cache for child:', childId);
        docSnap = await getDocFromCache(childRef);
      }
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Child profile not found'
        };
      }
      
      const data = docSnap.data();
      const child: Child = {
        id: docSnap.id,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        allergies: data.allergies || [],
        medications: data.medications || [],
        conditions: data.conditions || [],
        photoUrl: data.photoUrl || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
      
      return {
        success: true,
        data: child,
        message: `Child profile retrieved successfully${docSnap.metadata.fromCache ? ' (offline)' : ''}`
      };
    } catch (error) {
      console.error('Error getting child profile:', error);
      return {
        success: false,
        error: 'Failed to get child profile from local storage'
      };
    }
  }

  // Update child profile in Firestore
  async updateChildProfile(childId: string, updates: Partial<ProfileForm>): Promise<ApiResponse<Child>> {
    try {
      const childRef = doc(firestore, CHILDREN_COLLECTION, childId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(childRef, updateData);
      
      // Get the updated document to return
      const updatedDoc = await getDoc(childRef);
      if (!updatedDoc.exists()) {
        throw new Error('Child not found after update');
      }
      
      const data = updatedDoc.data();
      const child: Child = {
        id: updatedDoc.id,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        allergies: data.allergies || [],
        medications: data.medications || [],
        conditions: data.conditions || [],
        photoUrl: data.photoUrl || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
      
      return {
        success: true,
        data: child,
        message: 'Child profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating child profile:', error);
      return {
        success: false,
        error: 'Failed to update child profile in local storage'
      };
    }
  }

  // Delete child profile from Firestore
  async deleteChildProfile(childId: string): Promise<ApiResponse<void>> {
    try {
      // First, try to delete the profile photo if it exists
      try {
        const photoRef = ref(storage, `${PROFILE_PHOTOS_PATH}/${childId}`);
        await deleteObject(photoRef);
      } catch (photoError) {
        // Photo might not exist, continue with profile deletion
        console.log('No profile photo to delete or error deleting photo:', photoError);
      }
      
      // Delete the child document
      const childRef = doc(firestore, CHILDREN_COLLECTION, childId);
      await deleteDoc(childRef);
      
      return {
        success: true,
        message: 'Child profile deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting child profile:', error);
      return {
        success: false,
        error: 'Failed to delete child profile from local storage'
      };
    }
  }

  // Upload child photo to Firebase Storage and update Firestore
  async uploadChildPhoto(childId: string, photoUri: string): Promise<ApiResponse<Child>> {
    try {
      // Convert photo URI to blob for upload
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      // Create storage reference
      const filename = `${childId}_${Date.now()}.jpg`;
      const photoRef = ref(storage, `${PROFILE_PHOTOS_PATH}/${filename}`);
      
      // Upload the photo
      await uploadBytes(photoRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(photoRef);
      
      // Update the child document with the photo URL
      const childRef = doc(firestore, CHILDREN_COLLECTION, childId);
      await updateDoc(childRef, {
        photoUrl: downloadURL,
        updatedAt: serverTimestamp(),
      });
      
      // Get the updated child data
      const updatedDoc = await getDoc(childRef);
      if (!updatedDoc.exists()) {
        throw new Error('Child not found after photo upload');
      }
      
      const data = updatedDoc.data();
      const child: Child = {
        id: updatedDoc.id,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        allergies: data.allergies || [],
        medications: data.medications || [],
        conditions: data.conditions || [],
        photoUrl: data.photoUrl || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
      
      return {
        success: true,
        data: child,
        message: 'Photo uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading child photo:', error);
      return {
        success: false,
        error: 'Failed to upload photo to local storage'
      };
    }
  }

  // Get user profile from Firestore (create if doesn't exist)
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      // For now, we'll use a default user ID since we don't have auth implemented
      const userId = 'default-user';
      const userRef = doc(firestore, USERS_COLLECTION, userId);
      const docSnap = await getDoc(userRef);
      
      let user: User;
      
      if (!docSnap.exists()) {
        // Create default user profile
        user = {
          id: userId,
          email: 'user@example.com',
          name: 'Default User',
          children: [],
          preferences: {
            notifications: true,
            reminderTime: '09:00',
            defaultLocation: '',
          },
        };
        
        await setDoc(userRef, {
          email: user.email,
          name: user.name,
          preferences: user.preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const data = docSnap.data();
        user = {
          id: docSnap.id,
          email: data.email,
          name: data.name,
          children: [],
          preferences: data.preferences || {
            notifications: true,
            reminderTime: '09:00',
            defaultLocation: '',
          },
        };
      }
      
      return {
        success: true,
        data: user,
        message: 'User profile retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {
        success: false,
        error: 'Failed to get user profile from local storage'
      };
    }
  }

  // Update user preferences in Firestore
  async updateUserPreferences(preferences: User['preferences']): Promise<ApiResponse<User>> {
    try {
      const userId = 'default-user';
      const userRef = doc(firestore, USERS_COLLECTION, userId);
      
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp(),
      });
      
      // Get the updated user data
      const updatedDoc = await getDoc(userRef);
      if (!updatedDoc.exists()) {
        throw new Error('User not found after preferences update');
      }
      
      const data = updatedDoc.data();
      const user: User = {
        id: updatedDoc.id,
        email: data.email,
        name: data.name,
        children: [], // Children are fetched separately
        preferences: data.preferences,
      };
      
      return {
        success: true,
        data: user,
        message: 'User preferences updated successfully'
      };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        error: 'Failed to update user preferences in local storage'
      };
    }
  }

  // Offline mode utilities
  async enableOfflineMode(): Promise<ApiResponse<void>> {
    try {
      await disableNetwork(firestore);
      console.log('Firebase offline mode enabled');
      return {
        success: true,
        message: 'Offline mode enabled'
      };
    } catch (error) {
      console.error('Error enabling offline mode:', error);
      return {
        success: false,
        error: 'Failed to enable offline mode'
      };
    }
  }

  async enableOnlineMode(): Promise<ApiResponse<void>> {
    try {
      await enableNetwork(firestore);
      console.log('Firebase online mode enabled');
      return {
        success: true,
        message: 'Online mode enabled'
      };
    } catch (error) {
      console.error('Error enabling online mode:', error);
      return {
        success: false,
        error: 'Failed to enable online mode'
      };
    }
  }
}

export default new ProfileService();
