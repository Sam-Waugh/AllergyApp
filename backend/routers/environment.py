from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import httpx
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from database.database import get_db
from schemas.schemas import EnvironmentDataResponse, PollenTypeData, PollenForecast
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

# Google Maps API configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
POLLEN_API_BASE_URL = "https://pollen.googleapis.com/v1"
GEOCODING_API_BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

async def get_location_name(lat: float, lon: float) -> str:
    """Get human-readable location name from coordinates using Google Geocoding API"""
    if not GOOGLE_MAPS_API_KEY:
        return f"Location at {lat:.4f}, {lon:.4f}"
    
    try:
        async with httpx.AsyncClient() as client:
            # First try with restricted types
            response = await client.get(
                GEOCODING_API_BASE_URL,
                params={
                    "latlng": f"{lat},{lon}",
                    "key": GOOGLE_MAPS_API_KEY,
                    "result_type": "locality|administrative_area_level_1|country"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    result = data["results"][0]
                    components = result.get("address_components", [])
                    
                    city = None
                    state = None
                    country = None
                    
                    for component in components:
                        types = component.get("types", [])
                        if "locality" in types:
                            city = component["long_name"]
                        elif "administrative_area_level_1" in types:
                            state = component["long_name"]  # Use long_name for better readability
                        elif "country" in types:
                            country = component["long_name"]
                    
                    # Format location name
                    location_parts = []
                    if city:
                        location_parts.append(city)
                    if state:
                        location_parts.append(state)
                    if country and not location_parts:  # Add country if no other parts
                        location_parts.append(country)
                    
                    if location_parts:
                        return ", ".join(location_parts)
                    else:
                        return result.get("formatted_address", f"Location at {lat:.4f}, {lon:.4f}")
                  # If no results with restricted types, try without restrictions
                print("📍 No results with restricted types, trying unrestricted...")
                response2 = await client.get(
                    GEOCODING_API_BASE_URL,
                    params={
                        "latlng": f"{lat},{lon}",
                        "key": GOOGLE_MAPS_API_KEY
                    }
                )
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    if data2.get("results") and len(data2["results"]) > 0:
                        result = data2["results"][0]
                        formatted_address = result.get("formatted_address", "")
                        
                        # Try to extract meaningful location from formatted address
                        if formatted_address:
                            # Remove postal codes and coordinates, extract meaningful parts
                            parts = [p.strip() for p in formatted_address.split(",")]
                            clean_parts = []
                            
                            for part in parts[:4]:  # Check first 4 parts
                                # Skip if it looks like a postal code, coordinate, or unnamed road
                                if not (part.replace(" ", "").replace("-", "").isdigit() or 
                                       "Unnamed" in part or 
                                       len(part) < 2 or
                                       part.replace("+", "").replace("-", "").replace(".", "").replace(" ", "").isdigit()):
                                    clean_parts.append(part)
                            
                            if len(clean_parts) >= 2:
                                # Take the most meaningful parts - usually area and country
                                return f"{clean_parts[0]}, {clean_parts[-1]}"
                            elif clean_parts:
                                return clean_parts[0]
                            else:
                                # Last resort - take first part of formatted address
                                first_part = formatted_address.split(",")[0].strip()
                                if first_part and not first_part.replace(" ", "").isdigit():
                                    return first_part
                                return formatted_address
                
    except Exception as e:
        print(f"Error getting location name: {e}")
    
    return f"Location at {lat:.4f}, {lon:.4f}"

async def get_google_pollen_data(lat: float, lon: float, days: int = 5) -> Optional[dict]:
    """Fetch detailed pollen data from Google Maps Pollen API"""
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: No Google Maps API key configured")
        return None
    
    try:
        print(f"🌼 Making Google Pollen API call for lat={lat}, lon={lon}")
        async with httpx.AsyncClient() as client:
            # Get pollen forecast with plant descriptions
            response = await client.get(
                f"{POLLEN_API_BASE_URL}/forecast:lookup",
                params={
                    "key": GOOGLE_MAPS_API_KEY,
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "days": days,
                    "plantsDescription": True,
                    "languageCode": "en"  # Ensure English descriptions
                }
            )
            
            print(f"📊 Google Pollen API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Got pollen data with keys: {list(data.keys())}")
                if 'dailyInfo' in data:
                    print(f"📅 Daily forecast days: {len(data['dailyInfo'])}")
                if 'plantsDescription' in data:
                    print(f"🌱 Plant descriptions available: {len(data['plantsDescription']) if data['plantsDescription'] else 0}")
                return data
            else:
                print(f"❌ Pollen API error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error fetching pollen data: {e}")
        return None

async def get_pollen_heatmap_tiles(lat: float, lon: float, zoom: int = 10) -> Dict[str, Any]:
    """Generate pollen heatmap tile URLs for Google Maps integration"""
    if not GOOGLE_MAPS_API_KEY:
        return {}
    
    try:
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
        heatmap_data = {
            "center": {"lat": lat, "lon": lon, "zoom": zoom},
            "tiles": {}
        }
        
        for pollen_type in pollen_types:
            # Main tile URL
            main_tile_url = (
                f"https://pollen.googleapis.com/v1/mapTypes/{pollen_type}/heatmapTiles/"
                f"{zoom}/{tile_x}/{tile_y}?key={GOOGLE_MAPS_API_KEY}"
            )
            
            # Generate surrounding tiles (3x3 grid for better coverage)
            surrounding_tiles = []
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    tile_url = (
                        f"https://pollen.googleapis.com/v1/mapTypes/{pollen_type}/heatmapTiles/"
                        f"{zoom}/{tile_x + dx}/{tile_y + dy}?key={GOOGLE_MAPS_API_KEY}"
                    )
                    surrounding_tiles.append({
                        "url": tile_url,
                        "x": tile_x + dx,
                        "y": tile_y + dy,
                        "offset_x": dx,
                        "offset_y": dy
                    })
            
            heatmap_data["tiles"][pollen_type.lower()] = {
                "display_name": pollen_type.replace("_UPI", "").title() + " Pollen",
                "main_tile": {
                    "url": main_tile_url,
                    "x": tile_x,
                    "y": tile_y
                },
                "surrounding_tiles": surrounding_tiles,
                "tile_template": f"https://pollen.googleapis.com/v1/mapTypes/{pollen_type}/heatmapTiles/{zoom}/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}"
            }
        
        return heatmap_data
        
    except Exception as e:
        print(f"Error generating heatmap tiles: {e}")
        return {}

def process_detailed_pollen_data(pollen_response: Optional[dict]) -> tuple:
    """Process Google Pollen API response into detailed format with enhanced plant information"""
    if not pollen_response:
        return None, None, None, None
    
    daily_forecasts = []
    plant_descriptions = pollen_response.get("plantsDescription", [])
    region_code = pollen_response.get("regionCode", "")
    
    # Process plant descriptions into a more usable format
    plant_info = {}
    if plant_descriptions:
        for plant in plant_descriptions:
            plant_type = plant.get("type", "UNKNOWN")
            plant_info[plant_type] = {
                "family": plant.get("family", ""),
                "season": plant.get("season", ""),
                "special_colors": plant.get("specialColors", {}),
                "special_shapes": plant.get("specialShapes", {}),
                "cross_reaction": plant.get("crossReaction", ""),
                "picture": plant.get("picture", "")            }
    
    # Process daily pollen information
    for day_info in pollen_response.get("dailyInfo", []):
        date_obj = day_info.get("date")
        if not date_obj:
            continue
        
        # Handle date format - Google API returns {year, month, day} objects
        if isinstance(date_obj, dict):
            year = date_obj.get("year", 2025)
            month = date_obj.get("month", 1)
            day = date_obj.get("day", 1)
            date = f"{year}-{month:02d}-{day:02d}"
        else:
            date = str(date_obj)
            
        pollen_types = []
        
        # Process different pollen types for this day
        for pollen_type_info in day_info.get("pollenTypeInfo", []):
            pollen_code = pollen_type_info.get("code", "").upper()
            index_info = pollen_type_info.get("indexInfo", {})
            
            if pollen_code and index_info:
                category = index_info.get("category", "NONE")
                index_value = index_info.get("value", 0)
                color_info = index_info.get("color", {})
                in_season = pollen_type_info.get("inSeason", False)
                
                # Get enhanced pollen details
                pollen_details = get_enhanced_pollen_details(pollen_code, category, index_value)
                
                # Combine with plant information if available
                plant_detail = plant_info.get(pollen_code, {})
                
                pollen_data = {
                    "code": pollen_code,
                    "display_name": pollen_type_info.get("displayName", pollen_code.replace("_UPI", "").title()),
                    "index_value": index_value,
                    "category": category,
                    "color": color_info,
                    "in_season": in_season,
                    "health_recommendations": pollen_details.get("recommendations", []),                    "health_impact": pollen_details.get("health_impact", ""),
                    "severity_level": pollen_details.get("level", 0),
                    "plant_info": plant_detail
                }
                pollen_types.append(pollen_data)
        
        if pollen_types:
            try:
                day_name = datetime.strptime(date, "%Y-%m-%d").strftime("%A")
            except ValueError:
                # Fallback for date parsing issues
                day_name = f"Day {len(daily_forecasts) + 1}"
                
            daily_forecast = {
                "date": date,
                "day_name": day_name,
                "pollen_types": pollen_types,
                "overall_index": max(pt["index_value"] for pt in pollen_types) if pollen_types else 0,
                "dominant_pollen": max(pollen_types, key=lambda x: x["index_value"])["display_name"] if pollen_types else "None"
            }
            daily_forecasts.append(daily_forecast)
    
    return pollen_response, daily_forecasts, plant_descriptions, region_code

def get_enhanced_pollen_details(pollen_type: str, category: str, index_value: int) -> dict:
    """Get enhanced pollen information with health recommendations"""
    
    # Enhanced pollen index mapping with specific recommendations
    base_recommendations = {
        "TREE_UPI": {
            "low": ["Monitor tree pollen forecasts", "Consider closing windows during peak hours"],
            "moderate": ["Limit outdoor activities in wooded areas", "Take allergy medication if sensitive"],
            "high": ["Avoid parks and wooded areas", "Keep car windows closed", "Shower after being outdoors"],
            "very_high": ["Stay indoors when possible", "Use air purifiers", "Consult healthcare provider"]
        },
        "GRASS_UPI": {
            "low": ["Check grass pollen levels before outdoor activities"],
            "moderate": ["Avoid newly cut grass areas", "Consider exercising indoors"],
            "high": ["Limit time in grassy areas", "Wear sunglasses outdoors", "Change clothes after outdoor activities"],
            "very_high": ["Avoid all grassy areas", "Keep pets indoors longer", "Use high-efficiency air filters"]
        },
        "WEED_UPI": {
            "low": ["Be aware of ragweed season timing"],
            "moderate": ["Avoid areas with tall weeds", "Consider early morning outdoor activities"],
            "high": ["Stay indoors during peak pollen hours (10am-3pm)", "Use saline nasal rinses"],
            "very_high": ["Minimize all outdoor exposure", "Consider visiting areas with sea breeze", "Seek medical advice for severe symptoms"]
        }
    }
    
    # Category to level mapping
    category_mapping = {
        "NONE": {"level": 0, "severity": "none", "health_impact": "No impact expected"},
        "VERY_LOW": {"level": 1, "severity": "low", "health_impact": "Most people will not experience symptoms"},
        "LOW": {"level": 2, "severity": "low", "health_impact": "People with severe allergies may experience minor symptoms"},
        "MODERATE": {"level": 3, "severity": "moderate", "health_impact": "People with allergies may experience symptoms"},
        "HIGH": {"level": 4, "severity": "high", "health_impact": "Most people with allergies will experience symptoms"},
        "VERY_HIGH": {"level": 5, "severity": "very_high", "health_impact": "All people with allergies will experience severe symptoms"}
    }
    
    details = category_mapping.get(category, category_mapping["MODERATE"])
    severity = details["severity"]
    
    # Get specific recommendations for this pollen type and severity
    pollen_recommendations = base_recommendations.get(pollen_type, {})
    specific_recommendations = pollen_recommendations.get(severity, ["Monitor pollen levels regularly"])
    
    # Add general recommendations based on severity
    general_recommendations = []
    if severity in ["moderate", "high", "very_high"]:
        general_recommendations.extend([
            "Check daily pollen forecasts",
            "Keep windows closed",
            "Use air conditioning with clean filters"
        ])
    
    if severity in ["high", "very_high"]:
        general_recommendations.extend([
            "Take allergy medication as prescribed",
            "Shower and wash hair before bed",
            "Dry clothes indoors"
        ])
    
    combined_recommendations = list(set(specific_recommendations + general_recommendations))
    
    return {
        "level": details["level"],
        "health_impact": details["health_impact"],
        "recommendations": combined_recommendations[:6],  # Limit to 6 most important
        "category": category,
        "index_value": index_value
    }

@router.get("/current", response_model=EnvironmentDataResponse)
async def get_current_environment_data(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    include_heatmap: bool = Query(False, description="Include pollen heatmap tile URLs"),
    current_user: User = Depends(get_current_user)
):
    """Get current environmental data with enhanced pollen forecasts and location details"""
    
    try:
        print(f"🌍 Getting enhanced environment data for lat={lat}, lon={lon}")
          # Get human-readable location name
        print("📍 Fetching location name...")
        location_name = await get_location_name(lat, lon)
        print(f"✅ Location: {location_name}")
        
        # Fetch detailed pollen data
        print("🌼 Fetching detailed pollen data...")
        pollen_response = await get_google_pollen_data(lat, lon, days=5)  # Get 5-day forecast (was 7, caused API error)
        
        # Process pollen data into detailed format
        pollen_data, daily_forecasts, plant_descriptions, region_code = process_detailed_pollen_data(pollen_response)
        
        # Generate heatmap tiles if requested
        heatmap_tiles = None
        if include_heatmap:
            print("🗺️ Generating pollen heatmap tiles...")
            heatmap_tiles = await get_pollen_heatmap_tiles(lat, lon, zoom=12)
        
        # TODO: Add weather forecast (OpenWeatherMap API)
        # TODO: Add air quality data (IQAir or similar API)
        
        # Create enhanced response data
        base_data = {
            "location": location_name,
            "latitude": lat,
            "longitude": lon,
            "weather_conditions": "partly_cloudy",  # TODO: Replace with real weather data
            "temperature": 20.0,  # TODO: Replace with real temperature
            "humidity": 60.0,  # TODO: Replace with real humidity
            "air_quality_index": 50,  # TODO: Replace with real air quality
            "uv_index": 5,  # TODO: Replace with real UV index
            "pollen_count": "moderate"  # Legacy field, will be overridden below
        }
        
        # Add detailed pollen information if available
        if daily_forecasts and len(daily_forecasts) > 0:
            print(f"📅 Processing {len(daily_forecasts)} days of pollen forecasts")
            
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
                "pollen_data": pollen_data,
                "daily_pollen_info": daily_forecasts,
                "plant_descriptions": plant_descriptions,
                "region_code": region_code,
                "pollen_summary": {
                    "today_dominant": today_forecast.get("dominant_pollen", "None"),
                    "today_index": overall_index,
                    "forecast_days": len(daily_forecasts),
                    "peak_day": max(daily_forecasts, key=lambda x: x["overall_index"])["day_name"] if daily_forecasts else "Unknown"
                }
            })
        else:
            print("⚠️ No detailed pollen data available, using basic response")
        
        # Add heatmap tiles if requested and available
        if heatmap_tiles:
            base_data["heatmap_tiles"] = heatmap_tiles
        
        print("✅ Enhanced environment data prepared successfully")
        return EnvironmentDataResponse(**base_data)
        
    except Exception as e:
        print(f"❌ Error in enhanced /current endpoint: {str(e)}")
        import traceback
        print(f"🔍 Full traceback: {traceback.format_exc()}")
        
        # Fallback to basic data if enhancement fails
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

