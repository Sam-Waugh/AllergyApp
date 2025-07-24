/**
 * TypeScript models for HIPAA-compliant child profiles and medical data.
 * 
 * These models ensure type safety for Protected Health Information (PHI)
 * and maintain consistency with backend Firestore models.
 */

export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type SeverityType = 'none' | 'mild' | 'moderate' | 'severe' | 'critical';
export type AllergyType = 'ige' | 'non_ige';
export type MoodType = 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';

// Base interface for HIPAA compliance tracking
export interface HIPAABaseModel {
  created_at: string;
  updated_at: string;
  last_accessed?: string;
  access_log?: AccessLogEntry[];
  encryption_key_id?: string;
  data_classification: string;
}

// Access log entry for audit trail
export interface AccessLogEntry {
  user_id: string;
  action: string;
  timestamp: string;
  ip_address?: string;
  session_id?: string;
}

// Emergency contact information
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
}

// Medical provider information
export interface MedicalProvider {
  name: string;
  specialty?: string;
  practice_name?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

// Allergy information
export interface AllergyInfo {
  allergen: string;
  allergy_type: AllergyType; // Changed from severity to allergy_type
  reaction_type: string[];
  first_occurrence?: string;
  last_occurrence?: string;
  treatment?: string;
  notes?: string;
  verified_by_doctor: boolean;
}

// Medication information
export interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
  purpose?: string;
  side_effects: string[];
  notes?: string;
  active: boolean;
}

// Allergic reaction entry
export interface AllergicReactionEntry {
  reaction_id?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  allergen: string; // What caused the reaction
  symptoms: string[]; // List of symptoms experienced
  severity: SeverityType; // none, mild, moderate, severe, critical
  treatment_given: string[]; // Medications/treatments administered
  location?: string; // Where the reaction occurred
  healthcare_provider?: string; // Doctor/hospital that treated
  notes?: string;
  resolved_date?: string; // When symptoms fully resolved
  follow_up_required?: boolean;
}

// Family medical history information
export interface FamilyMedicalHistoryInfo {
  condition: string;
  relation: string; // mother, father, maternal grandmother, etc.
  age_of_onset?: number;
  notes?: string;
  is_hereditary?: boolean;
}

// Child profile interface
export interface ChildProfile extends HIPAABaseModel {
  child_id: string;
  parent_user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: GenderType;
  
  // Medical information
  known_allergies: AllergyInfo[];
  current_medications: MedicationInfo[];
  allergic_reactions: AllergicReactionEntry[];
  medical_conditions: string[];
  family_medical_history: FamilyMedicalHistoryInfo[];
  medical_notes?: string;
  
  // Contact information
  emergency_contacts: EmergencyContact[];
  primary_doctor?: MedicalProvider;
  specialists: MedicalProvider[];
  
  // Preferences and settings
  notification_preferences: {
    daily_reminders: boolean;
    medication_alerts: boolean;
    appointment_reminders: boolean;
    emergency_notifications: boolean;
  };
  
  // Privacy and consent
  data_sharing_consent: {
    healthcare_providers: boolean;
    research_studies: boolean;
    emergency_services: boolean;
  };
  hipaa_consent_date?: string;
}

// Symptom log entry
export interface SymptomLogEntry extends HIPAABaseModel {
  log_id: string;
  child_id: string;
  log_date: string;
  
  // Symptoms and severity (0-4 scale)
  symptoms: Record<string, number>;
  symptom_notes?: string;
  
  // Triggers and environmental factors
  suspected_triggers: string[];
  environmental_notes?: string;
  
  // Medications taken
  medications_taken: Array<{
    medication: string;
    time: string;
    dose: string;
    notes?: string;
  }>;
  
  // Mood and well-being
  mood?: MoodType;
  energy_level?: number; // 1-10 scale
  sleep_quality?: MoodType;
  sleep_hours?: number;
  
  // Activities
  activities: string[];
  foods_consumed: Array<{
    food: string;
    time: string;
    reaction: boolean;
    notes?: string;
  }>;
  
  // Environmental data
  weather_conditions?: string;
  temperature?: number;
  humidity?: number;
  air_quality_index?: number;
  pollen_data?: Record<string, any>;
  
  // Photo references
  photo_ids: string[];
  
  // Parent observations
  parent_notes?: string;
}

// Photo entry
export interface PhotoEntry extends HIPAABaseModel {
  photo_id: string;
  child_id: string;
  log_entry_id?: string;
  
  // Photo information
  storage_path: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  
  // Medical classification
  photo_type: string;
  body_area?: string;
  severity_rating?: number; // 0-4 scale
  
  // Metadata
  description?: string;
  tags: string[];
  taken_at: string;
  
  // Privacy and security
  encryption_key: string;
  access_permissions: {
    parent: boolean;
    healthcare_provider: boolean;
    emergency_contact: boolean;
  };
}

// User profile
export interface UserProfile extends HIPAABaseModel {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  
  // Children associated with this user
  children_ids: string[];
  
  // Account settings
  account_settings: {
    notifications_enabled: boolean;
    data_backup_enabled: boolean;
    analytics_consent: boolean;
  };
  
