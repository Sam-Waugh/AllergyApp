"""
Test script to call the AI report generation API directly
"""
import requests
import json
from datetime import datetime, timedelta

def test_ai_report_generation():
    """Test the AI report generation API endpoint."""
    
    # API endpoint
    url = "http://localhost:8090/api/v1/reports/generate-firestore"
    
    # Test data - using the child ID we know exists
    payload = {
        "child_id": "child_1751823814217_1wjfre4n6",
        "days_back": 30,
        "include_ai_insights": False,  # Disable AI to isolate the error
        "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
        "end_date": datetime.now().isoformat()
    }
    
    print(f"🔍 Testing AI Report Generation API")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("=" * 60)
    
    try:
        # Make the request
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            report_data = response.json()
            
            print("\n✅ SUCCESS! Report generated:")
            print(f"   Child: {report_data.get('child_name', 'Unknown')}")
            print(f"   Period: {report_data.get('report_period', 'Unknown')}")
            print(f"   Logs analyzed: {report_data.get('logs_analyzed', 0)}")
            print(f"   AI insights: {'Yes' if report_data.get('ai_insights') else 'No'}")
            
            # Check for formatted report
            formatted_report = report_data.get('formatted_report')
            if formatted_report:
                print(f"\n📄 FORMATTED REPORT (first 500 chars):")
                print(formatted_report[:500])
                if len(formatted_report) > 500:
                    print("...")
            
            # Save full report to file
            with open('test_report_output.json', 'w') as f:
                json.dump(report_data, f, indent=2, default=str)
            print(f"\n💾 Full report saved to: test_report_output.json")
            
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Error text: {response.text}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    test_ai_report_generation()
