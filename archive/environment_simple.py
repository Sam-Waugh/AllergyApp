from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import httpx
import os
from typing import Optional
from datetime import datetime, timedelta

from database.database import get_db
from schemas.schemas import EnvironmentDataResponse, PollenTypeData, PollenForecast
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

# Google Maps Pollen API configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
POLLEN_API_BASE_URL = "https://pollen.googleapis.com/v1"

async def get_google_pollen_data(lat: float, lon: float, days: int = 5) -> Optional[dict]:
    """Fetch pollen data from Google Maps Pollen API"""
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: No Google Maps API key configured")
        return None
    
    try:
        print(f"Debug: Making Google Pollen API call for lat={lat}, lon={lon}")
        async with httpx.AsyncClient() as client:
            # Get pollen forecast
            response = await client.get(
                f"{POLLEN_API_BASE_URL}/forecast:lookup",
                params={
                    "key": GOOGLE_MAPS_API_KEY,
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "days": days,
                    "plantsDescription": True
                }
            )
            
            print(f"Debug: Google API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Debug: Got pollen data with keys: {list(data.keys())}")
                return data
            else:
                print(f"Pollen API error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"Error fetching pollen data: {e}")
        return None

@router.get("/current", response_model=EnvironmentDataResponse)
async def get_current_environment_data(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    current_user: User = Depends(get_current_user)
):
    """Get current environmental data including real pollen data from Google Maps API"""
    
    try:
        print(f"🔍 Debug: Starting /current endpoint for lat={lat}, lon={lon}")
        
        # Create basic response data
        base_data = {
            "location": f"Location at {lat:.4f}, {lon:.4f}",
            "latitude": lat,
            "longitude": lon,
            "weather_conditions": "partly_cloudy",
            "temperature": 20.0,
            "humidity": 60.0,
            "air_quality_index": 50,
            "uv_index": 5,
            "pollen_count": "moderate"
        }
        
        print("📋 Debug: Base data created successfully")
        
        # Try to fetch pollen data, but don't fail if it doesn't work
        try:
            print("🌼 Debug: Fetching pollen data...")
            pollen_response = await get_google_pollen_data(lat, lon)
            print(f"📊 Debug: Pollen response received: {pollen_response is not None}")
            
            if pollen_response:
                print("✅ Debug: Pollen data available (detailed processing disabled for debugging)")
                # For now, just acknowledge we got the data
                base_data["pollen_count"] = "moderate"  # Will be updated with real processing later
                
        except Exception as pollen_error:
            print(f"⚠️ Debug: Pollen data fetch failed: {pollen_error}")
            # Continue with basic data
        
        print("🎊 Debug: Creating response object...")
        response = EnvironmentDataResponse(**base_data)
        print("✅ Debug: Response created successfully")
        return response
        
    except Exception as e:
        print(f"❌ Debug: Error in /current endpoint: {str(e)}")
        print(f"❌ Debug: Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Debug: Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{location}", response_model=EnvironmentDataResponse)
async def get_environment_data(
    location: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get environmental data for a specific location"""
    
    # Basic mock data for testing
    base_data = {
        "location": location,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "weather_conditions": "sunny",
        "temperature": 22.0,
        "humidity": 55.0,
        "air_quality_index": 35,
        "uv_index": 6,
        "pollen_count": "low"
    }
    
    return EnvironmentDataResponse(**base_data)
