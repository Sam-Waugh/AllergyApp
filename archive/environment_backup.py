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

async def get_pollen_heatmap_info(lat: float, lon: float, zoom: int = 10) -> dict:
    """Generate pollen heatmap tile URLs for different pollen types"""
    if not GOOGLE_MAPS_API_KEY:
        return {}
    
    # Calculate tile coordinates for the given lat/lon and zoom level
    import math
    
    def deg2num(lat_deg, lon_deg, zoom):
        lat_rad = math.radians(lat_deg)
        n = 2.0 ** zoom
        x = int((lon_deg + 180.0) / 360.0 * n)
        y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
        return x, y
    
    tile_x, tile_y = deg2num(lat, lon, zoom)
    
    # Generate heatmap URLs for different pollen types
    pollen_types = ["TREE_UPI", "GRASS_UPI", "WEED_UPI"]
    heatmap_urls = {}
    
    for pollen_type in pollen_types:
        # Generate URLs for surrounding tiles (3x3 grid for better coverage)
        tiles = []
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                tile_url = (
                    f"https://pollen.googleapis.com/v1/mapTypes/{pollen_type}/heatmapTiles/"
                    f"{zoom}/{tile_x + dx}/{tile_y + dy}?key={GOOGLE_MAPS_API_KEY}"
                )
                tiles.append({
                    "url": tile_url,
                    "x": tile_x + dx,
                    "y": tile_y + dy,
                    "zoom": zoom
                })
        
        heatmap_urls[pollen_type.lower()] = {
            "center_tile": {
                "url": f"https://pollen.googleapis.com/v1/mapTypes/{pollen_type}/heatmapTiles/{zoom}/{tile_x}/{tile_y}?key={GOOGLE_MAPS_API_KEY}",
                "x": tile_x,
                "y": tile_y,
                "zoom": zoom
            },
            "surrounding_tiles": tiles
        }
    
    return heatmap_urls

def get_pollen_index_details(category: str, index_value: int) -> dict:
    """Get detailed information about pollen index levels"""
    
    # Pollen index mapping based on Google's categories
    index_info = {
        "NONE": {
            "level": 0,
            "description": "No pollen detected",
            "health_impact": "No impact expected",
            "color": {"red": 0, "green": 255, "blue": 0},
            "recommendations": []
        },
        "VERY_LOW": {
            "level": 1,
            "description": "Very low pollen levels",
            "health_impact": "Most people will not experience symptoms",
            "color": {"red": 144, "green": 238, "blue": 144},
            "recommendations": ["Enjoy outdoor activities"]
        },
        "LOW": {
            "level": 2,
            "description": "Low pollen levels",
            "health_impact": "People with severe allergies may experience minor symptoms",
            "color": {"red": 255, "green": 255, "blue": 0},
            "recommendations": [
                "Check pollen forecast before outdoor activities",
                "Consider closing windows in the evening"
            ]
        },
        "MODERATE": {
            "level": 3,
            "description": "Moderate pollen levels",
            "health_impact": "People with allergies may experience symptoms",
            "color": {"red": 255, "green": 165, "blue": 0},
            "recommendations": [
                "Limit outdoor activities if sensitive",
                "Keep windows closed",
                "Take allergy medication as prescribed",
                "Shower after being outdoors"
            ]
        },
        "HIGH": {
            "level": 4,
            "description": "High pollen levels",
            "health_impact": "Most people with allergies will experience symptoms",
            "color": {"red": 255, "green": 69, "blue": 0},
            "recommendations": [
                "Limit outdoor activities",
                "Keep windows and doors closed",
                "Use air conditioning with clean filters",
                "Take allergy medication preventively",
                "Wash hair before bed",
                "Change clothes after being outdoors"
            ]
        },
        "VERY_HIGH": {
            "level": 5,
            "description": "Very high pollen levels",
            "health_impact": "All people with allergies will experience severe symptoms",
            "color": {"red": 139, "green": 0, "blue": 0},
            "recommendations": [
                "Avoid outdoor activities",
                "Stay indoors with windows/doors closed",
                "Use air purifiers",
                "Take allergy medication as directed",
                "Consider consulting with healthcare provider",
                "Wear sunglasses and mask when going outside"
            ]
        }    }
    
    details = index_info.get(category, index_info["MODERATE"])
    details["index_value"] = index_value
    details["category"] = category
    
    return details

