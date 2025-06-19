from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/test")
async def test_environment_endpoint(current_user: User = Depends(get_current_user)):
    """Simple test endpoint to verify authentication works"""
    return {
        "success": True,
        "message": "Environment endpoint working",
        "user_email": current_user.email
    }

@router.get("/simple-weather")
async def get_simple_weather(current_user: User = Depends(get_current_user)):
    """Simple weather endpoint without Google API"""
    return {
        "location": "New York, NY",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "weather_conditions": "partly_cloudy",
        "temperature": 22.5,
        "humidity": 65.0,
        "air_quality_index": 45,
        "pollen_count": "moderate",
        "uv_index": 6,
        "pollen_data": None,
        "daily_pollen_info": None,
        "plant_description": None
    }
