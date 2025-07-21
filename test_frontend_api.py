"""
Test script to simulate the exact frontend API call
"""
import requests
import json
from datetime import datetime, timedelta

def test_frontend_like_api_call():
    """Test API call similar to what frontend sends."""
    
    # API endpoint (same as frontend)
    url = "http://localhost:8090/api/v1/reports/generate-firestore"
    
    # Simulate frontend date calculation
    end_date = datetime.now()
    start_date = datetime.now() - timedelta(days=90)  # 3 months ago
    
    # Frontend payload format
    payload = {
        "child_id": "child_1751823814217_1wjfre4n6",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "include_photos": False,
        "report_type": "comprehensive"
    }
    
    print(f"🔍 Testing Frontend-like API Call")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("=" * 60)
    
    try:
        # Make the request
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            report_data = response.json()
            
            print("✅ SUCCESS! Report generated:")
            print(f"   Success: {report_data.get('success', 'Unknown')}")
            print(f"   Has Report: {'Yes' if report_data.get('report_text') else 'No'}")
            print(f"   Error: {report_data.get('error_message', 'None')}")
            
        else:
            print(f"❌ ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Error text: {response.text}")
    
    except Exception as e:
        print(f"❌ REQUEST ERROR: {e}")

if __name__ == "__main__":
    test_frontend_like_api_call()