def process_pollen_data(pollen_response: Optional[dict]) -> tuple:
    """Process Google Pollen API response into our schema format"""
    if not pollen_response:
        return None, None, None
    
    daily_info = []
    plant_description = pollen_response.get("plantsDescription", "")
    
    for day_info in pollen_response.get("dailyInfo", []):
        date = day_info.get("date")
        pollen_types = []
        
        # Process different pollen types
        for pollen_type_info in day_info.get("pollenTypeInfo", []):
            pollen_type = pollen_type_info.get("code", "").upper()
            index_info = pollen_type_info.get("indexInfo", {})
            
            if pollen_type and index_info:
                category = index_info.get("category", "NONE")
                index_value = index_info.get("value", 0)                # Get detailed index information
                index_details = get_pollen_index_details(category, index_value)
                
                # Get color in the correct format (RGB dict)
                color_value = index_info.get("color")
                if not color_value or not isinstance(color_value, dict):
                    # Use color from index_details (already in RGB dict format)
                    color_value = index_details["color"]
                
                pollen_data = PollenTypeData(
                    code=pollen_type,
                    display_name=pollen_type_info.get("displayName", pollen_type),
                    index_value=index_value,
                    category=category,
                    color=color_value,
                    in_season=pollen_type_info.get("inSeason", False)
                )
                
                # Add the detailed index information
                pollen_data_dict = pollen_data.dict()
                pollen_data_dict["index_details"] = index_details
                pollen_types.append(pollen_data_dict)
        
        if date and pollen_types:
            forecast = {
                "date": date,
                "pollen_types": pollen_types
            }
            daily_info.append(forecast)
    
    return pollen_response, daily_info, plant_description

# Mock environment data for demo purposes (enhanced with coordinates)
MOCK_ENVIRONMENT_DATA = {
    "New York": {
        "location": "New York, NY",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "weather_conditions": "partly_cloudy",
        "temperature": 22.5,
        "humidity": 65.0,
        "air_quality_index": 45,
        "pollen_count": "moderate",
        "uv_index": 6
    },
    "London": {
        "location": "London, UK",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "weather_conditions": "rainy",
        "temperature": 15.2,
        "humidity": 80.0,
        "air_quality_index": 32,
        "pollen_count": "low",
        "uv_index": 3
    },
    "Sydney": {
        "location": "Sydney, Australia",
        "latitude": -33.8688,
        "longitude": 151.2093,
        "weather_conditions": "sunny",
        "temperature": 28.0,
        "humidity": 55.0,
        "air_quality_index": 25,
        "pollen_count": "high",
        "uv_index": 9
    }
}

@router.get("/current", response_model=EnvironmentDataResponse)
async def get_current_environment_data(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    include_heatmap: bool = Query(False, description="Include pollen heatmap tile URLs"),
    current_user: User = Depends(get_current_user)
):
    """Get current environmental data including real pollen data from Google Maps API"""
    
    try:
        print(f"🔍 Debug: Starting /current endpoint for lat={lat}, lon={lon}")
        
        # Fetch real pollen data from Google Maps API
        print("🌼 Debug: Fetching pollen data...")
        pollen_response = await get_google_pollen_data(lat, lon)
        print(f"📊 Debug: Pollen response received: {pollen_response is not None}")
        
        print("🔄 Debug: Processing pollen data...")
        pollen_data, daily_pollen_info, plant_description = process_pollen_data(pollen_response)
        print(f"✅ Debug: Pollen data processed successfully")
        
        # For demo, use mock weather data (in production, integrate with weather API)
        base_data = {
            "location": f"Location at {lat:.4f}, {lon:.4f}",
            "latitude": lat,
            "longitude": lon,
            "weather_conditions": "partly_cloudy",
            "temperature": 20.0,
            "humidity": 60.0,
            "air_quality_index": 50,
            "uv_index": 5,
            "pollen_count": "moderate"  # Legacy field
        }
        
        print("📋 Debug: Base data created successfully")
        
        # Add real pollen data if available
        if pollen_data:
            print("🌸 Debug: Adding real pollen data...")
            base_data.update({
                "pollen_data": pollen_data,
                "daily_pollen_info": daily_pollen_info,
                "plant_description": plant_description
            })
            
            print("🎯 Debug: Updated pollen count calculation...")
            # Update legacy pollen_count based on real data            if daily_pollen_info and len(daily_pollen_info) > 0:
                today_pollen = daily_pollen_info[0]
                if today_pollen.get("pollen_types"):
                    # Calculate overall pollen level
                    max_index = max(pt.get("index_value", 0) for pt in today_pollen["pollen_types"])
                    if max_index <= 1:
                        base_data["pollen_count"] = "low"
                    elif max_index <= 3:
                        base_data["pollen_count"] = "moderate"
                    else:
                        base_data["pollen_count"] = "high"
        
        # Add heatmap tile URLs if requested
        if include_heatmap:
            print("🗺️ Debug: Adding heatmap info...")
            heatmap_info = await get_pollen_heatmap_info(lat, lon)
            base_data["heatmap_tiles"] = heatmap_info
        
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
                # Calculate overall pollen level
                max_index = max(pt.get("index_value", 0) for pt in today_pollen["pollen_types"])
                if max_index <= 1:
                    base_data["pollen_count"] = "low"
                elif max_index <= 3:
                    base_data["pollen_count"] = "moderate"
                else:
                    base_data["pollen_count"] = "high"
    
    # Add heatmap tile URLs if requested
    if include_heatmap:
        heatmap_info = await get_pollen_heatmap_info(lat, lon)
        base_data["heatmap_tiles"] = heatmap_info
    
    return EnvironmentDataResponse(**base_data)