  // HIPAA compliance
  hipaa_training_completed: boolean;
  hipaa_training_date?: string;
  terms_accepted: boolean;
  terms_accepted_date?: string;
}

// API Request/Response models
export interface CreateChildRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: GenderType;
  
  // Optional medical information
  known_allergies?: AllergyInfo[];
  current_medications?: MedicationInfo[];
  allergic_reactions?: AllergicReactionEntry[];
  medical_conditions?: string[];
  medical_notes?: string;
  family_medical_history?: FamilyMedicalHistoryInfo[];
  
  // Contact information
  emergency_contacts?: EmergencyContact[];
  primary_doctor?: MedicalProvider;
}

export interface UpdateChildRequest {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: GenderType;
  
  // Medical information
  allergies?: AllergyInfo[];
  medications?: MedicationInfo[];
  allergic_reactions?: AllergicReactionEntry[];
  medical_history?: string;
  notes?: string;
  family_medical_history?: FamilyMedicalHistoryInfo[];
  
  // Contact information
  emergency_contacts?: EmergencyContact[];
  primary_doctor?: MedicalProvider;
}

export interface ChildResponse {
  child_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: GenderType;
  age_months: number;
  created_at: string;
}

// Form validation helpers
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}

// Common symptom types
export const COMMON_SYMPTOMS = [
  'runny_nose',
  'stuffy_nose',
  'sneezing',
  'itchy_eyes',
  'watery_eyes',
  'coughing',
  'wheezing',
  'shortness_of_breath',
  'chest_tightness',
  'skin_rash',
  'eczema_flare',
  'hives',
  'itchy_skin',
  'red_skin',
  'swelling',
  'headache',
  'fatigue',
  'irritability'
] as const;

export type SymptomType = typeof COMMON_SYMPTOMS[number];

// Common allergens
export const COMMON_ALLERGENS = [
  'pollen',
  'dust_mites',
  'pet_dander',
  'mold',
  'food_allergens',
  'milk',
  'eggs',
  'peanuts',
  'tree_nuts',
  'soy',
  'wheat',
  'fish',
  'shellfish',
  'latex',
  'insect_stings',
  'medications'
] as const;

export type AllergenType = typeof COMMON_ALLERGENS[number];

// Body areas for photo classification
export const BODY_AREAS = [
  'face',
  'scalp',
  'neck',
  'chest',
  'back',
  'arms',
  'hands',
  'legs',
  'feet',
  'abdomen',
  'other'
] as const;

export type BodyAreaType = typeof BODY_AREAS[number];

// Family relations for medical history
export const FAMILY_RELATIONS = [
  'mother',
  'father',
  'maternal_grandmother',
  'maternal_grandfather',
  'paternal_grandmother',
  'paternal_grandfather',
  'maternal_aunt',
  'maternal_uncle',
  'paternal_aunt',
  'paternal_uncle',
  'sibling',
  'cousin',
  'other'
] as const;

export type FamilyRelationType = typeof FAMILY_RELATIONS[number];

// Common hereditary medical conditions
export const COMMON_HEREDITARY_CONDITIONS = [
  'allergies',
  'asthma',
  'eczema',
  'diabetes_type1',
  'diabetes_type2',
  'heart_disease',
  'high_blood_pressure',
  'high_cholesterol',
  'cancer',
  'depression',
  'anxiety',
  'autoimmune_disorders',
  'thyroid_disorders',
  'kidney_disease',
  'celiac_disease',
  'food_allergies',
  'environmental_allergies',
  'seasonal_allergies',
  'migraine',
  'obesity',
  'other'
] as const;

export type HereditaryConditionType = typeof COMMON_HEREDITARY_CONDITIONS[number];

// Common allergic reaction symptoms
export const ALLERGIC_REACTION_SYMPTOMS = [
  'hives',
  'itching',
  'rash',
  'swelling_face',
  'swelling_lips',
  'swelling_tongue',
  'swelling_throat',
  'difficulty_breathing',
  'wheezing',
  'coughing',
  'runny_nose',
  'sneezing',
  'watery_eyes',
  'red_eyes',
  'nausea',
  'vomiting',
  'diarrhea',
  'stomach_cramps',
  'dizziness',
  'fainting',
  'rapid_pulse',
  'low_blood_pressure',
  'anaphylaxis',
  'loss_of_consciousness'
] as const;

export type AllergicReactionSymptomType = typeof ALLERGIC_REACTION_SYMPTOMS[number];

// Common treatments for allergic reactions
export const ALLERGIC_REACTION_TREATMENTS = [
  'antihistamine_oral',
  'antihistamine_topical',
  'epinephrine_auto_injector',
  'corticosteroid_oral',
  'corticosteroid_topical',
  'bronchodilator',
  'cold_compress',
  'cool_bath',
  'moisturizer',
  'avoid_trigger',
  'emergency_room',
  'call_911',
  'inhaler',
  'eye_drops',
  'nasal_spray',
  'no_treatment_needed'
] as const;

export type AllergicReactionTreatmentType = typeof ALLERGIC_REACTION_TREATMENTS[number];
