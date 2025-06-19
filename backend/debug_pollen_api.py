import asyncio
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
POLLEN_API_BASE_URL = "https://pollen.googleapis.com/v1"

async def test_pollen_api():
    """Test the Google Pollen API directly"""
    print(f"🔑 API Key configured: {bool(GOOGLE_MAPS_API_KEY)}")
    print(f"🔑 API Key (first 10 chars): {GOOGLE_MAPS_API_KEY[:10] if GOOGLE_MAPS_API_KEY else 'None'}...")
    
    if not GOOGLE_MAPS_API_KEY:
        print("❌ No API key found!")
        return
    
    lat, lon = 40.7128, -74.0060  # New York coordinates
    
    try:
        print(f"🌼 Testing Google Pollen API for lat={lat}, lon={lon}")
        async with httpx.AsyncClient() as client:
            # Test the pollen API
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
            
            print(f"📊 Response status: {response.status_code}")
            print(f"📊 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Response keys: {list(data.keys())}")
                
                if 'dailyInfo' in data:
                    print(f"📅 Daily forecast days: {len(data['dailyInfo'])}")
                    for i, day in enumerate(data['dailyInfo'][:3]):  # Show first 3 days
                        print(f"  Day {i+1}: {day.get('date', 'N/A')}")
                        if 'pollenTypeInfo' in day:
                            for pollen in day['pollenTypeInfo']:
                                print(f"    {pollen.get('displayName', 'Unknown')}: {pollen.get('indexInfo', {}).get('displayName', 'N/A')}")
                
                if 'plantsDescription' in data:
                    plants = data['plantsDescription']
                    print(f"🌱 Plant descriptions: {len(plants) if plants else 0}")
                    if plants:
                        for plant in plants[:3]:  # Show first 3 plants
                            print(f"  {plant.get('displayName', 'Unknown')}: {plant.get('type', 'N/A')}")
                
                return data
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                
                # Check if it's an API key issue
                if response.status_code == 403:
                    print("🔍 This might be an API key permissions issue.")
                    print("Make sure the Pollen API is enabled in Google Cloud Console.")
                elif response.status_code == 400:
                    print("🔍 This might be a request format issue.")
                    
                return None
                
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(test_pollen_api())
