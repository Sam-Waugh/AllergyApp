"""
Simple direct Firestore service for symptom logs.
This file provides a focused solution to the specific issue of symptom logs using SQLAlchemy instead of Firestore.
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import json

from google.cloud import firestore
from config.firebase_config import get_firestore_client

logger = logging.getLogger(__name__)

class SymptomLogService:
    """Simple direct Firestore service for symptom logs"""
    
    def __init__(self):
        """Initialize the Firestore client"""
        self.db = get_firestore_client()
        self.collection = 'symptom_logs'
    
    def add_log(self, child_id: str, log_data: Dict[str, Any]) -> str:
        """Add a new symptom log to Firestore"""
        try:
            # Generate a unique ID for the log
            timestamp = int(datetime.now().timestamp())
            log_id = f"log_{timestamp}"
            
            # Prepare log document
            doc_data = {
                'id': log_id,
                'child_id': child_id,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                **log_data  # Include all provided log data
            }
            
            # Add to Firestore
            self.db.collection(self.collection).document(log_id).set(doc_data)
            
            logger.info(f"Created symptom log {log_id} for child {child_id}")
            return log_id
            
        except Exception as e:
            logger.error(f"Failed to create symptom log: {str(e)}")
            raise
    
    def get_logs(self, child_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get symptom logs for a child from Firestore"""
        try:
            # Query logs for the child
            query = (self.db.collection(self.collection)
                    .where('child_id', '==', child_id)
                    .order_by('created_at', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            # Execute query
            logs = []
            for doc in query.stream():
                logs.append(doc.to_dict())
            
            logger.info(f"Retrieved {len(logs)} symptom logs for child {child_id}")
            return logs
            
        except Exception as e:
            logger.error(f"Failed to get symptom logs for child {child_id}: {str(e)}")
            # Return empty list instead of raising an exception to avoid breaking the app
            return []
    
    def get_log(self, log_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific symptom log by ID"""
        try:
            doc = self.db.collection(self.collection).document(log_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Failed to get symptom log {log_id}: {str(e)}")
            return None
    
    def update_log(self, log_id: str, update_data: Dict[str, Any]) -> bool:
        """Update an existing symptom log"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.now()
            
            # Update document
            self.db.collection(self.collection).document(log_id).update(update_data)
            
            logger.info(f"Updated symptom log {log_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update symptom log {log_id}: {str(e)}")
            return False
    
    def delete_log(self, log_id: str) -> bool:
        """Delete a symptom log"""
        try:
            self.db.collection(self.collection).document(log_id).delete()
            logger.info(f"Deleted symptom log {log_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete symptom log {log_id}: {str(e)}")
            return False
