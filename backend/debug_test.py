#!/usr/bin/env python3

import httpx
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_google_pollen_api():
    """Test the Google Pollen API directly"""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    print(f"API Key present: {'Yes' if api_key else 'No'}")
    if api_key:
        print(f"API Key (first 20 chars): {api_key[:20]}...")
    
    if not api_key:
        print("❌ No Google Maps API key found")
        return
    
    # Test coordinates for New York
    lat, lon = 40.7128, -74.0060
    
    try:
        async with httpx.AsyncClient() as client:
            print(f"\n🧪 Testing Google Pollen API for coordinates: {lat}, {lon}")
            
            response = await client.get(
                "https://pollen.googleapis.com/v1/forecast:lookup",
                params={
                    "key": api_key,
                    "location.latitude": lat,
                    "location.longitude": lon,
                    "days": 1,
                    "plantsDescription": True
                }
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Google Pollen API working!")
                print(f"Daily info count: {len(data.get('dailyInfo', []))}")
                
                if data.get('dailyInfo'):
                    first_day = data['dailyInfo'][0]
                    print(f"First day date: {first_day.get('date')}")
                    print(f"Pollen types: {len(first_day.get('pollenTypeInfo', []))}")
                    
                    for pollen in first_day.get('pollenTypeInfo', [])[:3]:
                        code = pollen.get('code')
                        display_name = pollen.get('displayName')
                        index_info = pollen.get('indexInfo', {})
                        category = index_info.get('category', 'Unknown')
                        value = index_info.get('value', 0)
                        print(f"  - {display_name} ({code}): {category} (value: {value})")
                
                plant_desc = data.get('plantsDescription', '')
                if plant_desc:
                    print(f"Plant description: {plant_desc[:100]}...")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_google_pollen_api())
