import requests
import json

BASE_URL = "http://localhost:8090"

def test_auth_and_pollen():
    print("🔐 Getting auth token...")
    
    # Get auth token
    auth_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data="username=test@allergyapp.com&password=testpass123"
    )
    
    if auth_response.status_code != 200:
        print(f"❌ Auth failed: {auth_response.status_code}")
        return
    
    token = auth_response.json()["access_token"]
    print(f"✅ Got token: {token[:20]}...")
    
    # Test pollen endpoint with timeout detection
    print("\n🌼 Testing pollen endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with Northern Ireland coordinates
    response = requests.get(
        f"{BASE_URL}/api/v1/environment/current",
        params={"lat": 54.6629085, "lon": -5.6863555, "include_heatmap": True},
        headers=headers,
        timeout=20  # 20 second timeout
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ SUCCESS!")
        print(f"📍 Location: {data.get('location')}")
        print(f"🌡️ Temperature: {data.get('temperature')}°C")
        print(f"🌼 Pollen Count: {data.get('pollen_count')}")
        
        # Check for enhanced features
        if data.get('daily_pollen_info'):
            print(f"📅 Daily forecasts: {len(data['daily_pollen_info'])} days")
            print("🎯 Using ENHANCED version with real Google API data!")
        else:
            print("⚠️ Using BASIC/FAST version - no detailed pollen data")
            
        if data.get('heatmap_data'):
            print("🗺️ Heatmap data available!")
        else:
            print("❌ No heatmap data")
            
        # Show first few lines of response for debugging
        print(f"\n📄 Response preview: {json.dumps(data, indent=2)[:500]}...")
        
    else:
        print(f"❌ Failed: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_auth_and_pollen()
