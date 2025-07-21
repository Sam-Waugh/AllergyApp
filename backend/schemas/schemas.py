from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Dict, Any

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Child schemas
class ChildBase(BaseModel):
    name: str
    date_of_birth: datetime
    gender: str
    known_allergies: Optional[List[str]] = []
    medications: Optional[List[str]] = []
    medical_conditions: Optional[List[str]] = []
    emergency_contact: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None

class ChildCreate(ChildBase):
    pass

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    known_allergies: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    medical_conditions: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None

class ChildResponse(ChildBase):
    id: int
    parent_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Daily Log schemas
class DailyLogBase(BaseModel):
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

class DailyLogCreate(DailyLogBase):
    child_id: int

class DailyLogUpdate(BaseModel):
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

class DailyLogResponse(DailyLogBase):
    id: int
    child_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Photo Entry schemas
class PhotoEntryBase(BaseModel):
    photo_type: str = "general"  # 'eczema', 'rash', 'hives', 'general', 'medication', 'food'
    body_area: Optional[str] = None
    severity_rating: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    associated_symptoms: Optional[List[str]] = []
    symptom_duration: Optional[str] = None  # "new", "improving", "worsening", "chronic"
    is_sensitive: bool = True
    shared_with_doctor: bool = False
    taken_at: Optional[datetime] = None

class PhotoEntryCreate(PhotoEntryBase):
    child_id: int
    daily_log_id: Optional[int] = None

class PhotoEntryUpdate(BaseModel):
    photo_type: Optional[str] = None
    body_area: Optional[str] = None
    severity_rating: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    associated_symptoms: Optional[List[str]] = None
    symptom_duration: Optional[str] = None
    is_sensitive: Optional[bool] = None
    shared_with_doctor: Optional[bool] = None

class PhotoEntryResponse(PhotoEntryBase):
    id: int
    child_id: int
    daily_log_id: Optional[int] = None
    date: datetime
    photo_url: str
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Research Article schemas
class ResearchArticleResponse(BaseModel):
    id: int
    title: str
    summary: str
    source: str
    publication_date: datetime
    url: str
    tags: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Enhanced Environment data schemas
class PollenTypeData(BaseModel):
    code: str
    display_name: str
    index_value: int
    category: str  # "NONE", "VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"
    color: Dict[str, float]  # RGB color values (0.0 to 1.0 from Google API)
    in_season: bool
    health_recommendations: Optional[List[str]] = []
    health_impact: Optional[str] = ""
    severity_level: Optional[int] = 0
    plant_info: Optional[Dict[str, Any]] = {}

class DailyPollenForecast(BaseModel):
    date: str
    day_name: str
    pollen_types: List[PollenTypeData]
    overall_index: int
    dominant_pollen: str

class PollenSummary(BaseModel):
    today_dominant: str
    today_index: int
    forecast_days: int
    peak_day: str

class HeatmapTile(BaseModel):
    url: str
    x: int
    y: int
    offset_x: Optional[int] = 0
    offset_y: Optional[int] = 0

class HeatmapTileInfo(BaseModel):
    display_name: str
    main_tile: Dict[str, Any]
    surrounding_tiles: List[HeatmapTile]
    tile_template: str

class PollenHeatmapData(BaseModel):
    center: Dict[str, Any]  # lat, lon, zoom
    tiles: Dict[str, HeatmapTileInfo]  # tree_upi, grass_upi, weed_upi

# Legacy compatibility
class PollenForecast(BaseModel):
    date: str
    pollen_types: List[PollenTypeData]

class PollenHeatmapInfo(BaseModel):
    center_tile: HeatmapTile
    surrounding_tiles: List[HeatmapTile]

class EnvironmentDataResponse(BaseModel):
    location: str
    latitude: float
    longitude: float
    weather_conditions: str
    temperature: float
    humidity: float
    air_quality_index: int
    uv_index: int
    
    # Enhanced pollen data from Google Maps Pollen API
    pollen_data: Optional[Dict[str, Any]] = None
    daily_pollen_info: Optional[List[DailyPollenForecast]] = None
    plant_descriptions: Optional[List[Dict[str, Any]]] = None
    region_code: Optional[str] = None
    pollen_summary: Optional[PollenSummary] = None
    heatmap_tiles: Optional[PollenHeatmapData] = None
    
    # Legacy field for backward compatibility
    pollen_count: str = "moderate"
    
    # Future enhancements ready
    weather_forecast: Optional[List[Dict[str, Any]]] = None
    air_quality_forecast: Optional[List[Dict[str, Any]]] = None
    
# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# API Response schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

# Enhanced Daily Tracker Schemas
class SymptomEntry(BaseModel):
    """Individual symptom with severity"""
    name: str
    severity: int  # 1-10 scale
    notes: Optional[str] = None

class TriggerEntry(BaseModel):
    """Potential trigger with confidence level"""
    name: str
    confidence: str = "suspected"  # "confirmed", "suspected", "unlikely"
    notes: Optional[str] = None

class MedicationEntry(BaseModel):
    """Medication taken with timing"""
    name: str
    dose: str
    time: str  # "08:00" format
    effectiveness: Optional[int] = None  # 1-10 scale
    notes: Optional[str] = None

class FoodEntry(BaseModel):
    """Food consumed with reaction tracking"""
    name: str
    time: str
    amount: Optional[str] = None
    had_reaction: bool = False
    reaction_severity: Optional[int] = None
    notes: Optional[str] = None

class ActivityEntry(BaseModel):
    """Activity with duration and impact"""
    name: str
    duration: Optional[str] = None
    location: Optional[str] = None  # "indoor", "outdoor", "specific location"
    symptom_impact: Optional[str] = None  # "better", "worse", "no_change"