@router.get("/public/current", response_model=EnvironmentDataResponse)
async def get_current_environment_data_public(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    include_heatmap: bool = Query(False, description="Include pollen heatmap tile URLs")
):
    """Get current environmental data with enhanced pollen forecasts (public endpoint for testing)"""
    
    try:
        print(f"🌍 Getting enhanced environment data for lat={lat}, lon={lon}")
        
        # Get human-readable location name
        print("📍 Fetching location name...")
        location_name = await get_location_name(lat, lon)
        print(f"✅ Location: {location_name}")
        
        # Fetch detailed pollen data
        print("🌼 Fetching detailed pollen data...")
        pollen_response = await get_google_pollen_data(lat, lon, days=5)  # Get 5-day forecast (was 7, caused API error)
        
        # Process pollen data into detailed format
        pollen_data, daily_forecasts, plant_descriptions, region_code = process_detailed_pollen_data(pollen_response)
        
        # Generate heatmap tiles if requested
        heatmap_tiles = None
        if include_heatmap:
            print("🗺️ Generating pollen heatmap tiles...")
            heatmap_tiles = await get_pollen_heatmap_tiles(lat, lon, zoom=12)
        
        # Create enhanced response data
        base_data = {
            "location": location_name,
            "latitude": lat,
            "longitude": lon,
            "weather_conditions": "partly_cloudy",  # TODO: Replace with real weather data
            "temperature": 20.0,  # TODO: Replace with real temperature
            "humidity": 60.0,  # TODO: Replace with real humidity
            "air_quality_index": 50,  # TODO: Replace with real air quality
            "uv_index": 5,  # TODO: Replace with real UV index
            "pollen_count": "moderate"  # Legacy field, will be overridden below
        }
        
        # Add detailed pollen information if available
        if daily_forecasts and len(daily_forecasts) > 0:
            print(f"📅 Processing {len(daily_forecasts)} days of pollen forecasts")
            
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
                "pollen_data": pollen_data,
                "daily_pollen_info": daily_forecasts,
                "plant_descriptions": plant_descriptions,
                "region_code": region_code,
                "pollen_summary": {
                    "today_dominant": today_forecast.get("dominant_pollen", "None"),
                    "today_index": overall_index,
                    "forecast_days": len(daily_forecasts),
                    "peak_day": max(daily_forecasts, key=lambda x: x["overall_index"])["day_name"] if daily_forecasts else "Unknown"
                }
            })
        else:
            print("⚠️ No detailed pollen data available, using basic response")
        
        # Add heatmap tiles if requested and available
        if heatmap_tiles:
            base_data["heatmap_tiles"] = heatmap_tiles
        
        print("✅ Enhanced environment data prepared successfully")
        return EnvironmentDataResponse(**base_data)
        
    except Exception as e:
        print(f"❌ Error in enhanced /public/current endpoint: {str(e)}")
        import traceback
        print(f"🔍 Full traceback: {traceback.format_exc()}")
        
        # Fallback to basic data if enhancement fails
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
