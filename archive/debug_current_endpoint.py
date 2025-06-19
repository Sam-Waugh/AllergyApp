#!/usr/bin/env python3
"""Debug script to test the /current endpoint with the exact coordinates causing the issue"""

import requests
import json

# Test coordinates from the error
LAT = 54.6629085
LON = -5.6863555

BASE_URL = "http://127.0.0.1:8090/api/v1"

def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token",
            data={
                "username": "test@allergyapp.com",
                "password": "testpassword123"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"❌ Auth failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None

def test_current_endpoint(token):
    """Test the /current endpoint with the problematic coordinates"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json"
        }
        
        params = {
            "lat": LAT,
            "lon": LON
        }
        
        print(f"🔍 Testing /current endpoint with coordinates: {LAT}, {LON}")
        print(f"📡 URL: {BASE_URL}/environment/current")
        print(f"📊 Params: {params}")
        
        response = requests.get(
            f"{BASE_URL}/environment/current",
            params=params,
            headers=headers
        )
        
        print(f"📈 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS!")
            print(f"📍 Location: {data.get('location', 'Unknown')}")
            print(f"🌡️ Temperature: {data.get('temperature', 'Unknown')}°C")
            print(f"🌼 Pollen Count: {data.get('pollen_count', 'Unknown')}")
            
            if data.get('daily_pollen_info'):
                print(f"📅 Pollen Forecast Days: {len(data['daily_pollen_info'])}")
                if len(data['daily_pollen_info']) > 0:
                    today = data['daily_pollen_info'][0]
                    print(f"🌸 Today's Pollen Types: {len(today.get('pollen_types', []))}")
            else:
                print("❗ No detailed pollen data")
                
        else:
            print(f"❌ FAILED!")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request error: {e}")

def main():
    print("🚀 Starting debug test for /current endpoint")
    print("=" * 50)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without auth token")
        return
        
    print("✅ Got auth token")
    
    # Test the endpoint
    test_current_endpoint(token)

if __name__ == "__main__":
    main()
