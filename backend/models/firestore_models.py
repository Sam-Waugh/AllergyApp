"""
Firestore models for HIPAA-compliant patient data storage.

This module defines Pydantic models for structured data storage in Firestore,
ensuring data validation and HIPAA compliance for Protected Health Information (PHI).
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import re

class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class SeverityEnum(str, Enum):
    NONE = "none"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class MoodEnum(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good" 
    FAIR = "fair"
    POOR = "poor"
    VERY_POOR = "very_poor"

class SymptomSeverityEnum(int, Enum):
    NONE = 0
    MILD = 1
    MODERATE = 2
    SEVERE = 3
    CRITICAL = 4

# Base model with HIPAA compliance fields
class HIPAABaseModel(BaseModel):
    """Base model with HIPAA compliance tracking."""
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: Optional[datetime] = None
    access_log: List[Dict[str, Any]] = Field(default_factory=list)
    encryption_key_id: Optional[str] = None
    data_classification: str = Field(default="PHI", description="HIPAA data classification")
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

# Emergency Contact Information
class EmergencyContact(BaseModel):
    """Emergency contact information with validation."""
    
    name: str = Field(..., min_length=1, max_length=100)
    relationship: str = Field(..., min_length=1, max_length=50)
    phone_primary: str = Field(..., pattern=r'^\+?1?\d{9,15}$')
    phone_secondary: Optional[str] = Field(None, pattern=r'^\+?1?\d{9,15}$')
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    
    @validator('phone_primary', 'phone_secondary')
    def validate_phone(cls, v):
        if v:
            # Remove all non-digit characters except +
            cleaned = re.sub(r'[^\d+]', '', v)
            if len(cleaned) < 10:
                raise ValueError('Phone number must have at least 10 digits')
        return v

# Medical Provider Information
class MedicalProvider(BaseModel):
    """Medical provider information with contact details."""
    
    name: str = Field(..., min_length=1, max_length=100)
    specialty: Optional[str] = Field(None, max_length=100)
    practice_name: Optional[str] = Field(None, max_length=150)
    phone: str = Field(..., pattern=r'^\+?1?\d{9,15}$')
    email: Optional[str] = Field(None, pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    address: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)

# Allergy Information
class AllergyInfo(BaseModel):
    """Structured allergy information."""
    
    allergen: str = Field(..., min_length=1, max_length=100)
    severity: SeverityEnum = SeverityEnum.MILD
    reaction_type: List[str] = Field(default_factory=list)  # hives, swelling, breathing_difficulty, etc.
    first_occurrence: Optional[date] = None
    last_occurrence: Optional[date] = None
    treatment: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    verified_by_doctor: bool = False

# Medication Information
class MedicationInfo(BaseModel):
    """Medication information with dosage and schedule."""
    
    name: str = Field(..., min_length=1, max_length=100)
    dosage: str = Field(..., min_length=1, max_length=50)
    frequency: str = Field(..., min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescribed_by: Optional[str] = Field(None, max_length=100)
    purpose: Optional[str] = Field(None, max_length=200)
    side_effects: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=1000)
    active: bool = True

# Child Profile Model
class ChildProfile(HIPAABaseModel):
    """HIPAA-compliant child profile with medical information."""
    
    # Basic Information
    child_id: str = Field(..., description="Unique identifier for the child")
    parent_user_id: str = Field(..., description="Parent's user ID")
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: date = Field(...)
    gender: GenderEnum = GenderEnum.PREFER_NOT_TO_SAY
    
    # Medical Information
    known_allergies: List[AllergyInfo] = Field(default_factory=list)
    current_medications: List[MedicationInfo] = Field(default_factory=list)
    medical_conditions: List[str] = Field(default_factory=list)
    medical_notes: Optional[str] = Field(None, max_length=2000)
    
    # Contact Information
    emergency_contacts: List[EmergencyContact] = Field(default_factory=list)
    primary_doctor: Optional[MedicalProvider] = None
    specialists: List[MedicalProvider] = Field(default_factory=list)
    
    # Preferences and Settings
    notification_preferences: Dict[str, bool] = Field(default_factory=lambda: {
        "daily_reminders": True,
        "medication_alerts": True,
        "appointment_reminders": True,
        "emergency_notifications": True
    })
    
    # Privacy and Consent
    data_sharing_consent: Dict[str, bool] = Field(default_factory=lambda: {
        "healthcare_providers": False,
        "research_studies": False,
        "emergency_services": True
    })
    hipaa_consent_date: Optional[datetime] = None
    
    @validator('date_of_birth')
    def validate_age(cls, v):
        today = date.today()
        if v > today:
            raise ValueError('Date of birth cannot be in the future')
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age > 18:
            raise ValueError('Child must be under 18 years old')
        return v

# Symptom Log Entry
class SymptomLogEntry(HIPAABaseModel):
    """Daily symptom log entry with comprehensive tracking."""
    
    log_id: str = Field(..., description="Unique identifier for the log entry")
    child_id: str = Field(..., description="Child's unique identifier")
    log_date: date = Field(...)
    
    # Symptoms and Severity
    symptoms: Dict[str, int] = Field(default_factory=dict)  # symptom_name: severity_0_to_4
    symptom_notes: Optional[str] = Field(None, max_length=1000)
    
    # Triggers and Environmental Factors
    suspected_triggers: List[str] = Field(default_factory=list)
    environmental_notes: Optional[str] = Field(None, max_length=500)
    
    # Medications Taken
    medications_taken: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Mood and Well-being
    mood: Optional[MoodEnum] = None
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_quality: Optional[MoodEnum] = None
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    
    # Activities
    activities: List[str] = Field(default_factory=list)
    foods_consumed: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Environmental Data
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_quality_index: Optional[int] = None
    pollen_data: Optional[Dict[str, Any]] = None
    
    # Photo References
    photo_ids: List[str] = Field(default_factory=list)
    
    # Parent Observations
    parent_notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('symptoms')
    def validate_symptoms(cls, v):
        for symptom, severity in v.items():
            if not 0 <= severity <= 4:
                raise ValueError(f'Symptom severity must be between 0-4, got {severity} for {symptom}')
        return v

# Photo Entry Model
class PhotoEntry(HIPAABaseModel):
    """HIPAA-compliant photo entry with metadata."""
    
    photo_id: str = Field(..., description="Unique identifier for the photo")
    child_id: str = Field(..., description="Child's unique identifier") 
    log_entry_id: Optional[str] = Field(None, description="Associated log entry ID")
    
    # Photo Information
    storage_path: str = Field(..., description="Encrypted storage path")
    original_filename: str = Field(...)
    file_size: int = Field(..., gt=0)
    mime_type: str = Field(...)
    
    # Medical Classification
    photo_type: str = Field(..., description="Type of medical photo")
    body_area: Optional[str] = Field(None, description="Body area depicted")
    severity_rating: Optional[int] = Field(None, ge=0, le=4)
    
    # Metadata
    description: Optional[str] = Field(None, max_length=500)
    tags: List[str] = Field(default_factory=list)
    taken_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Privacy and Security
    encryption_key: str = Field(..., description="Encryption key reference")
    access_permissions: Dict[str, bool] = Field(default_factory=lambda: {
        "parent": True,
        "healthcare_provider": False,
        "emergency_contact": False
    })

# User Profile Model
class UserProfile(HIPAABaseModel):
    """HIPAA-compliant user profile."""
    
    user_id: str = Field(..., description="Unique user identifier")
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = Field(None, pattern=r'^\+?1?\d{9,15}$')
    
    # Children associated with this user
    children_ids: List[str] = Field(default_factory=list)
    
    # Account Settings
    account_settings: Dict[str, Any] = Field(default_factory=lambda: {
        "notifications_enabled": True,
        "data_backup_enabled": True,
        "analytics_consent": False
    })
    
    # HIPAA Compliance
    hipaa_training_completed: bool = False
    hipaa_training_date: Optional[datetime] = None
    terms_accepted: bool = False
    terms_accepted_date: Optional[datetime] = None

# Request/Response Models for API
class CreateChildRequest(BaseModel):
    """Request model for creating a new child profile."""
    
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: date = Field(...)
    gender: GenderEnum = GenderEnum.PREFER_NOT_TO_SAY
    
    # Optional medical information
    known_allergies: List[AllergyInfo] = Field(default_factory=list)
    current_medications: List[MedicationInfo] = Field(default_factory=list)
    medical_conditions: List[str] = Field(default_factory=list)
    medical_notes: Optional[str] = Field(None, max_length=2000)
    
    # Contact information
    emergency_contacts: List[EmergencyContact] = Field(default_factory=list)
    primary_doctor: Optional[MedicalProvider] = None

class ChildResponse(BaseModel):
    """Response model for child profile data."""
    
    child_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: GenderEnum
    age_months: int
    created_at: datetime
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
