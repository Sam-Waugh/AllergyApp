#!/usr/bin/env python3

import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_google_pollen_direct():
    """Test Google Pollen API directly"""
    print("🧪 Testing Google Pollen API Direct Call")
    print("=" * 50)
    
    # Get API key
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("❌ No Google Maps API key found in environment")
        return
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    # Test coordinates for New York
    lat, lon = 40.7128, -74.0060
    print(f"📍 Testing with coordinates: {lat}, {lon}")
    
    # Make the API call
    try:
        async with httpx.AsyncClient() as client:
            url = "https://pollen.googleapis.com/v1/forecast:lookup"
            params = {
                "key": api_key,
                "location.latitude": lat,
                "location.longitude": lon,
                "days": 5,
                "plantsDescription": True
            }
            
            print(f"🌐 Making request to: {url}")
            print(f"📋 Parameters: {params}")
            
            response = await client.get(url, params=params)
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📝 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ API call successful!")
                print(f"📄 Response keys: {list(data.keys())}")
                
                if "dailyInfo" in data:
                    daily_info = data["dailyInfo"]
                    print(f"📅 Daily info entries: {len(daily_info)}")
                    
                    if daily_info:
                        first_day = daily_info[0]
                        print(f"🗓️ First day date: {first_day.get('date')}")
                        
                        if "pollenTypeInfo" in first_day:
                            pollen_types = first_day["pollenTypeInfo"]
                            print(f"🌸 Pollen types: {len(pollen_types)}")
                            
                            for pollen in pollen_types:
                                code = pollen.get("code", "Unknown")
                                display_name = pollen.get("displayName", "Unknown")
                                index_info = pollen.get("indexInfo", {})
                                category = index_info.get("category", "Unknown")
                                value = index_info.get("value", 0)
                                print(f"  - {display_name} ({code}): {category} (value: {value})")
                        else:
                            print("❌ No pollenTypeInfo in first day")
                    else:
                        print("❌ Daily info is empty")
                else:
                    print("❌ No dailyInfo in response")
                    
                if "plantsDescription" in data:
                    plants_desc = data["plantsDescription"]
                    if plants_desc:
                        print(f"🌱 Plants description: {plants_desc[:100]}...")
                    else:
                        print("ℹ️ No plants description")
                        
            else:
                print(f"❌ API call failed with status {response.status_code}")
                print(f"📄 Response text: {response.text}")
                
    except Exception as e:
        print(f"💥 Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_google_pollen_direct())
