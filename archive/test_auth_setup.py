#!/usr/bin/env python3
"""
Create a test user and get authentication token for testing
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8090/api/v1"

def create_test_user():
    """Create a test user"""
    print("🔐 Creating test user...")
    
    user_data = {
        "email": "test@allergyapp.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        if response.status_code == 200:
            print("✅ Test user created successfully")
            return True
        elif response.status_code == 400 and "Email already registered" in response.text:
            print("✅ Test user already exists")
            return True
        else:
            print(f"❌ Failed to create user: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False

def get_auth_token():
    """Get authentication token for test user"""
    print("🔑 Getting authentication token...")
    
    token_data = {
        "username": "test@allergyapp.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token", 
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_info = response.json()
            access_token = token_info["access_token"]
            print("✅ Authentication token obtained")
            print(f"🔐 Token: {access_token[:20]}...")
            return access_token
        else:
            print(f"❌ Failed to get token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        return None

def test_environment_api(token):
    """Test the environment API with authentication"""
    print("🌿 Testing environment API...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test current environment endpoint
    params = {"lat": 40.7128, "lon": -74.0060, "include_heatmap": True}
    
    try:
        response = requests.get(
            f"{BASE_URL}/environment/current",
            params=params,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Environment API working")
            print(f"📍 Location: {data.get('location', 'Unknown')}")
            print(f"🌡️  Temperature: {data.get('temperature', 'N/A')}°C")
            print(f"🌾 Pollen: {data.get('pollen_count', 'N/A')}")
            
            # Check for enhanced pollen data
            if data.get('daily_pollen_info'):
                print(f"✅ Enhanced pollen data available: {len(data['daily_pollen_info'])} days")
                if data['daily_pollen_info'] and data['daily_pollen_info'][0].get('pollen_types'):
                    print(f"🌿 Pollen types today: {len(data['daily_pollen_info'][0]['pollen_types'])}")
            else:
                print("⚠️  No enhanced pollen data found")
            
            return data
        else:
            print(f"❌ Environment API failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return None

def main():
    print("🧪 Allergy App API Testing Script")
    print("=" * 40)
    
    # Create test user
    if not create_test_user():
        print("Failed to create test user, exiting...")
        return
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("Failed to get auth token, exiting...")
        return
    
    # Test environment API
    env_data = test_environment_api(token)
    
    print("\n" + "=" * 40)
    if env_data:
        print("🎉 All tests passed!")
        print(f"🔐 Use this token in your app: {token}")
    else:
        print("❌ Some tests failed")

if __name__ == "__main__":
    main()
