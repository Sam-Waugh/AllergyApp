#!/usr/bin/env python3

import asyncio
import httpx
import json
from datetime import datetime

async def test_google_pollen_api():
    """Test Google Pollen API directly with your API key"""
    
    API_KEY = "YOUR_API_KEY_HERE"
    
    print("🧪 Testing Google Pollen API Direct")
    print("=" * 50)
    print(f"API Key: {API_KEY[:20]}...")
    print(f"Test Time: {datetime.now()}")
    
    # Test coordinates - New York City
    lat, lon = 40.7128, -74.0060
    print(f"Location: {lat}, {lon} (New York City)")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://pollen.googleapis.com/v1/forecast:lookup"
            params = {
                "key": API_KEY,
                "location.latitude": lat,
                "location.longitude": lon,
                "days": 5,
                "plantsDescription": True
            }
            
            print(f"\n🌐 Making request to: {url}")
            print(f"📋 Parameters: {json.dumps(params, indent=2)}")
            
            response = await client.get(url, params=params)
            
            print(f"\n📊 Response Status: {response.status_code}")
            print(f"📝 Response Headers:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print("\n✅ SUCCESS: API call successful!")
                    print(f"📄 Response structure:")
                    print(f"  - Keys: {list(data.keys())}")
                    
                    if "dailyInfo" in data:
                        daily_info = data["dailyInfo"]
                        print(f"  - Daily info entries: {len(daily_info)}")
                        
                        for i, day in enumerate(daily_info[:2]):  # Show first 2 days
                            print(f"\n📅 Day {i+1}: {day.get('date', 'No date')}")
                            
                            if "pollenTypeInfo" in day:
                                pollen_types = day["pollenTypeInfo"]
                                print(f"   🌸 Pollen types: {len(pollen_types)}")
                                
                                for pollen in pollen_types:
                                    code = pollen.get("code", "Unknown")
                                    display_name = pollen.get("displayName", "Unknown")
                                    index_info = pollen.get("indexInfo", {})
                                    category = index_info.get("category", "Unknown")
                                    value = index_info.get("value", 0)
                                    in_season = pollen.get("inSeason", False)
                                    
                                    print(f"     - {display_name} ({code}): {category} (value: {value}) {'🌟' if in_season else '❄️'}")
                            else:
                                print("   ❌ No pollen type info available")
                    else:
                        print("  ❌ No daily info in response")
                    
                    if "plantsDescription" in data and data["plantsDescription"]:
                        plants_desc = data["plantsDescription"]
                        print(f"\n🌱 Plants Description: {plants_desc[:200]}...")
                    else:
                        print("\n🌱 No plants description available")
                        
                    print(f"\n📋 Full Response:")
                    print(json.dumps(data, indent=2))
                    
                except json.JSONDecodeError as e:
                    print(f"❌ JSON decode error: {e}")
                    print(f"Raw response: {response.text}")
                    
            elif response.status_code == 403:
                print("\n❌ FORBIDDEN (403): API key may not have Pollen API access")
                print("📋 Response:", response.text)
                print("\n🔧 ACTION REQUIRED:")
                print("1. Go to Google Cloud Console")
                print("2. Enable 'Pollen API' for your project")
                print("3. Make sure billing is enabled")
                print("4. Check API key permissions")
                
            elif response.status_code == 400:
                print("\n❌ BAD REQUEST (400): Invalid parameters")
                print("📋 Response:", response.text)
                
            else:
                print(f"\n❌ API call failed with status {response.status_code}")
                print(f"📋 Response: {response.text}")
                
    except Exception as e:
        print(f"\n💥 Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_google_pollen_api())
