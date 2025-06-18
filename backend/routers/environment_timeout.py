from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import httpx
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio

from database.database import get_db
from schemas.schemas import EnvironmentDataResponse, PollenTypeData, PollenForecast
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

# Google Maps API configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
POLLEN_API_BASE_URL = "https://pollen.googleapis.com/v1"
GEOCODING_API_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

async def get_location_name_with_timeout(lat: float, lon: float) -> str:
    """Get human-readable location name with timeout to prevent hanging"""
    if not GOOGLE_MAPS_API_KEY:
        return f"Location at {lat:.4f}, {lon:.4f}"
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:  # 8 second timeout
            # Try without strict filters first for better results
            response = await client.get(
                GEOCODING_API_BASE_URL,
                params={
                    "latlng": f"{lat},{lon}",
                    "key": GOOGLE_MAPS_API_KEY
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    result = data["results"][0]
                    formatted_address = result.get("formatted_address", "")
                    
                    if formatted_address:
                        # Extract meaningful location from formatted address
                        parts = [p.strip() for p in formatted_address.split(",")]
                        clean_parts = []
                        
                        for part in parts[:4]:  # Check first 4 parts
                            # Skip postal codes, coordinates, or unnamed roads
                            if not (part.replace(" ", "").replace("-", "").isdigit() or 
                                   "Unnamed" in part or 
                                   len(part) < 2):
                                clean_parts.append(part)
                        
                        if len(clean_parts) >= 2:
                            return f"{clean_parts[0]}, {clean_parts[-1]}"
                        elif clean_parts:
                            return clean_parts[0]
                        else:
                            return formatted_address.split(",")[0].strip()
                            
    except asyncio.TimeoutError:
        print(f"⏰ Geocoding API timeout for {lat}, {lon}")
    except Exception as e:
        print(f"❌ Error getting location name: {e}")
    
    return f"Location at {lat:.4f}, {lon:.4f}"

async def get_google_pollen_data_with_timeout(lat: float, lon: float, days: int = 5) -> Optional[dict]:
    """Fetch detailed pollen data with timeout to prevent hanging"""
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: No Google Maps API key configured")
        return None
    
    try:
        print(f"🌼 Making Google Pollen API call for lat={lat}, lon={lon}")
        async with httpx.AsyncClient(timeout=12.0) as client:  # 12 second timeout
            response = await client.get(
                f"{POLLEN_API_BASE_URL}/forecast:lookup",
                params={
                    "key": GOOGLE_MAPS_API_KEY,
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "days": days,
                    "plantsDescription": True,
                    "languageCode": "en"
                }
            )
            
            print(f"📊 Google Pollen API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Got pollen data with {len(data.get('dailyInfo', []))} days")
                return data
            else:
                print(f"❌ Pollen API error: {response.status_code}")
                return None
                
    except asyncio.TimeoutError:
        print(f"⏰ Pollen API timeout for {lat}, {lon}")
        return None
    except Exception as e:
        print(f"❌ Error fetching pollen data: {e}")
        return None

def process_pollen_data_safe(pollen_response: Optional[dict]) -> tuple:
    """Process pollen data with safe error handling"""
    if not pollen_response:
        return None, [], [], ""
    
    daily_forecasts = []
    
    try:
        for day_info in pollen_response.get("dailyInfo", []):
            date_obj = day_info.get("date")
            if not date_obj:
                continue
            
            # Handle date format safely
            if isinstance(date_obj, dict):
                year = date_obj.get("year", 2025)
                month = date_obj.get("month", 1)
                day = date_obj.get("day", 1)
                date = f"{year}-{month:02d}-{day:02d}"
            else:
                date = str(date_obj)
                
            pollen_types = []
            
            for pollen_type_info in day_info.get("pollenTypeInfo", []):
                pollen_code = pollen_type_info.get("code", "").upper()
                index_info = pollen_type_info.get("indexInfo", {})
                
                if pollen_code and index_info:
                    category = index_info.get("category", "NONE")
                    index_value = index_info.get("value", 0)
                    
                    pollen_data = {
                        "code": pollen_code,
                        "display_name": pollen_type_info.get("displayName", pollen_code.replace("_UPI", "").title()),
                        "index_value": index_value,
                        "category": category,
                        "in_season": pollen_type_info.get("inSeason", False)
                    }
                    pollen_types.append(pollen_data)
            
            if pollen_types:
                try:
                    day_name = datetime.strptime(date, "%Y-%m-%d").strftime("%A")
                except:
                    day_name = f"Day {len(daily_forecasts) + 1}"
                    
                daily_forecast = {
                    "date": date,
                    "day_name": day_name,
                    "pollen_types": pollen_types,
                    "overall_index": max(pt["index_value"] for pt in pollen_types) if pollen_types else 0,
                    "dominant_pollen": max(pollen_types, key=lambda x: x["index_value"])["display_name"] if pollen_types else "None"
                }
                daily_forecasts.append(daily_forecast)
                
    except Exception as e:
        print(f"❌ Error processing pollen data: {e}")
        
    return pollen_response, daily_forecasts, pollen_response.get("plantsDescription", []), pollen_response.get("regionCode", "")

async def get_heatmap_data_with_timeout(lat: float, lon: float) -> Optional[dict]:
    """Generate heatmap data with timeout"""
    if not GOOGLE_MAPS_API_KEY:
        return None
        
    try:
        # Generate basic heatmap info without external calls
        heatmap_data = {
            "center": {"lat": lat, "lon": lon, "zoom": 12},
            "tree_tiles": f"https://pollen.googleapis.com/v1/mapTypes/TREE_UPI/heatmapTiles/12/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}",
            "grass_tiles": f"https://pollen.googleapis.com/v1/mapTypes/GRASS_UPI/heatmapTiles/12/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}",
            "weed_tiles": f"https://pollen.googleapis.com/v1/mapTypes/WEED_UPI/heatmapTiles/12/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}"
        }
        return heatmap_data
    except Exception as e:
        print(f"❌ Error generating heatmap data: {e}")
        return None

@router.get("/current", response_model=EnvironmentDataResponse)
async def get_current_environment_data(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    include_heatmap: bool = Query(False, description="Include pollen heatmap tile URLs"),
    current_user: User = Depends(get_current_user)
):
    """Get current environmental data with timeouts to prevent hanging"""
    
    try:
        print(f"🌍 Getting environment data for lat={lat}, lon={lon}")
        
        # Run location and pollen data fetching concurrently with timeouts
        location_task = get_location_name_with_timeout(lat, lon)
        pollen_task = get_google_pollen_data_with_timeout(lat, lon, days=5)
        
        # Wait for both with a total timeout of 15 seconds
        try:
            location_name, pollen_response = await asyncio.wait_for(
                asyncio.gather(location_task, pollen_task, return_exceptions=True),
                timeout=15.0
            )
            
            # Handle exceptions from individual tasks
            if isinstance(location_name, Exception):
                print(f"⚠️ Location name task failed: {location_name}")
                location_name = f"Location at {lat:.4f}, {lon:.4f}"
                
            if isinstance(pollen_response, Exception):
                print(f"⚠️ Pollen data task failed: {pollen_response}")
                pollen_response = None
                
        except asyncio.TimeoutError:
            print("⏰ Overall timeout - using fallback data")
            location_name = f"Location at {lat:.4f}, {lon:.4f}"
            pollen_response = None
        
        print(f"✅ Location: {location_name}")
        
        # Process pollen data safely
        pollen_data, daily_forecasts, plant_descriptions, region_code = process_pollen_data_safe(pollen_response)
        
        # Create response data
        base_data = {
            "location": location_name,
            "latitude": lat,
            "longitude": lon,
            "weather_conditions": "partly_cloudy",
            "temperature": 20.0,
            "humidity": 60.0,
            "air_quality_index": 50,
            "uv_index": 5,
            "pollen_count": "moderate"
        }
        
        # Add detailed pollen information if available
        if daily_forecasts and len(daily_forecasts) > 0:
            print(f"📅 Adding {len(daily_forecasts)} days of pollen forecasts")
            
            # Update legacy pollen_count based on today's data
            today_forecast = daily_forecasts[0]
            overall_index = today_forecast.get("overall_index", 0)
            
            if overall_index <= 1:
                base_data["pollen_count"] = "low"
            elif overall_index <= 3:
                base_data["pollen_count"] = "moderate"
            else:
                base_data["pollen_count"] = "high"
            
            # Add detailed pollen data
            base_data.update({
                "daily_pollen_info": daily_forecasts,
                "plant_descriptions": plant_descriptions,
                "region_code": region_code,
                "pollen_summary": {
                    "today_dominant": today_forecast.get("dominant_pollen", "None"),
                    "today_index": overall_index,
                    "forecast_days": len(daily_forecasts)
                }
            })
        else:
            print("⚠️ No detailed pollen data available")
        
        # Add heatmap data if requested
        if include_heatmap:
            print("🗺️ Adding heatmap data...")
            heatmap_data = await get_heatmap_data_with_timeout(lat, lon)
            if heatmap_data:
                base_data["heatmap_data"] = heatmap_data
        
        print("✅ Environment data prepared successfully")
        return EnvironmentDataResponse(**base_data)
        
    except Exception as e:
        print(f"❌ Error in /current endpoint: {str(e)}")
        
        # Always return something, even if there's an error
        fallback_data = {
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
        
        return EnvironmentDataResponse(**fallback_data)

@router.get("/{location}", response_model=EnvironmentDataResponse)
async def get_environment_data(
    location: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get environmental data for a specific location"""
    
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
