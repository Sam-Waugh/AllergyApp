#!/usr/bin/env python3
"""
Direct test of Google Pollen API to debug the issue
Based on: https://developers.google.com/maps/documentation/pollen/get-api-key
"""

import asyncio
import httpx
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_google_pollen_api():
    """Test Google Pollen API according to official documentation"""
    print("🧪 Testing Google Pollen API (Official Documentation Method)")
    print("=" * 60)
    
    # Get API key
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("❌ No Google Maps API key found in .env file")
        return False
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    # Test coordinates - New York City
    lat, lon = 40.7128, -74.0060
    print(f"📍 Testing location: New York City ({lat}, {lon})")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Official API endpoint from documentation
            url = "https://pollen.googleapis.com/v1/forecast:lookup"
            
            # Parameters according to official docs
            params = {
                "key": api_key,
                "location.latitude": lat,
                "location.longitude": lon,
                "days": 5,
                "plantsDescription": True
            }
            
            print(f"🌐 Making request to: {url}")
            print(f"📋 Parameters: {json.dumps(params, indent=2)}")
            print("⏳ Sending request...")
            
            response = await client.get(url, params=params)
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📋 Response Headers:")
            for key, value in response.headers.items():
                print(f"   {key}: {value}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print("\n✅ API call successful!")
                    print(f"📄 Response structure:")
                    print(f"   - Top-level keys: {list(data.keys())}")
                    
                    # Check daily info
                    if "dailyInfo" in data:
                        daily_info = data["dailyInfo"]
                        print(f"   - Daily info entries: {len(daily_info)}")
                        
                        if daily_info:
                            print(f"\n📅 Daily forecast details:")
                            for i, day in enumerate(daily_info):
                                date = day.get("date", "Unknown")
                                print(f"   Day {i+1}: {date}")
                                
                                if "pollenTypeInfo" in day:
                                    pollen_types = day["pollenTypeInfo"]
                                    print(f"      - Pollen types: {len(pollen_types)}")
                                    
                                    for pollen in pollen_types:
                                        code = pollen.get("code", "Unknown")
                                        display_name = pollen.get("displayName", "Unknown")
                                        in_season = pollen.get("inSeason", False)
                                        
                                        index_info = pollen.get("indexInfo", {})
                                        category = index_info.get("category", "Unknown")
                                        value = index_info.get("value", 0)
                                        
                                        season_status = "🌸 In Season" if in_season else "🍂 Out of Season"
                                        print(f"        • {display_name} ({code}): {category} (value: {value}) {season_status}")
                                else:
                                    print(f"      - No pollen type info available")
                    else:
                        print("   - No dailyInfo in response")
                    
                    # Check plants description
                    if "plantsDescription" in data:
                        plants_desc = data["plantsDescription"]
                        if plants_desc:
                            print(f"\n🌱 Plants description: {plants_desc[:200]}...")
                        else:
                            print("\n🌱 Plants description: Empty")
                    else:
                        print("\n🌱 No plants description in response")
                    
                    # Full response for debugging
                    print(f"\n📋 Full Response:")
                    print(json.dumps(data, indent=2))
                    
                    return True
                    
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse JSON response: {e}")
                    print(f"📄 Raw response: {response.text}")
                    return False
                    
            elif response.status_code == 403:
                print("\n❌ API call failed with 403 Forbidden")
                print("💡 Possible issues:")
                print("   1. API key doesn't have access to Pollen API")
                print("   2. Pollen API not enabled in Google Cloud Console")
                print("   3. Billing not set up for the project")
                print("   4. API key restrictions preventing access")
                print(f"\n📄 Error response: {response.text}")
                return False
                
            elif response.status_code == 400:
                print("\n❌ API call failed with 400 Bad Request")
                print("💡 Possible issues:")
                print("   1. Invalid parameters")
                print("   2. Invalid location coordinates")
                print("   3. API key format issue")
                print(f"\n📄 Error response: {response.text}")
                return False
                
            else:
                print(f"\n❌ API call failed with status {response.status_code}")
                print(f"📄 Response text: {response.text}")
                return False
                
    except Exception as e:
        print(f"\n💥 Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_api_key_permissions():
    """Test if the API key has necessary permissions"""
    print("\n🔑 Testing API Key Permissions")
    print("=" * 40)
    
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    # Test with a simple Maps API call first
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test Geocoding API (simpler to verify key works)
            geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
            geocode_params = {
                "address": "New York, NY",
                "key": api_key
            }
            
            print("🗺️  Testing with Geocoding API first...")
            response = await client.get(geocode_url, params=geocode_params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK":
                    print("✅ API key works with Maps APIs")
                    return True
                else:
                    print(f"❌ Geocoding API error: {data.get('status')} - {data.get('error_message', 'No error message')}")
                    return False
            else:
                print(f"❌ Geocoding API failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Error testing API key: {e}")
        return False

async def main():
    print("🧪 COMPREHENSIVE GOOGLE POLLEN API TEST")
    print("=" * 60)
    print("📖 Following: https://developers.google.com/maps/documentation/pollen/get-api-key")
    print()
    
    # Test 1: API key permissions
    key_ok = await test_api_key_permissions()
    
    # Test 2: Pollen API
    if key_ok:
        print()
        pollen_ok = await test_google_pollen_api()
        
        if pollen_ok:
            print("\n🎉 SUCCESS: Google Pollen API is working!")
        else:
            print("\n⚠️  ISSUE: Google Pollen API needs configuration")
            print("\n📋 Next steps:")
            print("1. Go to Google Cloud Console")
            print("2. Enable the 'Air Quality API' (includes Pollen)")
            print("3. Ensure billing is set up")
            print("4. Check API key restrictions")
    else:
        print("\n❌ API key has basic issues - check Google Cloud Console")

if __name__ == "__main__":
    asyncio.run(main())