@router.get("/{location}", response_model=EnvironmentDataResponse)
async def get_environment_data(
    location: str,
    current_user: User = Depends(get_current_user)
):
    """Get environmental data by location name (uses mock data with optional real pollen data)"""    # Try to find location in mock data
    for mock_location, data in MOCK_ENVIRONMENT_DATA.items():
        if mock_location.lower() in location.lower():
            # Try to get real pollen data if coordinates are available
            lat, lon = data["latitude"], data["longitude"]
            
            # Create response with mock data first (guaranteed to work)
            response_data = data.copy()
            
            try:
                # Try to enhance with real pollen data
                pollen_response = await get_google_pollen_data(lat, lon)
                pollen_data, daily_pollen_info, plant_description = process_pollen_data(pollen_response)
                
                if pollen_data:
                    response_data.update({
                        "pollen_data": pollen_data,
                        "daily_pollen_info": daily_pollen_info,
                        "plant_description": plant_description
                    })
            except Exception as e:
                # Log the error but don't fail the request
                print(f"Warning: Failed to get pollen data: {e}")
                # Response will use mock data only
            
            return EnvironmentDataResponse(**response_data)
    
    # Default data if location not found
    default_data = {
        "location": location,
        "latitude": 0.0,
        "longitude": 0.0,
        "weather_conditions": "unknown",
        "temperature": 20.0,
        "humidity": 50.0,
        "air_quality_index": 50,
        "pollen_count": "moderate",
        "uv_index": 5
    }
    
    return EnvironmentDataResponse(**default_data)

@router.get("/heatmap-tiles/{pollen_type}", response_model=dict)
async def get_pollen_heatmap_tiles(
    pollen_type: str,
    zoom_level: int = Query(default=10, ge=0, le=16),
    current_user: User = Depends(get_current_user)
):
    """Get pollen heatmap tile URLs for a specific pollen type"""
    
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Google Maps API key not configured")
    
    # Validate pollen type
    valid_pollen_types = ["TREE_UPI", "GRASS_UPI", "WEED_UPI"]
    if pollen_type.upper() not in valid_pollen_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid pollen type. Must be one of: {', '.join(valid_pollen_types)}"
        )
    
    # Generate heatmap tile URL template
    tile_url_template = (
        f"https://pollen.googleapis.com/v1/mapTypes/{pollen_type.upper()}/heatmapTiles/"
        f"{zoom_level}/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}"
    )
    
    return {
        "pollen_type": pollen_type.upper(),
        "zoom_level": zoom_level,
        "tile_url_template": tile_url_template,
        "usage_instructions": {
            "description": "Replace {x} and {y} with actual tile coordinates",
            "example": tile_url_template.replace("{x}", "1024").replace("{y}", "512"),
            "supported_zoom_levels": "0-16",
            "tile_size": "256x256 pixels"
        }
    }

