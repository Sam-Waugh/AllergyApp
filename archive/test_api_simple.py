import requests
import json

def test_google_pollen_api():
    """Test your Google Pollen API key directly"""
    
    # Your API key from the .env file
    API_KEY = "YOUR_API_KEY_HERE"
    
    print("🧪 Testing Google Pollen API")
    print("=" * 50)
    print(f"API Key: {API_KEY[:20]}...")
    
    # Test with New York coordinates
    lat, lon = 40.7128, -74.0060
    
    url = "https://pollen.googleapis.com/v1/forecast:lookup"
    params = {
        "key": API_KEY,
        "location.latitude": lat,
        "location.longitude": lon,
        "days": 1
    }
    
    print(f"\n🌐 Making request to: {url}")
    print(f"📍 Location: {lat}, {lon} (New York)")
    print(f"📋 Parameters: {json.dumps(params, indent=2)}")
    
    try:
        response = requests.get(url, params=params, timeout=30)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS! Pollen data retrieved")
            print(f"📄 Response keys: {list(data.keys())}")
            
            if "dailyInfo" in data and data["dailyInfo"]:
                daily_info = data["dailyInfo"][0]
                print(f"📅 Date: {daily_info.get('date', 'No date')}")
                
                if "pollenTypeInfo" in daily_info:
                    pollen_types = daily_info["pollenTypeInfo"]
                    print(f"🌸 Pollen types found: {len(pollen_types)}")
                    
                    for pollen in pollen_types:
                        code = pollen.get("code", "Unknown")
                        display_name = pollen.get("displayName", "Unknown")
                        in_season = pollen.get("inSeason", False)
                        
                        index_info = pollen.get("indexInfo", {})
                        if index_info:
                            category = index_info.get("category", "Unknown")
                            value = index_info.get("value", 0)
                            print(f"  - {display_name} ({code}): {category} (value: {value}) {'🌟' if in_season else '❄️'}")
                        else:
                            print(f"  - {display_name} ({code}): No index info ❄️")
                else:
                    print("❌ No pollen type info in response")
            else:
                print("❌ No daily info in response")
                
            return True
            
        elif response.status_code == 403:
            print("\n❌ FORBIDDEN (403)")
            print("📋 Response:", response.text)
            print("\n🔧 POSSIBLE ISSUES:")
            print("1. Pollen API is not enabled in Google Cloud Console")
            print("2. API key doesn't have Pollen API permissions")
            print("3. Billing is not enabled for your Google Cloud project")
            print("\n🛠️ TO FIX:")
            print("1. Go to https://console.cloud.google.com/")
            print("2. Enable 'Pollen API' in the API library")
            print("3. Ensure billing is set up")
            print("4. Check API key restrictions")
            return False
            
        elif response.status_code == 400:
            print("\n❌ BAD REQUEST (400)")
            print("📋 Response:", response.text)
            return False
            
        else:
            print(f"\n❌ API call failed with status {response.status_code}")
            print(f"📋 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n💥 Exception: {e}")
        return False

if __name__ == "__main__":
    success = test_google_pollen_api()
    
    if success:
        print("\n🎉 Google Pollen API is working correctly!")
        print("Your API key has proper permissions and the service is enabled.")
    else:
        print("\n⚠️ Google Pollen API is not working properly.")
        print("Please follow the setup instructions above.")