# Enhanced Daily Log Schemas
class EnhancedDailyLogBase(BaseModel):
    date: datetime
    
    # Comprehensive Symptoms
    symptoms: Optional[List[str]] = []
    symptom_details: Optional[List[SymptomEntry]] = []
    
    # Triggers
    triggers: Optional[List[str]] = []
    trigger_details: Optional[List[TriggerEntry]] = []
    suspected_triggers: Optional[List[str]] = []
    
    # Mood and Well-being
    mood: Optional[str] = "neutral"  # "great", "good", "neutral", "tired", "irritable"
    mood_scale: Optional[int] = 5  # 1-10 scale
    energy_level: Optional[int] = 5  # 1-10 scale
    sleep_quality: Optional[str] = "fair"
    sleep_hours: Optional[float] = None
    
    # Activities and Lifestyle
    activities: Optional[List[str]] = []
    activity_details: Optional[List[ActivityEntry]] = []
    foods_consumed: Optional[List[str]] = []
    food_details: Optional[List[FoodEntry]] = []
    medications_taken: Optional[List[str]] = []
    medication_details: Optional[List[MedicationEntry]] = []
    
    # Environmental (auto-populated from pollen API)
    weather_conditions: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_quality_index: Optional[int] = None
    pollen_count: Optional[str] = None
    pollen_data: Optional[Dict[str, Any]] = None
    
    # Notes
    symptoms_notes: Optional[str] = None
    trigger_notes: Optional[str] = None
    general_notes: Optional[str] = None
    parent_observations: Optional[str] = None
    
    # Legacy fields for backward compatibility
    eczema_severity: Optional[str] = "none"
    asthma_severity: Optional[str] = "none"
    allergic_reaction_severity: Optional[str] = "none"
    overall_mood: Optional[str] = "good"
    stress_level: Optional[str] = "low"

class EnhancedDailyLogCreate(EnhancedDailyLogBase):
    child_id: int

class EnhancedDailyLogUpdate(BaseModel):
    # Allow partial updates of any field
    date: Optional[datetime] = None
    symptoms: Optional[List[str]] = None
    symptom_details: Optional[List[SymptomEntry]] = None
    triggers: Optional[List[str]] = None
    trigger_details: Optional[List[TriggerEntry]] = None
    suspected_triggers: Optional[List[str]] = None
    mood: Optional[str] = None
    mood_scale: Optional[int] = None
    energy_level: Optional[int] = None
    sleep_quality: Optional[str] = None
    sleep_hours: Optional[float] = None
    activities: Optional[List[str]] = None
    activity_details: Optional[List[ActivityEntry]] = None
    foods_consumed: Optional[List[str]] = None
    food_details: Optional[List[FoodEntry]] = None
    medications_taken: Optional[List[str]] = None
    medication_details: Optional[List[MedicationEntry]] = None
    symptoms_notes: Optional[str] = None
    trigger_notes: Optional[str] = None
    general_notes: Optional[str] = None
    parent_observations: Optional[str] = None

class EnhancedDailyLogResponse(EnhancedDailyLogBase):
    id: int
    child_id: int
    photo_count: int
    photos: Optional[List['PhotoEntryResponse']] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Update forward references  
EnhancedDailyLogResponse.model_rebuild()

# Report Generation schemas
class ReportGenerationRequest(BaseModel):
    child_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_photos: bool = False
    report_type: str = "comprehensive"  # "comprehensive", "summary", "medical_history"

class FirestoreReportGenerationRequest(BaseModel):
    child_id: str  # Firestore document ID (string)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    include_photos: bool = False
    report_type: str = "comprehensive"  # "comprehensive", "summary", "medical_history"

class PatientDetails(BaseModel):
    name: str
    date_of_birth: datetime
    age_months: int
    gender: str
    emergency_contact: Optional[str] = None
    parent_name: str
    parent_email: str

class MedicalHistory(BaseModel):
    known_allergies: List[str]
    medications: List[str]
    medical_conditions: List[str]
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None

class ReactionSummary(BaseModel):
    date: datetime
    symptoms: List[str]
    severity_level: str  # "mild", "moderate", "severe"
    triggers: List[str]
    treatments_given: List[str]
    notes: str

class AllergyInfo(BaseModel):
    allergen: str
    status: str  # "diagnosed", "suspected"
    severity: str  # "mild", "moderate", "severe"
    last_reaction_date: Optional[datetime] = None
    testing_date: Optional[datetime] = None
    in_treatment: bool = False
    avoidance_measures: List[str] = []

class ManagementPlan(BaseModel):
    emergency_action_plan: str
    daily_medications: List[str]
    rescue_medications: List[str]
    environmental_controls: List[str]
    dietary_restrictions: List[str]
    follow_up_recommendations: List[str]

class PlannedAppointment(BaseModel):
    appointment_type: str
    scheduled_date: Optional[datetime] = None
    provider: str
    purpose: str
    notes: str

class GeneratedReport(BaseModel):
    report_id: str
    generated_at: datetime
    report_type: str
    patient_details: PatientDetails
    medical_history: MedicalHistory
    reaction_history: List[ReactionSummary]
    allergy_testing: List[str]
    diagnosed_allergies: List[AllergyInfo]
    suspected_allergies: List[AllergyInfo]
    allergies_in_treatment: List[AllergyInfo]
    current_management_plan: ManagementPlan
    planned_appointments: List[PlannedAppointment]
    summary: str
    recommendations: List[str]
    priority_concerns: List[str]
    
class ReportResponse(BaseModel):
    success: bool
    report: Optional[GeneratedReport] = None
    report_text: Optional[str] = None
    error_message: Optional[str] = None
