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
    date: datetime
    photo_type: str
    body_area: Optional[str] = None
    severity_rating: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class PhotoEntryCreate(PhotoEntryBase):
    child_id: int

class PhotoEntryResponse(PhotoEntryBase):
    id: int
    child_id: int
    photo_url: str
    created_at: datetime
    
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
    color: Dict[str, int]  # RGB color values
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
