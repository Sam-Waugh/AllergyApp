#!/usr/bin/env python3
"""
Test script to verify Firebase/Firestore integration with HIPAA compliance
"""

import asyncio
import httpx
import json
from datetime import datetime

# Test data for creating a child profile
test_child_data = {
    "first_name": "Test",
    "last_name": "Child",
    "date_of_birth": "2018-05-15",
    "gender": "other",
    "known_allergies": [
        {
            "allergen": "peanuts",
            "severity": "severe",
            "reaction_type": ["hives", "swelling"],
            "verified_by_doctor": True
        },
        {
            "allergen": "shellfish", 
            "severity": "moderate",
            "reaction_type": ["rash"],
            "verified_by_doctor": False
        }
    ],
    "current_medications": [
        {
            "name": "EpiPen",
            "dosage": "0.3mg",
            "frequency": "as needed",
            "prescribed_by": "Dr. Smith",
            "purpose": "Emergency allergy treatment",
            "active": True
        }
    ],
    "medical_conditions": ["food allergies", "environmental allergies"],
    "medical_notes": "Severe allergic reactions to nuts and shellfish",
    "emergency_contacts": [
        {
            "name": "Jane Doe",
            "relationship": "mother",
            "phone_primary": "+15551234567"
        }
    ],
    "primary_doctor": {
        "name": "Dr. Smith",
        "specialty": "Pediatric Allergist",
        "phone": "+15559876543",
        "email": "dr.smith@example.com"
    }
}

async def test_backend_api():
    """Test the backend API endpoints"""
    base_url = "http://localhost:8090"
    
    async with httpx.AsyncClient() as client:
        try:
            # Test health check
            print("🔍 Testing backend health...")
            response = await client.get(f"{base_url}/")
            print(f"Health check: {response.status_code} - {response.text}")
            
            # Test children endpoint using test endpoint
            print("\n📝 Testing add child endpoint...")
            response = await client.post(
                f"{base_url}/api/v1/children/test",
                json=test_child_data
            )
            print(f"Add child: {response.status_code}")
            
            if response.status_code == 200:
                child_data = response.json()
                print(f"✅ Child created successfully: {child_data['child_id']}")
                child_id = child_data['child_id']
                
                # Test get child
                print(f"\n🔍 Testing get child endpoint...")
                response = await client.get(f"{base_url}/api/v1/children/{child_id}")
                print(f"Get child: {response.status_code}")
                if response.status_code == 200:
                    print(f"✅ Child retrieved successfully")
                    print(f"Child data: {json.dumps(response.json(), indent=2)}")
                else:
                    print(f"❌ Failed to retrieve child: {response.text}")
                
                # Test list children using test endpoint
                print(f"\n📋 Testing list children endpoint...")
                response = await client.get(f"{base_url}/api/v1/children/test")
                print(f"List children: {response.status_code}")
                if response.status_code == 200:
                    children = response.json()
                    print(f"✅ Found {len(children)} children")
                else:
                    print(f"❌ Failed to list children: {response.text}")
                
                # Test symptom log
                symptom_data = {
                    "date": datetime.now().isoformat(),
                    "symptoms": {
                        "rash": 3,
                        "cough": 1,
                        "runny_nose": 2,
                        "itching": 4,
                        "wheezing": 0
                    },
                    "mood": 3,
                    "triggers": ["outdoor allergens", "food"],
                    "notes": "Test symptom log entry",
                    "location": "Home"
                }
                
                print(f"\n📊 Testing add symptom log endpoint...")
                response = await client.post(
                    f"{base_url}/api/v1/children/{child_id}/symptoms",
                    json=symptom_data
                )
                print(f"Add symptom log: {response.status_code}")
                if response.status_code == 200:
                    print(f"✅ Symptom log created successfully")
                    log_data = response.json()
                    print(f"Log ID: {log_data['id']}")
                else:
                    print(f"❌ Failed to create symptom log: {response.text}")
                
            else:
                print(f"❌ Failed to create child: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing backend: {e}")

def main():
    """Main test function"""
    print("🚀 Starting Firebase/Firestore Integration Test")
    print("=" * 50)
    
    try:
        asyncio.run(test_backend_api())
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed")

if __name__ == "__main__":
    main()
