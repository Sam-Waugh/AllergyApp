"""
Test script to replicate successful Firestore log retrieval
"""
import sys
import os
from dotenv import load_dotenv

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)

# Load environment variables from backend/.env
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

from config.firebase_config import get_firestore_client

def test_minimal_log_processing():
    """Test minimal log processing to isolate the error."""
    db = get_firestore_client()
    child_id = "child_1751823814217_1wjfre4n6"
    
    print("=== MINIMAL FIRESTORE LOG TEST ===")
    
    # Get just 3 logs to minimize processing
    logs_ref = db.collection('dailyLogs').where('childId', '==', child_id).limit(3)
    logs = logs_ref.get()
    
    print(f"Found {len(logs)} logs")
    
    # Process each log step by step
    for i, doc in enumerate(logs):
        print(f"\n--- Processing Log {i+1}: {doc.id} ---")
        
        try:
            log_data = doc.to_dict() or {}
            print(f"✅ Got dict data: {len(log_data)} fields")
            
            # Test each field that might cause issues
            problem_fields = []
            
            # Check mood_scale
            mood_scale = log_data.get('moodScale', 5)
            print(f"   moodScale: {mood_scale} (type: {type(mood_scale)})")
            if not isinstance(mood_scale, (int, float, str)):
                problem_fields.append(f"moodScale is {type(mood_scale)}")
            
            # Check symptomSeverity
            symptom_severity = log_data.get('symptomSeverity', {})
            print(f"   symptomSeverity: {type(symptom_severity)} - {symptom_severity}")
            if not isinstance(symptom_severity, dict):
                problem_fields.append(f"symptomSeverity is {type(symptom_severity)}")
            
            # Check lists
            symptoms = log_data.get('symptoms', [])
            triggers = log_data.get('triggers', [])
            print(f"   symptoms: {type(symptoms)} - {symptoms}")
            print(f"   triggers: {type(triggers)} - {triggers}")
            
            if problem_fields:
                print(f"   ⚠️ POTENTIAL ISSUES: {problem_fields}")
            else:
                print("   ✅ All fields look good")
                
        except Exception as e:
            print(f"   ❌ ERROR processing log: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n=== MOCK CLASS CREATION TEST ===")
    
    # Test creating mock objects with the actual data
    try:
        logs = logs_ref.get()
        if logs:
            test_log_data = logs[0].to_dict() or {}
            
            print("Testing MockDailyLog creation...")
            
            class TestMockDailyLog:
                def __init__(self, data):
                    print(f"  Creating mock with data keys: {list(data.keys())}")
                    
                    self.id = data.get('id', 'unknown')
                    self.child_id = data.get('childId')
                    
                    # Test mood_scale processing
                    mood_scale_raw = data.get('moodScale', 5)
                    print(f"  Processing moodScale: {mood_scale_raw} ({type(mood_scale_raw)})")
                    
                    if isinstance(mood_scale_raw, (int, float)):
                        self.mood_scale = mood_scale_raw
                    elif isinstance(mood_scale_raw, str) and mood_scale_raw.isdigit():
                        self.mood_scale = int(mood_scale_raw)
                    else:
                        self.mood_scale = 5
                        print(f"  ⚠️ Used default mood_scale for: {mood_scale_raw}")
                    
                    print(f"  Final mood_scale: {self.mood_scale} ({type(self.mood_scale)})")
                    
                    # Test other fields
                    self.symptoms = data.get('symptoms', [])
                    self.symptom_severity = data.get('symptomSeverity', {})
                    if not isinstance(self.symptom_severity, dict):
                        self.symptom_severity = {}
                    self.triggers = data.get('triggers', [])
                    
                    print(f"  ✅ Mock object created successfully")
            
            test_mock = TestMockDailyLog(test_log_data)
            print(f"Mock object attributes: mood_scale={test_mock.mood_scale}")
            
    except Exception as e:
        print(f"❌ ERROR creating mock: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_minimal_log_processing()
