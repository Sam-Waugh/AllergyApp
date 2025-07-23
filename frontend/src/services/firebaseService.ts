/**
 * HIPAA-compliant Firebase service for frontend operations.
 * 
 * This service provides secure client-side operations for managing
 * child profiles and symptom data with full audit logging and encryption.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { firestore, storage } from '../firebaseConfig';
import {
  ChildProfile,
  CreateChildRequest,
  ChildResponse,
  SymptomLogEntry,
  PhotoEntry,
  UserProfile,
  ValidationError
} from '../models/ChildProfile';
import { DailyLog, DailyLogForm } from '../models';

class HIPAAFirebaseService {
  private userId: string | null = null;
  private accessLogQueue: any[] = [];
  private isTestMode: boolean = process.env.EXPO_PUBLIC_FIREBASE_TEST_MODE === 'true';
  private mockDatabase: Map<string, any> = new Map(); // In-memory storage for test mode
  private MOCK_STORAGE_KEY = 'firebase_mock_data';

  constructor() {
    this.initializeAccessLogging();
    if (this.isTestMode) {
      console.log('Firebase service running in test mode - using mock database');
      this.loadMockData();
    }
  }

  /**
   * Load mock data from AsyncStorage
   */
  private async loadMockData() {
    try {
      const storedData = await AsyncStorage.getItem(this.MOCK_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.mockDatabase = new Map(Object.entries(parsedData));
        console.log('Loaded mock data from storage:', this.mockDatabase.size, 'entries');
      }
    } catch (error) {
      console.error('Failed to load mock data:', error);
    }
  }

  /**
   * Save mock data to AsyncStorage
   */
  private async saveMockData() {
    try {
      const dataObj = Object.fromEntries(this.mockDatabase);
      await AsyncStorage.setItem(this.MOCK_STORAGE_KEY, JSON.stringify(dataObj));
      console.log('Saved mock data to storage:', Object.keys(dataObj).length, 'entries');
    } catch (error) {
      console.error('Failed to save mock data:', error);
    }
  }

  /**
   * Mock Firestore operations for test mode
   */
  private async mockSetDoc(docPath: string, data: any): Promise<void> {
    this.mockDatabase.set(docPath, { ...data, _id: docPath });
    console.log('Mock setDoc:', docPath, data);
    await this.saveMockData(); // Persist to AsyncStorage
  }

  private async mockGetDoc(docPath: string): Promise<{ exists: () => boolean; data: () => any }> {
    const data = this.mockDatabase.get(docPath);
    return {
      exists: () => !!data,
      data: () => data || {}
    };
  }

  private async mockUpdateDoc(docPath: string, data: any): Promise<void> {
    const existing = this.mockDatabase.get(docPath) || {};
    this.mockDatabase.set(docPath, { ...existing, ...data });
    console.log('Mock updateDoc:', docPath, data);
    await this.saveMockData(); // Persist to AsyncStorage
  }

  /**
   * Initialize access logging for HIPAA compliance
   */
  private async initializeAccessLogging() {
    try {
      // Load user ID from storage
      this.userId = await AsyncStorage.getItem('user_id');
    } catch (error) {
      console.error('Failed to initialize access logging:', error);
    }
  }

  /**
   * Log data access for HIPAA audit trail
   */
  private async logAccess(
    action: string,
    resourceType: string,
    resourceId: string,
    success: boolean = true,
    details?: string
  ) {
    if (!this.userId) return;

    const logEntry = {
      user_id: this.userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      timestamp: new Date().toISOString(),
      success,
      details: details || '',
      session_id: await this.getSessionId()
    };

    try {
      // Add to queue for batch processing
      this.accessLogQueue.push(logEntry);
      console.log(`Access logged: ${action} ${resourceType} ${resourceId} - Success: ${success}`);

      // In test mode, flush logs more frequently for debugging
      const flushThreshold = this.isTestMode ? 1 : 10;
      
      // Process queue if it gets too large
      if (this.accessLogQueue.length >= flushThreshold) {
        await this.flushAccessLogs();
      }
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  }

  /**
   * Flush access logs to Firestore or mock storage
   */
  private async flushAccessLogs() {
    if (this.accessLogQueue.length === 0) return;

    const logsToFlush = [...this.accessLogQueue];
    this.accessLogQueue = [];

    try {
      if (this.isTestMode) {
        // Save logs to mock database
        console.log('Flushing access logs to mock database:', logsToFlush.length, 'logs');
        
        for (const log of logsToFlush) {
          const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await this.mockSetDoc(`access_logs/${logId}`, log);
        }
        
        console.log('Access logs saved to mock database');
      } else {
        // Batch write logs to real Firestore
        for (const log of logsToFlush) {
          await addDoc(collection(firestore, 'access_logs'), log);
        }
      }
    } catch (error) {
      console.error('Failed to flush access logs:', error);
      // Re-add failed logs to queue
      this.accessLogQueue.unshift(...logsToFlush);
    }
  }

  /**
   * Get or create session ID
   */
  private async getSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return `session_${Date.now()}_error`;
    }
  }

  /**
   * Set current user ID for access logging
   */
  async setUserId(userId: string) {
    this.userId = userId;
    await AsyncStorage.setItem('user_id', userId);
  }

  /**
   * Validate child data before saving
   */
  private validateChildData(childData: CreateChildRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!childData.first_name?.trim()) {
      errors.push({ field: 'first_name', message: 'First name is required' });
    }
    if (!childData.last_name?.trim()) {
      errors.push({ field: 'last_name', message: 'Last name is required' });
    }
    if (!childData.date_of_birth) {
      errors.push({ field: 'date_of_birth', message: 'Date of birth is required' });
    } else {
      // Validate age (must be under 18)
      const today = new Date();
      const birthDate = new Date(childData.date_of_birth);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age >= 18) {
        errors.push({ field: 'date_of_birth', message: 'Child must be under 18 years old' });
      }
      if (birthDate > today) {
        errors.push({ field: 'date_of_birth', message: 'Date of birth cannot be in the future' });
      }
    }

    // Validate emergency contacts
    if (childData.emergency_contacts) {
      childData.emergency_contacts.forEach((contact, index) => {
        if (!contact.name?.trim()) {
          errors.push({ field: `emergency_contacts.${index}.name`, message: 'Contact name is required' });
        }
        if (!contact.phone_primary?.trim()) {
          errors.push({ field: `emergency_contacts.${index}.phone_primary`, message: 'Primary phone is required' });
        }
      });
    }

    return errors;
  }

  /**
   * Create a new child profile
   */
  async createChildProfile(childData: CreateChildRequest): Promise<ChildResponse> {
    console.log('=== FIREBASE SERVICE: createChildProfile CALLED ===');
    console.log('Input data:', JSON.stringify(childData, null, 2));
    
    try {
      console.log('=== VALIDATING DATA ===');
      // Validate data
      const validationErrors = this.validateChildData(childData);
      console.log('Validation errors:', validationErrors);
      
      if (validationErrors.length > 0) {
        console.error('Validation failed:', validationErrors);
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      console.log('=== CHECKING USER AUTHENTICATION ===');
      console.log('User ID in service:', this.userId);
      
      if (!this.userId) {
        console.error('User not authenticated - userId is null');
        throw new Error('User not authenticated');
      }

      console.log('=== GENERATING CHILD ID ===');
      // Generate child ID
      const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated child ID:', childId);

      console.log('=== CALCULATING AGE ===');
      // Calculate age in months
      const today = new Date();
      const birthDate = new Date(childData.date_of_birth);
      const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
      console.log('Age in months:', ageMonths);

      console.log('=== CREATING CHILD PROFILE OBJECT ===');
      // Create child profile
      const childProfile: Partial<ChildProfile> = {
        child_id: childId,
        parent_user_id: this.userId,
        first_name: childData.first_name,
        last_name: childData.last_name,
        date_of_birth: childData.date_of_birth,
        gender: childData.gender,
        known_allergies: childData.known_allergies || [],
        current_medications: childData.current_medications || [],
        medical_conditions: childData.medical_conditions || [],
        emergency_contacts: childData.emergency_contacts || [],
        specialists: [],
        notification_preferences: {
          daily_reminders: true,
          medication_alerts: true,
          appointment_reminders: true,
          emergency_notifications: true
        },
        data_sharing_consent: {
          healthcare_providers: false,
          research_studies: false,
          emergency_services: true
        },
        hipaa_consent_date: new Date().toISOString(),
        created_at: serverTimestamp() as any,
        updated_at: serverTimestamp() as any,
        data_classification: 'PHI'
      };

      // Only add optional fields if they have values (not undefined)
      if (childData.medical_notes && childData.medical_notes.trim()) {
        childProfile.medical_notes = childData.medical_notes;
      }
      
      if (childData.primary_doctor) {
        childProfile.primary_doctor = childData.primary_doctor;
      }
      
      console.log('Child profile object created:', JSON.stringify(childProfile, null, 2));

      console.log('=== SAVING TO FIRESTORE ===');
      
      if (this.isTestMode) {
        // Use mock operations in test mode
        console.log('Using mock Firestore operations');
        await this.mockSetDoc(`children/${childId}`, childProfile);
        
        // Update user's children list
        const userDoc = await this.mockGetDoc(`users/${this.userId}`);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          await this.mockUpdateDoc(`users/${this.userId}`, {
            children_ids: [...(userData.children_ids || []), childId],
            updated_at: new Date().toISOString()
          });
        } else {
          await this.mockSetDoc(`users/${this.userId}`, {
            user_id: this.userId,
            children_ids: [childId],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } else {
        // Use real Firestore operations
        const docRef = doc(firestore, 'children', childId);
        console.log('Document reference created for:', childId);
        
        await setDoc(docRef, childProfile);
        console.log('Child document saved successfully');

        console.log('=== UPDATING USER CHILDREN LIST ===');
        // Update user's children list
        const userRef = doc(firestore, 'users', this.userId);
        console.log('User document reference:', this.userId);
        
        const userDoc = await getDoc(userRef);
        console.log('User document exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Existing user data:', userData);
          
          await updateDoc(userRef, {
            children_ids: [...(userData.children_ids || []), childId],
            updated_at: serverTimestamp()
          });
          console.log('User document updated with new child ID');
        } else {
          console.log('Creating new user document');
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            user_id: this.userId,
            children_ids: [childId],
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
          console.log('New user document created');
        }
      }

      console.log('=== LOGGING ACCESS ===');
      await this.logAccess('CREATE', 'child_profile', childId);
      console.log('Access logged successfully');

      console.log('=== CREATING RESPONSE OBJECT ===');
      const response = {
        child_id: childId,
        first_name: childData.first_name,
        last_name: childData.last_name,
        date_of_birth: childData.date_of_birth,
        gender: childData.gender,
        age_months: ageMonths,
        created_at: new Date().toISOString()
      };
      
      console.log('Response object:', JSON.stringify(response, null, 2));
      console.log('=== FIREBASE SERVICE SUCCESS - RETURNING RESPONSE ===');
      
      return response;

    } catch (error) {
      console.error('=== FIREBASE SERVICE ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      await this.logAccess('CREATE', 'child_profile', '', false, error.message);
      console.error('Failed to create child profile:', error);
      throw error;
    }
  }

  /**
   * Get all children for the current user
   */
  async getUserChildren(): Promise<ChildResponse[]> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      if (this.isTestMode) {
        // Use mock data in test mode
        console.log('Getting user children from mock database');
        const children: ChildResponse[] = [];
        
        // Get user document to find children IDs
        const userDoc = await this.mockGetDoc(`users/${this.userId}`);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const childrenIds = userData.children_ids || [];
          
          // Get each child document
          for (const childId of childrenIds) {
            const childDoc = await this.mockGetDoc(`children/${childId}`);
            if (childDoc.exists()) {
              const data = childDoc.data();
              const birthDate = new Date(data.date_of_birth);
              const today = new Date();
              const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                               (today.getMonth() - birthDate.getMonth());

              children.push({
                child_id: data.child_id,
                first_name: data.first_name,
                last_name: data.last_name,
                date_of_birth: data.date_of_birth,
                gender: data.gender,
                age_months: ageMonths,
                created_at: data.created_at || new Date().toISOString()
              });
            }
          }
        }
        
        await this.logAccess('READ', 'children_list', this.userId);
        return children;
      } else {
        // Use simplified Firestore query to avoid index requirements
        // Only filter by parent_user_id, sort and filter on client side
        const q = query(
          collection(firestore, 'children'),
          where('parent_user_id', '==', this.userId)
        );

        const querySnapshot = await getDocs(q);
        const allChildren: ChildResponse[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Skip deleted children on the client side to avoid index issues
          if (data.status === 'deleted') {
            return;
          }
          
          const birthDate = new Date(data.date_of_birth);
          const today = new Date();
          const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                           (today.getMonth() - birthDate.getMonth());

          allChildren.push({
            child_id: data.child_id,
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            age_months: ageMonths,
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        });

        // Sort on client side by creation date (newest first)
        const children = allChildren
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        await this.logAccess('READ', 'children_list', this.userId);
        return children;
      }

    } catch (error) {
      await this.logAccess('READ', 'children_list', this.userId || '', false, error.message);
      console.error('Failed to get user children:', error);
      throw error;
    }
  }

  /**
   * Get detailed child profile
   */
  async getChildProfile(childId: string): Promise<ChildProfile | null> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(firestore, 'children', childId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await this.logAccess('READ', 'child_profile', childId, false, 'Child not found');
        return null;
      }

      const data = docSnap.data();

      // Verify user has access
      if (data.parent_user_id !== this.userId) {
        await this.logAccess('READ', 'child_profile', childId, false, 'Access denied');
        throw new Error('Access denied to child profile');
      }

      await this.logAccess('READ', 'child_profile', childId);
      return data as ChildProfile;

    } catch (error) {
      await this.logAccess('READ', 'child_profile', childId, false, error.message);
      console.error('Failed to get child profile:', error);
      throw error;
    }
  }

  /**
   * Update child profile
   */
  async updateChildProfile(childId: string, updateData: Partial<ChildProfile>): Promise<boolean> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      // Verify access first
      const existingProfile = await this.getChildProfile(childId);
      if (!existingProfile) {
        return false;
      }

      // Remove sensitive fields that shouldn't be updated
      const { child_id, parent_user_id, created_at, ...safeUpdateData } = updateData;

      // Add update timestamp
      const finalUpdateData = {
        ...safeUpdateData,
        updated_at: serverTimestamp()
      };

      const docRef = doc(firestore, 'children', childId);
      await updateDoc(docRef, finalUpdateData);

      await this.logAccess('UPDATE', 'child_profile', childId);
      return true;

    } catch (error) {
      await this.logAccess('UPDATE', 'child_profile', childId, false, error.message);
      console.error('Failed to update child profile:', error);
      throw error;
    }
  }

  /**
   * Create symptom log entry
   */
  async createSymptomLog(symptomLog: Omit<SymptomLogEntry, 'log_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      // Verify access to child
      const childProfile = await this.getChildProfile(symptomLog.child_id);
      if (!childProfile) {
        throw new Error('Access denied to child profile');
      }

      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const logEntry: Partial<SymptomLogEntry> = {
        ...symptomLog,
        log_id: logId,
        created_at: serverTimestamp() as any,
        updated_at: serverTimestamp() as any,
        data_classification: 'PHI'
      };

      const docRef = doc(firestore, 'symptom_logs', logId);
      await updateDoc(docRef, logEntry);

      await this.logAccess('CREATE', 'symptom_log', logId);
      return logId;

    } catch (error) {
      await this.logAccess('CREATE', 'symptom_log', '', false, error.message);
      console.error('Failed to create symptom log:', error);
      throw error;
    }
  }

  /**
   * Get symptom logs for a child
   */
  async getChildSymptomLogs(
    childId: string,
    startDate?: string,
    endDate?: string,
    limitCount: number = 50
  ): Promise<SymptomLogEntry[]> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      // Verify access to child
      const childProfile = await this.getChildProfile(childId);
      if (!childProfile) {
        throw new Error('Access denied to child profile');
      }

      // Use simplified query to avoid index requirements
      const q = query(
        collection(firestore, 'symptom_logs'),
        where('child_id', '==', childId)
      );

      const querySnapshot = await getDocs(q);
      const allLogs: SymptomLogEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const logDate = data.log_date instanceof Date ? data.log_date : new Date(data.log_date);
        
        // Apply date filters on client side
        if (startDate && logDate < new Date(startDate)) return;
        if (endDate && logDate > new Date(endDate)) return;

        allLogs.push({
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
          log_date: logDate.toISOString()
        } as SymptomLogEntry);
      });

      // Sort by date descending and apply limit on client side
      const logs = allLogs
        .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())
        .slice(0, limitCount);

      await this.logAccess('READ', 'symptom_logs', childId);
      return logs;

    } catch (error) {
      await this.logAccess('READ', 'symptom_logs', childId, false, error.message);
      console.error('Failed to get symptom logs:', error);
      throw error;
    }
  }

  /**
   * Upload photo with encryption
   */
  async uploadPhoto(
    childId: string,
    photoFile: Blob,
    metadata: Partial<PhotoEntry>
  ): Promise<PhotoEntry> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      // Verify access to child
      const childProfile = await this.getChildProfile(childId);
      if (!childProfile) {
        throw new Error('Access denied to child profile');
      }

      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storagePath = `children/${childId}/photos/${photoId}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, photoFile, {
        customMetadata: {
          childId,
          userId: this.userId,
          photoType: metadata.photo_type || 'general',
          encrypted: 'true'
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create photo entry
      const photoEntry: Partial<PhotoEntry> = {
        photo_id: photoId,
        child_id: childId,
        log_entry_id: metadata.log_entry_id,
        storage_path: storagePath,
        original_filename: metadata.original_filename || 'photo.jpg',
        file_size: photoFile.size,
        mime_type: photoFile.type,
        photo_type: metadata.photo_type || 'general',
        body_area: metadata.body_area,
        severity_rating: metadata.severity_rating,
        description: metadata.description,
        tags: metadata.tags || [],
        taken_at: new Date().toISOString(),
        encryption_key: photoId, // Use photo ID as encryption reference
        access_permissions: {
          parent: true,
          healthcare_provider: false,
          emergency_contact: false
        },
        created_at: serverTimestamp() as any,
        updated_at: serverTimestamp() as any,
        data_classification: 'PHI'
      };

      // Save photo metadata
      const docRef = doc(firestore, 'photos', photoId);
      await updateDoc(docRef, photoEntry);

      await this.logAccess('CREATE', 'photo', photoId);
      return photoEntry as PhotoEntry;

    } catch (error) {
      await this.logAccess('CREATE', 'photo', '', false, error.message);
      console.error('Failed to upload photo:', error);
      throw error;
    }
  }

  /**
   * Create a daily log entry for a child
   */
  async createDailyLog(childId: string, logData: DailyLogForm): Promise<DailyLog> {
    console.log('=== FIREBASE SERVICE: createDailyLog CALLED ===');
    console.log('Child ID:', childId);
    console.log('Log data:', JSON.stringify(logData, null, 2));
    
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      // Generate log ID
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Create daily log object
      const dailyLog: DailyLog = {
        id: logId,
        childId: childId,
        date: today,
        symptoms: logData.symptoms,
        mood: logData.mood,
        triggers: logData.triggers,
        notes: logData.notes,
        createdAt: new Date().toISOString()
      };

      console.log('Daily log object created:', JSON.stringify(dailyLog, null, 2));

      if (this.isTestMode) {
        // Use mock operations in test mode
        console.log('Using mock Firestore operations for daily log');
        await this.mockSetDoc(`daily_logs/${logId}`, dailyLog);
        
        // Update child's logs list
        const childDoc = await this.mockGetDoc(`children/${childId}`);
        
        if (childDoc.exists()) {
          const childData = childDoc.data();
          const existingLogs = childData.daily_logs || [];
          await this.mockUpdateDoc(`children/${childId}`, {
            daily_logs: [...existingLogs, logId],
            updated_at: new Date().toISOString()
          });
        }
      } else {
        // Use real Firestore operations
        const docRef = doc(firestore, 'daily_logs', logId);
        await setDoc(docRef, dailyLog);
        
        // Update child's logs list
        const childRef = doc(firestore, 'children', childId);
        const childDoc = await getDoc(childRef);
        
        if (childDoc.exists()) {
          const childData = childDoc.data();
          const existingLogs = childData.daily_logs || [];
          await updateDoc(childRef, {
            daily_logs: [...existingLogs, logId],
            updated_at: serverTimestamp()
          });
        }
      }

      await this.logAccess('CREATE', 'daily_log', logId);
      console.log('Daily log created successfully');
      
      return dailyLog;

    } catch (error) {
      console.error('=== FIREBASE SERVICE ERROR ===');
      console.error('Failed to create daily log:', error);
      
      await this.logAccess('CREATE', 'daily_log', '', false, error.message);
      throw error;
    }
  }

  /**
   * Get daily logs for a child
   */
  async getChildDailyLogs(childId: string, limitCount: number = 20): Promise<DailyLog[]> {
    console.log('=== FIREBASE SERVICE: getChildDailyLogs CALLED ===');
    console.log('Child ID:', childId);
    
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }

      const logs: DailyLog[] = [];

      if (this.isTestMode) {
        // Use mock operations in test mode
        console.log('Getting child daily logs from mock database');
        
        // Get child document to find log IDs
        const childDoc = await this.mockGetDoc(`children/${childId}`);
        if (childDoc.exists()) {
          const childData = childDoc.data();
          const logIds = childData.daily_logs || [];
          
          // Get each log document
          for (const logId of logIds.slice(-limitCount)) { // Get most recent logs
            const logDoc = await this.mockGetDoc(`daily_logs/${logId}`);
            if (logDoc.exists()) {
              logs.push(logDoc.data() as DailyLog);
            }
          }
        }
        
        // Sort by date descending
        logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      } else {
        // Use simplified Firestore query to avoid index requirements
        // First, try to get all logs for this child without complex ordering
        const q = query(
          collection(firestore, 'daily_logs'),
          where('childId', '==', childId)
        );

        const querySnapshot = await getDocs(q);
        const allLogs: DailyLog[] = [];
        querySnapshot.forEach((doc) => {
          allLogs.push(doc.data() as DailyLog);
        });

        // Sort on client side and apply limit
        allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        logs.push(...allLogs.slice(0, limitCount));
      }

      await this.logAccess('READ', 'daily_logs', childId);
      console.log(`Retrieved ${logs.length} daily logs for child ${childId}`);
      
      return logs;

    } catch (error) {
      console.error('Failed to get child daily logs:', error);
      await this.logAccess('READ', 'daily_logs', childId, false, error.message);
      throw error;
    }
  }

  /**
   * Get user's children IDs helper
   */
  private async getUserChildrenIds(): Promise<string[]> {
    try {
      if (!this.userId) return [];

      const userRef = doc(firestore, 'users', this.userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data().children_ids || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get user children IDs:', error);
      return [];
    }
  }

  /**
   * Clean up and flush any remaining logs
   */
  async cleanup() {
    await this.flushAccessLogs();
  }

  /**
   * Manual log flush for debugging
   */
  async flushLogs() {
    await this.flushAccessLogs();
    console.log('Logs flushed manually');
  }

  /**
   * Debug function to view mock database contents
   */
  async debugViewDatabase() {
    if (!this.isTestMode) {
      console.log('Debug view only available in test mode');
      return {};
    }

    // Flush any pending logs first
    await this.flushAccessLogs();
    await this.loadMockData();
    
    const data = Object.fromEntries(this.mockDatabase);
    console.log('=== MOCK DATABASE CONTENTS ===');
    console.log('Total entries:', Object.keys(data).length);
    
    // Organize by type
    const children = Object.entries(data).filter(([key]) => key.startsWith('children/'));
    const users = Object.entries(data).filter(([key]) => key.startsWith('users/'));
    const logs = Object.entries(data).filter(([key]) => key.startsWith('access_logs/'));
    const dailyLogs = Object.entries(data).filter(([key]) => key.startsWith('daily_logs/'));
    
    console.log('\n--- CHILDREN ---');
    children.forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    
    console.log('\n--- USERS ---');
    users.forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    
    console.log('\n--- DAILY LOGS ---');
    console.log(`Found ${dailyLogs.length} daily log entries:`);
    dailyLogs.forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    
    console.log('\n--- ACCESS LOGS ---');
    console.log(`Found ${logs.length} access log entries:`);
    logs.forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    
    // Also show current queue
    console.log('\n--- PENDING LOG QUEUE ---');
    console.log(`Queue length: ${this.accessLogQueue.length}`);
    this.accessLogQueue.forEach((log, index) => {
      console.log(`Queue[${index}]:`, log);
    });
    
    return {
      database: data,
      logQueue: this.accessLogQueue,
      totalEntries: Object.keys(data).length,
      logEntries: logs.length,
      dailyLogEntries: dailyLogs.length
    };
  }
}

// Export singleton instance
export const firebaseService = new HIPAAFirebaseService();
