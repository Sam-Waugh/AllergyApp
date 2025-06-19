#!/usr/bin/env python3
"""
Quick test to verify backend is responding and frontend component fix
"""
import requests
import json

def test_backend():
    """Test backend API endpoints"""
    print("🔧 Testing Backend API...")
    
    try:
        # Test public endpoint
        response = requests.get("http://localhost:8090/api/v1/environment/current-public")
        print(f"✅ Backend Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📍 Location: {data.get('location', 'N/A')}")
            print(f"🌍 Coordinates: {data.get('latitude', 'N/A')}, {data.get('longitude', 'N/A')}")
            print(f"🌸 Pollen Count: {data.get('pollen_count', 'N/A')}")
            
            if data.get('heatmap_data'):
                print("✅ Heatmap data available for map components")
            else:
                print("⚠️ No heatmap data - map will show fallback content")
                
        else:
            print(f"❌ Backend error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server on port 8090")
        print("💡 Make sure the backend server is running")
    except Exception as e:
        print(f"❌ Backend test error: {e}")

def test_frontend():
    """Test frontend server"""
    print("\n🌐 Testing Frontend Server...")
    
    try:
        response = requests.get("http://localhost:8084")
        print(f"✅ Frontend Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Frontend server is running and accessible")
            print("🎯 Ready for React component testing")
        else:
            print(f"❌ Frontend error: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend server on port 8084")
        print("💡 Make sure the Expo server is running")
    except Exception as e:
        print(f"❌ Frontend test error: {e}")

def main():
    print("🧪 Component Fix Verification Test")
    print("="*50)
    
    test_backend()
    test_frontend()
    
    print("\n📋 Next Steps:")
    print("1. ✅ Open http://localhost:8084 in browser")
    print("2. ✅ Navigate to Pollen tab")
    print("3. ✅ Check for React errors in browser console")
    print("4. ✅ Test interactive map component")
    print("5. ✅ Verify fullscreen modal works")
    
    print("\n🎯 Expected Results:")
    print("- No 'Element type is invalid' errors")
    print("- PollenScreen renders correctly")
    print("- Interactive map component visible")
    print("- Map controls functional")

if __name__ == "__main__":
    main()
