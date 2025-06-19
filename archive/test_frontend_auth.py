#!/usr/bin/env python3

import requests
import json

# Test the backend API authentication flow
base_url = "http://127.0.0.1:8090/api/v1"

def test_auth_flow():
    print("🧪 Testing Frontend Authentication Flow")
    print("=" * 50)
    
    # Test 1: Try to register test user
    print("\n1. Testing user registration...")
    register_data = {
        "email": "test@allergyapp.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/register", json=register_data)
        print(f"   Register Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ User registered successfully")
        elif response.status_code == 400:
            print("   ℹ️ User likely already exists")
        else:
            print(f"   ❌ Registration failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Registration request failed: {e}")
    
    # Test 2: Try to login and get token
    print("\n2. Testing login and token generation...")
    login_data = {
        "username": "test@allergyapp.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/token", 
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   Login Status: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print(f"   ✅ Token obtained: {access_token[:20]}...")
            
            # Test 3: Use token to access protected endpoint
            print("\n3. Testing protected endpoint access...")
            headers = {"Authorization": f"Bearer {access_token}"}
              # Try environment endpoint with location
            try:
                weather_response = requests.get(
                    f"{base_url}/environment/New York, NY",
                    headers=headers
                )
                print(f"   Weather API Status: {weather_response.status_code}")
                if weather_response.status_code == 200:
                    weather_data = weather_response.json()
                    print("   ✅ Weather data retrieved successfully")
                    
                    # Check if pollen data is included
                    if "data" in weather_data and weather_data["data"]:
                        data = weather_data["data"]
                        has_pollen = "dailyPollenInfo" in data and data["dailyPollenInfo"]
                        print(f"   Pollen data included: {'✅ YES' if has_pollen else '❌ NO'}")
                        
                        if has_pollen:
                            pollen_count = len(data["dailyPollenInfo"])
                            print(f"   Pollen forecast days: {pollen_count}")
                            if pollen_count > 0:
                                first_day = data["dailyPollenInfo"][0]
                                pollen_types = first_day.get("pollenTypes", [])
                                print(f"   Pollen types today: {len(pollen_types)}")
                                for pollen in pollen_types[:3]:  # Show first 3
                                    print(f"     - {pollen.get('displayName')}: {pollen.get('category')}")
                    else:
                        print("   ❌ No weather data in response")
                        
                else:
                    print(f"   ❌ Weather API failed: {weather_response.text}")
            except Exception as e:
                print(f"   ❌ Weather request failed: {e}")
                
        else:
            print(f"   ❌ Login failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Login request failed: {e}")

if __name__ == "__main__":
    test_auth_flow()
