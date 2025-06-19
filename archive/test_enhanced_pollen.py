#!/usr/bin/env python3
"""Test the enhanced /current endpoint with all features"""

import requests
import json

# Test coordinates - let's use a location with better pollen data
LAT = 40.7128  # New York City
LON = -74.0060

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

def test_enhanced_endpoint(token):
    """Test the enhanced /current endpoint"""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "accept": "application/json"
        }
        
        params = {
            "lat": LAT,
            "lon": LON,
            "include_heatmap": True  # Request heatmap data
        }
        
        print(f"🌍 Testing enhanced /current endpoint")
        print(f"📍 Location: New York City ({LAT}, {LON})")
        print(f"🗺️ Including heatmap data")
        
        response = requests.get(
            f"{BASE_URL}/environment/current",
            params=params,
            headers=headers
        )
        
        print(f"📈 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS!")
            print(f"📍 Location Name: {data.get('location', 'Unknown')}")
            print(f"🌡️ Temperature: {data.get('temperature', 'Unknown')}°C")
            print(f"💨 Humidity: {data.get('humidity', 'Unknown')}%")
            print(f"🌼 Pollen Count: {data.get('pollen_count', 'Unknown')}")
            
            # Check for enhanced pollen data
            if data.get('daily_pollen_info'):
                print(f"📅 Pollen Forecast Days: {len(data['daily_pollen_info'])}")
                
                for i, day in enumerate(data['daily_pollen_info'][:3]):  # Show first 3 days
                    print(f"  📆 {day.get('day_name', 'Unknown')} ({day.get('date', 'Unknown')})")
                    print(f"    🎯 Overall Index: {day.get('overall_index', 0)}")
                    print(f"    🌸 Dominant: {day.get('dominant_pollen', 'None')}")
                    
                    for pollen in day.get('pollen_types', [])[:2]:  # Show first 2 types
                        print(f"      • {pollen.get('display_name', 'Unknown')}: {pollen.get('index_value', 0)} ({pollen.get('category', 'Unknown')})")
            else:
                print("❗ No detailed pollen forecast")
            
            # Check for pollen summary
            if data.get('pollen_summary'):
                summary = data['pollen_summary']
                print(f"📊 Pollen Summary:")
                print(f"  🎯 Today's Dominant: {summary.get('today_dominant', 'Unknown')}")
                print(f"  📈 Today's Index: {summary.get('today_index', 0)}")
                print(f"  📅 Forecast Days: {summary.get('forecast_days', 0)}")
                print(f"  🔝 Peak Day: {summary.get('peak_day', 'Unknown')}")
            
            # Check for heatmap data
            if data.get('heatmap_tiles'):
                heatmap = data['heatmap_tiles']
                print(f"🗺️ Heatmap Data Available:")
                print(f"  📍 Center: {heatmap.get('center', {})}")
                print(f"  🌳 Tree Tiles: {'✅' if 'tree_upi' in heatmap.get('tiles', {}) else '❌'}")
                print(f"  🌱 Grass Tiles: {'✅' if 'grass_upi' in heatmap.get('tiles', {}) else '❌'}")
                print(f"  🌿 Weed Tiles: {'✅' if 'weed_upi' in heatmap.get('tiles', {}) else '❌'}")
            
            # Check for plant descriptions
            if data.get('plant_descriptions'):
                print(f"🌱 Plant Descriptions: {len(data['plant_descriptions'])} available")
            
            print(f"\n📄 Full Response Size: {len(json.dumps(data))} characters")
                
        else:
            print(f"❌ FAILED!")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request error: {e}")

def main():
    print("🚀 Testing Enhanced Pollen API Features")
    print("=" * 50)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without auth token")
        return
        
    print("✅ Got auth token")
    
    # Test the enhanced endpoint
    test_enhanced_endpoint(token)

if __name__ == "__main__":
    main()
