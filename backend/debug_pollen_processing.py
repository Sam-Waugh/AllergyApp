import asyncio
import httpx
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
POLLEN_API_BASE_URL = "https://pollen.googleapis.com/v1"

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
    
    return {
        "level": details["level"],
        "health_impact": details["health_impact"],
        "recommendations": specific_recommendations
    }

def process_detailed_pollen_data(pollen_response):
    """Process Google Pollen API response into detailed format with enhanced plant information"""
    print(f"🔍 Processing pollen response: {pollen_response is not None}")
    
    if not pollen_response:
        print("❌ No pollen response to process")
        return None, None, None, None
    
    print(f"🔍 Pollen response keys: {list(pollen_response.keys())}")
    
    daily_forecasts = []
    plant_descriptions = pollen_response.get("plantsDescription", [])
    region_code = pollen_response.get("regionCode", "")
    
    print(f"🌱 Plant descriptions: {len(plant_descriptions) if plant_descriptions else 0}")
    print(f"🌍 Region code: {region_code}")
    
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
                "picture": plant.get("picture", "")
            }
    
    # Process daily pollen information
    daily_info_list = pollen_response.get("dailyInfo", [])
    print(f"📅 Daily info entries: {len(daily_info_list)}")
    
    for i, day_info in enumerate(daily_info_list):
        print(f"  Processing day {i+1}: {day_info}")
        
        date_obj = day_info.get("date")
        if not date_obj:
            print(f"    ⚠️ No date found for day {i+1}")
            continue
        
        # Handle date format - Google API returns {year, month, day} objects
        if isinstance(date_obj, dict):
            year = date_obj.get("year", 2025)
            month = date_obj.get("month", 1)
            day = date_obj.get("day", 1)
            date = f"{year}-{month:02d}-{day:02d}"
        else:
            date = str(date_obj)
            
        print(f"    📅 Date: {date}")
        
        pollen_types = []
        
        # Process different pollen types for this day
        pollen_type_info_list = day_info.get("pollenTypeInfo", [])
        print(f"    🌼 Pollen types for this day: {len(pollen_type_info_list)}")
        
        for pollen_type_info in pollen_type_info_list:
            print(f"      Processing pollen type: {pollen_type_info}")
            
            pollen_code = pollen_type_info.get("code", "").upper()
            index_info = pollen_type_info.get("indexInfo", {})
            
            print(f"        Code: {pollen_code}, Index info: {index_info}")
            
            if pollen_code and index_info:
                category = index_info.get("category", "NONE")
                index_value = index_info.get("value", 0)
                color_info = index_info.get("color", {})
                in_season = pollen_type_info.get("inSeason", False)
                
                print(f"        Category: {category}, Value: {index_value}, In season: {in_season}")
                
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
                    "health_recommendations": pollen_details.get("recommendations", []),
                    "health_impact": pollen_details.get("health_impact", ""),
                    "severity_level": pollen_details.get("level", 0),
                    "plant_info": plant_detail
                }
                pollen_types.append(pollen_data)
                print(f"        ✅ Added pollen data: {pollen_data['display_name']} ({index_value})")
        
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
            print(f"    ✅ Added daily forecast: {day_name} with {len(pollen_types)} pollen types")
        else:
            print(f"    ⚠️ No pollen types found for {date}")
    
    print(f"🎯 Final result: {len(daily_forecasts)} daily forecasts processed")
    return pollen_response, daily_forecasts, plant_descriptions, region_code

async def test_pollen_processing():
    """Test the complete pollen data processing pipeline"""
    print("🧪 Testing Pollen Data Processing Pipeline")
    print("=" * 50)
    
    if not GOOGLE_MAPS_API_KEY:
        print("❌ No API key found!")
        return
    
    lat, lon = 40.7128, -74.0060  # New York coordinates
    
    try:
        # Step 1: Get raw data from Google API
        print("📡 Step 1: Fetching data from Google Pollen API...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{POLLEN_API_BASE_URL}/forecast:lookup",
                params={
                    "key": GOOGLE_MAPS_API_KEY,
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "days": 5,
                    "plantsDescription": True,
                    "languageCode": "en"
                }
            )
            
            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                return
            
            raw_data = response.json()
            print(f"✅ Got raw data with keys: {list(raw_data.keys())}")
        
        # Step 2: Process the data
        print("\n🔄 Step 2: Processing the raw data...")
        pollen_data, daily_forecasts, plant_descriptions, region_code = process_detailed_pollen_data(raw_data)
        
        # Step 3: Show results
        print("\n📊 Step 3: Processing Results")
        print("-" * 30)
        print(f"✅ Pollen data available: {pollen_data is not None}")
        print(f"✅ Daily forecasts: {len(daily_forecasts) if daily_forecasts else 0}")
        print(f"✅ Plant descriptions: {len(plant_descriptions) if plant_descriptions else 0}")
        print(f"✅ Region code: {region_code}")
        
        if daily_forecasts:
            print(f"\n📅 Daily Forecasts Preview:")
            for forecast in daily_forecasts[:2]:  # Show first 2 days
                print(f"  {forecast['day_name']} ({forecast['date']}): {forecast['dominant_pollen']} (index: {forecast['overall_index']})")
                for pollen in forecast['pollen_types']:
                    print(f"    - {pollen['display_name']}: {pollen['index_value']} ({pollen['category']})")
        
        return pollen_data, daily_forecasts, plant_descriptions, region_code
        
    except Exception as e:
        print(f"❌ Exception in processing: {e}")
        import traceback
        traceback.print_exc()
        return None, None, None, None

if __name__ == "__main__":
    asyncio.run(test_pollen_processing())
