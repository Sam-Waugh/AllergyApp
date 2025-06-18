#!/usr/bin/env python3
"""Debug script to test environment functionality step by step"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_google_pollen_api():
    """Test if Google Pollen API is working"""
    print("Testing Google Pollen API...")
    
    # Import the function from our environment router
    try:
        from routers.environment import get_google_pollen_data, GOOGLE_MAPS_API_KEY
        print(f"✅ Environment imports successful")
        print(f"API Key present: {'✅ YES' if GOOGLE_MAPS_API_KEY else '❌ NO'}")
        
        if GOOGLE_MAPS_API_KEY:
            # Test with New York coordinates
            lat, lon = 40.7128, -74.0060
            print(f"Testing with coordinates: {lat}, {lon}")
            
            result = await get_google_pollen_data(lat, lon)
            if result:
                print("✅ Google Pollen API call successful")
                print(f"Response keys: {list(result.keys())}")
                return True
            else:
                print("❌ Google Pollen API call failed - no data returned")
                return False
        else:
            print("❌ No Google Maps API key configured")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Google Pollen API: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_schemas():
    """Test if schemas can be imported and used"""
    print("\nTesting schemas...")
    try:
        from schemas.schemas import EnvironmentDataResponse, PollenTypeData
        print("✅ Schema imports successful")
        
        # Test creating a simple EnvironmentDataResponse
        test_response = EnvironmentDataResponse(
            location="Test Location",
            latitude=40.7128,
            longitude=-74.0060,
            weather_conditions="sunny",
            temperature=20.0,
            humidity=50.0,
            air_quality_index=30,
            pollen_count="low",
            uv_index=5
        )
        print("✅ EnvironmentDataResponse creation successful")
        return True
        
    except Exception as e:
        print(f"❌ Error testing schemas: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    print("🧪 Environment Debug Test")
    print("=" * 40)
    
    # Test 1: Schema imports
    schema_ok = test_schemas()
    
    # Test 2: Google API
    if schema_ok:
        api_ok = await test_google_pollen_api()
        
        if api_ok:
            print("\n✅ All tests passed - environment should work")
        else:
            print("\n⚠️ API test failed but schemas work - check API key")
    else:
        print("\n❌ Schema test failed - check imports")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
