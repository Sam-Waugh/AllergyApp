import json
import requests

def test_pollen_endpoint():
    """Test the enhanced pollen endpoint with real location data"""
    print("🧪 Testing Enhanced Pollen Integration")
    print("=" * 50)
    
    # Test coordinates for different locations
    test_locations = [
        {"name": "New York City", "lat": 40.7128, "lon": -74.0060},
        {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
        {"name": "Chicago", "lat": 41.8781, "lon": -87.6298},
    ]
    
    for location in test_locations:
        print(f"\n📍 Testing: {location['name']}")
        print("-" * 30)
        
        try:
            url = f"http://127.0.0.1:8090/api/v1/environment/public/current"
            params = {"lat": location["lat"], "lon": location["lon"]}
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"✅ Status: Success")
                print(f"📍 Location: {data.get('location', 'N/A')}")
                print(f"🌡️  Temperature: {data.get('temperature', 'N/A')}°C")
                print(f"💧 Humidity: {data.get('humidity', 'N/A')}%")
                print(f"🌾 Pollen Level: {data.get('pollen_count', 'N/A')}")
                
                # Check for enhanced pollen data
                if 'daily_pollen_info' in data and data['daily_pollen_info']:
                    print(f"🎯 Enhanced Pollen Data: ✅ Available!")
                    pollen_info = data['daily_pollen_info']
                    print(f"   📅 Days of data: {len(pollen_info)}")
                    
                    if pollen_info:
                        today = pollen_info[0]
                        print(f"   📆 Today's date: {today.get('date', 'N/A')}")
                        pollen_types = today.get('pollen_types', [])
                        print(f"   🌾 Pollen types detected: {len(pollen_types)}")
                        
                        for pollen in pollen_types[:3]:  # Show first 3
                            print(f"      • {pollen.get('display_name', 'Unknown')}: {pollen.get('category', 'N/A')} (Index: {pollen.get('index_value', 'N/A')})")
                else:
                    print(f"⚠️  Enhanced Pollen Data: Not available")
                    
            else:
                print(f"❌ Status: Error {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🧪 Test Complete!")

if __name__ == "__main__":
    test_pollen_endpoint()
