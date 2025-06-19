#!/usr/bin/env python3
"""Test Google APIs directly to diagnose the issues"""

import requests
import json
import os

# API Key
API_KEY = "YOUR_API_KEY_HERE"

# Test coordinates - Northern Ireland
LAT = 54.6629085
LON = -5.6863555

def test_geocoding_api():
    """Test Google Geocoding API for location name"""
    print("🌍 Testing Google Geocoding API...")
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{LAT},{LON}",
            "key": API_KEY,
            "result_type": "locality|administrative_area_level_1|country"
        }
        
        print(f"📡 Request URL: {url}")
        print(f"📊 Parameters: {params}")
        
        response = requests.get(url, params=params)
        print(f"📈 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Geocoding API Success!")
            print(f"📄 Results count: {len(data.get('results', []))}")
            
            if data.get('results'):
                result = data['results'][0]
                print(f"📍 Formatted Address: {result.get('formatted_address')}")
                
                components = result.get('address_components', [])
                print(f"🏗️ Address Components: {len(components)}")
                
                for component in components:
                    types = component.get('types', [])
                    print(f"  - {component.get('long_name')} ({', '.join(types)})")
            else:
                print("❌ No results found")
                
        else:
            print(f"❌ Geocoding API Error: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Geocoding API Exception: {e}")

def test_pollen_api():
    """Test Google Pollen API"""
    print("\n🌼 Testing Google Pollen API...")
    
    try:
        url = "https://pollen.googleapis.com/v1/forecast:lookup"
        params = {
            "key": API_KEY,
            "location.latitude": LAT,
            "location.longitude": LON,
            "days": 5,
            "plantsDescription": True,
            "languageCode": "en"
        }
        
        print(f"📡 Request URL: {url}")
        print(f"📊 Parameters: {params}")
        
        response = requests.get(url, params=params)
        print(f"📈 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Pollen API Success!")
            print(f"📋 Response keys: {list(data.keys())}")
            
            if 'dailyInfo' in data:
                daily_info = data['dailyInfo']
                print(f"📅 Daily forecast days: {len(daily_info)}")
                if daily_info:
                    first_day = daily_info[0]
                    print(f"🗓️ First day date: {first_day.get('date')}")
                    
                    if 'pollenTypeInfo' in first_day:
                        pollen_types = first_day['pollenTypeInfo']
                        print(f"🌸 Pollen types available: {len(pollen_types)}")
                        for pollen in pollen_types:
                            code = pollen.get('code', 'Unknown')
                            display_name = pollen.get('displayName', 'Unknown')
                            in_season = pollen.get('inSeason', False)
                            index_info = pollen.get('indexInfo', {})
                            category = index_info.get('category', 'Unknown')
                            value = index_info.get('value', 'Unknown')
                            print(f"  - {display_name} ({code}): {category} (value: {value}, in season: {in_season})")
            
            if 'plantsDescription' in data:
                plants = data['plantsDescription']
                if plants:
                    print(f"🌱 Plant descriptions: {len(plants)}")
                    for plant in plants[:3]:  # Show first 3
                        plant_type = plant.get('type', 'Unknown')
                        family = plant.get('family', 'Unknown')
                        season = plant.get('season', 'Unknown')
                        print(f"  - {plant_type} (Family: {family}, Season: {season})")
                else:
                    print("🌱 No plant descriptions available")
                    
        elif response.status_code == 403:
            print(f"❌ Pollen API Error: 403 Forbidden")
            print("🔑 This likely means the Google Pollen API is not enabled for this API key")
            print("💡 To fix: Go to Google Cloud Console → Enable Google Pollen API")
            print(f"📄 Response: {response.text}")
            
        else:
            print(f"❌ Pollen API Error: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Pollen API Exception: {e}")

def test_api_key_permissions():
    """Test basic API key functionality"""
    print("\n🔑 Testing API Key Permissions...")
    
    # Test with a simple Maps API call
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": "New York City",
            "key": API_KEY
        }
        
        response = requests.get(url, params=params)
        print(f"📈 Basic API test status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API key is valid and working")
        else:
            print(f"❌ API key issue: {response.text}")
            
    except Exception as e:
        print(f"❌ API key test exception: {e}")

def main():
    print("🧪 Google APIs Direct Test")
    print("=" * 50)
    
    test_api_key_permissions()
    test_geocoding_api() 
    test_pollen_api()
    
    print("\n🎯 Summary:")
    print("If Geocoding works but Pollen API returns 403:")
    print("1. Enable Google Pollen API in Google Cloud Console")
    print("2. Make sure billing is enabled")
    print("3. Check API restrictions if any")

if __name__ == "__main__":
    main()
