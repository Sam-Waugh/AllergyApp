"""
Firestore-specific schemas using string IDs instead of integers.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Dict, Any, Union

# User schemas for Firestore
class FirestoreUserBase(BaseModel):
    email: EmailStr
    full_name: str

class FirestoreUserCreate(FirestoreUserBase):
    password: str

class FirestoreUserResponse(FirestoreUserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Child schemas for Firestore
class FirestoreChildBase(BaseModel):
    name: str
    date_of_birth: datetime
    gender: str
    known_allergies: Optional[List[str]] = []
    medications: Optional[List[str]] = []
    medical_conditions: Optional[List[str]] = []
    emergency_contact: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None

class FirestoreChildCreate(FirestoreChildBase):
    pass

class FirestoreChildUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    known_allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None

class FirestoreChildResponse(FirestoreChildBase):
    id: str
    parent_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Daily Log schemas for Firestore
class FirestoreDailyLogBase(BaseModel):
    date: datetime
    eczema_severity: Optional[str] = "none"
    asthma_severity: Optional[str] = "none"
    allergic_reaction_severity: Optional[str] = "none"
    overall_mood: Optional[str] = "good"
    foods_consumed: Optional[List[str]] = []
    activities: Optional[List[str]] = []
    medications_taken: Optional[List[str]] = []
    sleep_quality: Optional[str] = "good"
    stress_level: Optional[str] = "low"
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_quality_index: Optional[int] = None
    pollen_count: Optional[str] = None
    symptoms_notes: Optional[str] = None
    trigger_notes: Optional[str] = None

class FirestoreDailyLogCreate(FirestoreDailyLogBase):
    child_id: str

class FirestoreDailyLogUpdate(BaseModel):
    date: Optional[datetime] = None
    eczema_severity: Optional[str] = None
    asthma_severity: Optional[str] = None
    allergic_reaction_severity: Optional[str] = None
    overall_mood: Optional[str] = None
    foods_consumed: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    medications_taken: Optional[List[str]] = None
    sleep_quality: Optional[str] = None
    stress_level: Optional[str] = None
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_quality_index: Optional[int] = None
    pollen_count: Optional[str] = None
    symptoms_notes: Optional[str] = None
    trigger_notes: Optional[str] = None

class FirestoreDailyLogResponse(FirestoreDailyLogBase):
    id: str
    child_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# API Response for Firestore operations
class FirestoreAPIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

# Token schemas (same for both SQLAlchemy and Firestore)
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
