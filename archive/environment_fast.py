from fastapi import APIRouter, Depends, Query
from utils.auth import get_current_user
from models.models import User
from schemas.schemas import EnvironmentDataResponse
import httpx
import os
from typing import Optional
import asyncio

router = APIRouter()

# Google Maps API configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

async def get_location_name_simple(lat: float, lon: float) -> str:
    """Get location name with enhanced Google Geocoding API parsing for any coordinates worldwide"""
    
    print(f"🔍 Getting location name for coordinates: {lat}, {lon}")
    
    # Try Google Geocoding API first for universal coverage
    if GOOGLE_MAPS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Try multiple API calls with different parameters for better results
                location_name = None
                
                # Strategy 1: General geocoding (most comprehensive)
                response = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={
                        "latlng": f"{lat},{lon}", 
                        "key": GOOGLE_MAPS_API_KEY,
                        "language": "en"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"🌐 Geocoding API status: {data.get('status')}")
                    if data.get("results") and data.get("status") == "OK":
                        location_name = extract_location_from_geocoding(data["results"])
                        if location_name:
                            print(f"✅ Found location via general geocoding: {location_name}")
                            return f"📍 {location_name}"
                
                # Strategy 2: If general failed, try with specific result types
                if not location_name:
                    response = await client.get(
                        "https://maps.googleapis.com/maps/api/geocode/json",
                        params={
                            "latlng": f"{lat},{lon}", 
                            "key": GOOGLE_MAPS_API_KEY,
                            "result_type": "locality|administrative_area_level_1|administrative_area_level_2|country",
                            "language": "en"
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("results") and data.get("status") == "OK":
                            location_name = extract_location_from_geocoding(data["results"])
                            if location_name:
                                print(f"✅ Found location via filtered geocoding: {location_name}")
                                return f"📍 {location_name}"
                
        except Exception as e:
            print(f"❌ Geocoding API error: {e}")
    else:
        print("⚠️ No Google Maps API key available")
    
    # Fallback to known cities for common locations (faster response)
    major_cities = {
        (40.7128, -74.0060): "New York, NY",
        (34.0522, -118.2437): "Los Angeles, CA", 
        (41.8781, -87.6298): "Chicago, IL",
        (29.7604, -95.3698): "Houston, TX",
        (33.4484, -112.0740): "Phoenix, AZ",
        (39.9526, -75.1652): "Philadelphia, PA",
        (32.7767, -96.7970): "Dallas, TX",
        (37.7749, -122.4194): "San Francisco, CA",
        (47.6062, -122.3321): "Seattle, WA",
        (25.7617, -80.1918): "Miami, FL",
        (54.6536, -5.6680): "Bangor, Northern Ireland",
        (44.8016, -68.7712): "Bangor, ME",
        (51.5074, -0.1278): "London, UK",
        (53.3498, -6.2603): "Dublin, Ireland",
        (55.8642, -4.2518): "Glasgow, Scotland",
        (53.4808, -2.2426): "Manchester, UK",
        (52.5200, 13.4050): "Berlin, Germany",
        (48.8566, 2.3522): "Paris, France",
        (41.9028, 12.4964): "Rome, Italy",
        (40.4168, -3.7038): "Madrid, Spain",
    }
    
    # Check if coordinates match a known city (within ~0.05 degree tolerance for better accuracy)
    for (city_lat, city_lon), city_name in major_cities.items():
        if abs(lat - city_lat) < 0.05 and abs(lon - city_lon) < 0.05:
            print(f"✅ Found location via known cities: {city_name}")
            return f"📍 {city_name}"
    
    # Final fallback with coordinates
    print(f"⚠️ Using coordinate fallback for {lat}, {lon}")
    return f"📍 Location ({lat:.4f}, {lon:.4f})"


def extract_location_from_geocoding(results: list) -> str:
    """Extract the best location name from Google Geocoding API results with enhanced parsing"""
    if not results:
        return ""
    
    print(f"🔍 Processing {len(results)} geocoding results")
    
    # Try multiple strategies to get the best location name
    for result in results:
        components = result.get("address_components", [])
        print(f"📍 Analyzing result: {result.get('formatted_address', 'No address')}")
        
        # Strategy 1: Look for locality (city/town) + administrative area (state/province/country)
        locality = None
        sublocality = None
        admin_area_1 = None
        admin_area_2 = None
        country = None
        
        for component in components:
            types = component.get("types", [])
            long_name = component.get("long_name", "")
            short_name = component.get("short_name", "")
            
            print(f"  Component: {long_name} ({short_name}) - Types: {types}")
            
            # City/Town/Village (highest priority)
            if "locality" in types:
                locality = long_name
            elif "sublocality" in types or "sublocality_level_1" in types:
                sublocality = long_name
            elif "administrative_area_level_3" in types and not locality:
                locality = long_name  # Town/City level
            
            # Administrative areas
            if "administrative_area_level_1" in types:
                admin_area_1 = short_name or long_name  # State/Province/Region
            elif "administrative_area_level_2" in types:
                admin_area_2 = long_name  # County/District
            
            # Country
            if "country" in types:
                country = short_name or long_name
        
        # Build location string based on what we found
        location_parts = []
        
        # Primary location (city/town)
        primary_location = locality or sublocality or admin_area_2
        if primary_location:
            location_parts.append(primary_location)
        
        # Secondary location (state/province/country)
        if admin_area_1 and admin_area_1 != primary_location:
            location_parts.append(admin_area_1)
        elif country and country != primary_location and len(location_parts) == 1:
            location_parts.append(country)
        
        if location_parts:
            location_string = ", ".join(location_parts)
            print(f"✅ Built location string: {location_string}")
            return location_string
    
    # Strategy 2: Use formatted address and extract meaningful parts
    first_result = results[0]
    formatted_address = first_result.get("formatted_address", "")
    
    if formatted_address:
        print(f"📍 Falling back to formatted address: {formatted_address}")
        # Split by comma and take first 1-2 meaningful parts
        parts = [p.strip() for p in formatted_address.split(",")]
        
        # Filter out postal codes, long addresses, and numbers
        meaningful_parts = []
        for part in parts:
            part_clean = part.strip()
            
            # Skip if it's mostly numbers (likely postal code or street number)
            if part_clean.replace(" ", "").replace("-", "").isdigit():
                continue
                
            # Skip postal codes (common patterns)
            if len(part_clean.split()) == 1 and (
                part_clean.replace(" ", "").isalnum() and 
                any(c.isdigit() for c in part_clean)
            ):
                continue
                
            # Skip very long street addresses
            street_keywords = ["road", "street", "avenue", "drive", "lane", "way", "boulevard", "circle", "court"]
            if any(keyword in part_clean.lower() for keyword in street_keywords):
                continue
                
            meaningful_parts.append(part_clean)
            if len(meaningful_parts) >= 2:
                break
        
        if meaningful_parts:
            result_string = ", ".join(meaningful_parts[:2])
            print(f"✅ Extracted from formatted address: {result_string}")
            return result_string
        elif parts:
            print(f"✅ Using first part of formatted address: {parts[0]}")
            return parts[0]
    
    print("❌ Could not extract meaningful location name")
    return ""

async def get_pollen_data_simple(lat: float, lon: float) -> Optional[dict]:
    """Get pollen data with simple error handling"""
    if not GOOGLE_MAPS_API_KEY:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                "https://pollen.googleapis.com/v1/forecast:lookup",
                params={
                    "key": GOOGLE_MAPS_API_KEY,
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "days": 5,
                    "languageCode": "en"
                }
            )
            
            if response.status_code == 200:
                return response.json()
    except:
        pass
    
    return None

def process_pollen_simple(pollen_response: Optional[dict]) -> tuple:
    """Process pollen data simply"""
    if not pollen_response:
        return [], "moderate"
    
    daily_forecasts = []
    
    try:
        for day_info in pollen_response.get("dailyInfo", []):
            date_obj = day_info.get("date", {})
            if isinstance(date_obj, dict):
                year = date_obj.get("year", 2025)
                month = date_obj.get("month", 1)
                day = date_obj.get("day", 1)
                date = f"{year}-{month:02d}-{day:02d}"
            else:
                date = str(date_obj)
                
            pollen_types = []
            max_index = 0
            
            for pollen_info in day_info.get("pollenTypeInfo", []):
                index_info = pollen_info.get("indexInfo", {})
                index_value = index_info.get("value", 0)
                max_index = max(max_index, index_value)
                
                pollen_types.append({
                    "code": pollen_info.get("code", ""),
                    "display_name": pollen_info.get("displayName", ""),
                    "index_value": index_value,
                    "category": index_info.get("category", ""),
                    "in_season": pollen_info.get("inSeason", False)
                })
            
            if pollen_types:
                daily_forecasts.append({
                    "date": date,
                    "pollen_types": pollen_types,
                    "overall_index": max_index
                })
    except:
        pass
    
    # Determine overall pollen level
    if daily_forecasts:
        today_index = daily_forecasts[0].get("overall_index", 0)
        if today_index <= 1:
            pollen_level = "low"
        elif today_index <= 3:
            pollen_level = "moderate"
        else:
            pollen_level = "high"
    else:
        pollen_level = "moderate"
    
    return daily_forecasts, pollen_level

@router.get("/current", response_model=EnvironmentDataResponse)
async def get_current_environment_data_fast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    include_heatmap: bool = Query(False, description="Include pollen heatmap tile URLs"),
    current_user: User = Depends(get_current_user)
):
    """Get current environmental data with enhanced features but simple error handling"""
      # Get location name and pollen data concurrently
    try:
        location_task = get_location_name_simple(lat, lon)
        pollen_task = get_pollen_data_simple(lat, lon)
        
        # Wait for both with overall timeout
        location_name, pollen_response = await asyncio.gather(
            location_task, pollen_task, return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(location_name, Exception):
            location_name = f"Location at {lat:.4f}, {lon:.4f}"
        if isinstance(pollen_response, Exception):
            pollen_response = None
            
    except:
        location_name = f"Location at {lat:.4f}, {lon:.4f}"
        pollen_response = None
    
    # Process pollen data - ensure pollen_response is dict or None
    if isinstance(pollen_response, dict):
        daily_forecasts, pollen_level = process_pollen_simple(pollen_response)
    else:
        daily_forecasts, pollen_level = process_pollen_simple(None)
    
    # Create base response
    base_data = {
        "location": location_name,
        "latitude": lat,
        "longitude": lon,
        "weather_conditions": "partly_cloudy",
        "temperature": 20.0,
        "humidity": 60.0,
        "air_quality_index": 50,
        "uv_index": 5,
        "pollen_count": pollen_level
    }
    
    # Add enhanced data if available
    if daily_forecasts:
        base_data["daily_pollen_info"] = daily_forecasts
        
    # Add heatmap data if requested
    if include_heatmap and GOOGLE_MAPS_API_KEY:
        base_data["heatmap_data"] = {
            "center": {"lat": lat, "lon": lon, "zoom": 12},
            "tree_tiles": f"https://pollen.googleapis.com/v1/mapTypes/TREE_UPI/heatmapTiles/12/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}",
            "grass_tiles": f"https://pollen.googleapis.com/v1/mapTypes/GRASS_UPI/heatmapTiles/12/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}",
            "weed_tiles": f"https://pollen.googleapis.com/v1/mapTypes/WEED_UPI/heatmapTiles/12/{{x}}/{{y}}?key={GOOGLE_MAPS_API_KEY}"
        }
    
    return EnvironmentDataResponse(**base_data)

@router.get("/{location}", response_model=EnvironmentDataResponse)
async def get_environment_data_fast(
    location: str,
    current_user: User = Depends(get_current_user),
):
    """Get environmental data for a specific location (fast response)"""
    
    # Return mock data immediately
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

# Public endpoint for testing location detection (no auth required)
@router.get("/public/current")
async def get_current_environment_data_public(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Get current environmental data (public endpoint for testing)"""
    try:
        # Get location name and pollen data concurrently
        location_task = get_location_name_simple(lat, lon)
        pollen_task = get_pollen_data_simple(lat, lon)
        
        # Wait for both with overall timeout
        location_name, pollen_response = await asyncio.gather(
            location_task, pollen_task, return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(location_name, Exception):
            location_name = f"Location at {lat:.4f}, {lon:.4f}"
        if isinstance(pollen_response, Exception):
            pollen_response = None
            
    except:
        location_name = f"Location at {lat:.4f}, {lon:.4f}"
        pollen_response = None
    
    # Process pollen data - ensure pollen_response is dict or None
    if isinstance(pollen_response, dict):
        daily_forecasts, pollen_level = process_pollen_simple(pollen_response)
    else:
        daily_forecasts, pollen_level = process_pollen_simple(None)
    
    # Create response
    response_data = {
        "location": location_name,
        "latitude": lat,
        "longitude": lon,
        "weather_conditions": "partly_cloudy",
        "temperature": 20.0,
        "humidity": 60.0,
        "air_quality_index": 50,
        "uv_index": 5,
        "pollen_count": pollen_level
    }
    
    # Add enhanced data if available
    if daily_forecasts:
        response_data["daily_pollen_info"] = daily_forecasts
    
    return response_data
