#!/usr/bin/env python3
"""
Debug script to investigate Firestore data structure and content.
"""
import os
import sys
from datetime import datetime, timedelta
import json

# Add the backend directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.firebase_config import get_firestore_client

def debug_firestore_data():
    """Debug Firestore data to understand structure and content."""
    print("=== FIRESTORE DATA DEBUG ===")
    
    # Initialize Firestore client
    db = get_firestore_client()
    
    # Check children collection
    print("\n1. Children Collection:")
    children_ref = db.collection('children')
    children = children_ref.get()
    
    if not children:
        print("  No children found!")
        return
    
    for child_doc in children:
        child_data = child_doc.to_dict()
        print(f"  Child ID: {child_doc.id}")
        print(f"  Child Data: {json.dumps(child_data, indent=4, default=str)}")
        
        # Check symptom_logs subcollection for this child
        print(f"\n  Symptom Logs for {child_doc.id}:")
        logs_ref = children_ref.document(child_doc.id).collection('symptom_logs')
        logs = logs_ref.get()
        
        if not logs:
            print("    No symptom logs found!")
        else:
            print(f"    Found {len(logs)} logs:")
            for log_doc in logs:
                log_data = log_doc.to_dict()
                print(f"    Log ID: {log_doc.id}")
                print(f"    Log Data: {json.dumps(log_data, indent=6, default=str)}")
        
        print("\n" + "="*50)

if __name__ == "__main__":
    debug_firestore_data()