@router.get("/pollen-index/{pollen_type}")
async def get_pollen_index_info(
    pollen_type: str,
    current_user: User = Depends(get_current_user)
):
    """Get information about pollen index categories and values"""
    
    pollen_index_info = {
        "TREE_UPI": {
            "name": "Tree Pollen Universal Pollen Index",
            "description": "Measures tree pollen levels including oak, maple, birch, and other trees",
            "peak_season": "Spring (March-May)",
            "categories": {
                "NONE": {"range": "0", "description": "No pollen detected"},
                "VERY_LOW": {"range": "1-12", "description": "Very low pollen levels"},
                "LOW": {"range": "13-35", "description": "Low pollen levels"},
                "MODERATE": {"range": "36-68", "description": "Moderate pollen levels"},
                "HIGH": {"range": "69-168", "description": "High pollen levels"},
                "VERY_HIGH": {"range": "169+", "description": "Very high pollen levels"}
            }
        },
        "GRASS_UPI": {
            "name": "Grass Pollen Universal Pollen Index",
            "description": "Measures grass pollen levels from various grass species",
            "peak_season": "Late Spring to Early Summer (May-July)",
            "categories": {
                "NONE": {"range": "0", "description": "No pollen detected"},
                "VERY_LOW": {"range": "1-5", "description": "Very low pollen levels"},
                "LOW": {"range": "6-19", "description": "Low pollen levels"},
                "MODERATE": {"range": "20-68", "description": "Moderate pollen levels"},
                "HIGH": {"range": "69-168", "description": "High pollen levels"},
                "VERY_HIGH": {"range": "169+", "description": "Very high pollen levels"}
            }
        },
        "WEED_UPI": {
            "name": "Weed Pollen Universal Pollen Index",
            "description": "Measures weed pollen levels including ragweed, plantain, and other weeds",
            "peak_season": "Late Summer to Fall (August-October)",
            "categories": {
                "NONE": {"range": "0", "description": "No pollen detected"},
                "VERY_LOW": {"range": "1-9", "description": "Very low pollen levels"},
                "LOW": {"range": "10-49", "description": "Low pollen levels"},
                "MODERATE": {"range": "50-499", "description": "Moderate pollen levels"},
                "HIGH": {"range": "500-999", "description": "High pollen levels"},
                "VERY_HIGH": {"range": "1000+", "description": "Very high pollen levels"}
            }
        }
    }
    
    if pollen_type.upper() not in pollen_index_info:
        raise HTTPException(
            status_code=400,
            detail="Invalid pollen type. Must be one of: TREE_UPI, GRASS_UPI, WEED_UPI"
        )
    
    return pollen_index_info[pollen_type.upper()]

@router.get("/heatmap/{pollen_type}")
async def get_pollen_heatmap_by_location(
    pollen_type: str,
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    zoom: int = Query(10, description="Zoom level (1-20)"),
    current_user: User = Depends(get_current_user)
):
    """Get pollen heatmap tile URLs for a specific pollen type"""
    
    # Validate pollen type
    valid_types = ["tree_upi", "grass_upi", "weed_upi"]
    if pollen_type.lower() not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid pollen type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Validate zoom level
    if not (1 <= zoom <= 20):
        raise HTTPException(status_code=400, detail="Zoom level must be between 1 and 20")
    
    heatmap_info = await get_pollen_heatmap_info(lat, lon, zoom)
    pollen_key = pollen_type.lower()
    
    if pollen_key not in heatmap_info:
        raise HTTPException(status_code=404, detail="Heatmap data not available for this pollen type")
    
    return {
        "pollen_type": pollen_type,
        "coordinates": {"latitude": lat, "longitude": lon},
        "zoom_level": zoom,
        "heatmap_data": heatmap_info[pollen_key]
    }

# In production, you would implement real API integration like this:
"""
async def get_weather_data(location: str, api_key: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://api.openweathermap.org/data/2.5/weather",
            params={
                "q": location,
                "appid": api_key,
                "units": "metric"
            }
        )
        return response.json()

async def get_air_quality_data(lat: float, lon: float, api_key: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://api.airvisual.com/v2/nearest_city",
            params={
                "lat": lat,
                "lon": lon,
                "key": api_key
            }
        )
        return response.json()
"""
