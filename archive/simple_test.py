#!/usr/bin/env python3

import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("🧪 Simple Environment Test")
print("=" * 30)

# Test 1: Check if .env file is loaded
print("1. Testing environment variables...")
try:
    from dotenv import load_dotenv
    load_dotenv()
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    print(f"   Google API Key: {'Present' if api_key else 'Missing'}")
    if api_key:
        print(f"   Key starts with: {api_key[:20]}...")
except Exception as e:
    print(f"   Error loading .env: {e}")

# Test 2: Test basic imports
print("\n2. Testing imports...")
try:
    from schemas.schemas import EnvironmentDataResponse
    print("   ✅ EnvironmentDataResponse imported")
except Exception as e:
    print(f"   ❌ EnvironmentDataResponse import failed: {e}")

try:
    from routers.environment import GOOGLE_MAPS_API_KEY
    print("   ✅ Environment router imported")
    print(f"   API Key in router: {'Present' if GOOGLE_MAPS_API_KEY else 'Missing'}")
except Exception as e:
    print(f"   ❌ Environment router import failed: {e}")

# Test 3: Test creating simple response
print("\n3. Testing simple response creation...")
try:
    from schemas.schemas import EnvironmentDataResponse
    
    simple_data = {
        "location": "Test",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "weather_conditions": "sunny",
        "temperature": 20.0,
        "humidity": 50.0,
        "air_quality_index": 30,
        "pollen_count": "low",
        "uv_index": 5
    }
    
    response = EnvironmentDataResponse(**simple_data)
    print("   ✅ Simple EnvironmentDataResponse created successfully")
    print(f"   Location: {response.location}")
    
except Exception as e:
    print(f"   ❌ Failed to create response: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Test completed")
