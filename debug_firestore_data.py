"""
Debug script to check what's actually in Firestore for the child
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

def debug_firestore_data():
    """Check what data exists in Firestore for our child."""
    db = get_firestore_client()
    child_id = "child_1751823814217_1wjfre4n6"
    
    print(f"🔍 Debugging Firestore data for child_id: {child_id}")
    print("=" * 60)
    
    # Check child document
    print("1. CHILD DOCUMENT:")
    child_ref = db.collection('children').document(child_id)
    child_doc = child_ref.get()
    
    if child_doc.exists:
        child_data = child_doc.to_dict() or {}
        print(f"   ✅ Found child: {child_data.get('first_name', 'No first name')} {child_data.get('last_name', 'No last name')}")
        print(f"   📧 Parent ID: {child_data.get('parent_user_id', child_data.get('parentId', 'No parent ID'))}")
        print(f"   📅 DOB: {child_data.get('date_of_birth', child_data.get('dateOfBirth', 'No DOB'))}")
        print(f"   🩺 Known allergies: {child_data.get('known_allergies', 'None listed')}")
        print(f"   🔍 Raw data keys: {list(child_data.keys()) if child_data else 'No data'}")
        
        # Print all child data for debugging
        print("\n   📊 FULL CHILD DATA:")
        for key, value in child_data.items():
            if len(str(value)) < 100:  # Only show shorter values
                print(f"      {key}: {value}")
            else:
                print(f"      {key}: <long value - {len(str(value))} chars>")
    else:
        print("   ❌ Child document not found!")
        return
    
    print("\n2. DAILY LOGS QUERY:")
    
    # Try different query approaches
    print("   Approach 1: Direct query by childId")
    logs_ref1 = db.collection('dailyLogs').where('childId', '==', child_id)
    logs1 = logs_ref1.get()
    print(f"   Found {len(logs1)} logs with exact childId match")
    
    print("\n   Approach 2: Query by childId as string")
    logs_ref2 = db.collection('dailyLogs').where('childId', '==', str(child_id))
    logs2 = logs_ref2.get()
    print(f"   Found {len(logs2)} logs with string childId")
    
    print("\n   Approach 3: Get all dailyLogs and filter manually")
    all_logs_ref = db.collection('dailyLogs').limit(10)
    all_logs = all_logs_ref.get()
    print(f"   Total logs in collection: {len(all_logs)}")
    
    matching_logs = []
    for doc in all_logs:
        log_data = doc.to_dict()
        if log_data and log_data.get('childId') == child_id:
            matching_logs.append(doc)
        print(f"   Log {doc.id}: childId = {log_data.get('childId') if log_data else 'No data'}")
    
    print(f"   Manually filtered matching logs: {len(matching_logs)}")
    
    if matching_logs:
        print("\n3. SAMPLE LOG DATA:")
        sample_log = matching_logs[0].to_dict()
        for key, value in sample_log.items():
            print(f"   {key}: {value}")
    
    print("\n4. PARENT DOCUMENT:")
    parent_id = child_data.get('parent_user_id', child_data.get('parentId', 'parent_elsie_king'))
    print(f"   Looking for parent ID: {parent_id}")
    parent_ref = db.collection('parents').document(parent_id)
    parent_doc = parent_ref.get()
    
    if parent_doc.exists:
        parent_data = parent_doc.to_dict() or {}
        print(f"   ✅ Found parent: {parent_data.get('fullName', 'No name')}")
        print(f"   📧 Email: {parent_data.get('email', 'No email')}")
    else:
        print(f"   ❌ Parent document {parent_id} not found!")

if __name__ == "__main__":
    debug_firestore_data()
