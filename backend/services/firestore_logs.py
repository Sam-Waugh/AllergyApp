"""
Firestore service for daily logs management - replacing SQLAlchemy DailyLog operations.
"""

import logging
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
from google.cloud import firestore
import json

from config.firebase_config import get_firestore_client

logger = logging.getLogger(__name__)

class FirestoreLogsService:
    """Daily logs management using Firestore instead of SQLAlchemy."""
    
    def __init__(self):
        self.db = get_firestore_client()
        self.logs_collection = 'daily_logs'
    
    def create_daily_log(self, log_data: dict) -> dict:
        """Create a new daily log in Firestore."""
        try:
            # Create log document ID
            log_id = f"log_{int(datetime.now(timezone.utc).timestamp())}"
            
            # Prepare log data
            log_doc = {
                'id': log_id,
                'child_id': log_data.get('child_id'),
                'date': log_data.get('date'),
                'eczema_severity': log_data.get('eczema_severity', 'none'),
                'asthma_severity': log_data.get('asthma_severity', 'none'),
                'allergic_reaction_severity': log_data.get('allergic_reaction_severity', 'none'),
                'overall_mood': log_data.get('overall_mood', 'good'),
                'foods_consumed': log_data.get('foods_consumed', []),
                'activities': log_data.get('activities', []),
                'medications_taken': log_data.get('medications_taken', []),
                'sleep_quality': log_data.get('sleep_quality', 'good'),
                'stress_level': log_data.get('stress_level', 'low'),
                'weather_conditions': log_data.get('weather_conditions'),
                'temperature': log_data.get('temperature'),
                'humidity': log_data.get('humidity'),
                'air_quality_index': log_data.get('air_quality_index'),
                'pollen_count': log_data.get('pollen_count'),
                'symptoms_notes': log_data.get('symptoms_notes'),
                'trigger_notes': log_data.get('trigger_notes'),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
            
            # Store in Firestore
            self.db.collection(self.logs_collection).document(log_id).set(log_doc)
            
            logger.info(f"Created daily log {log_id} for child {log_data.get('child_id')}")
            return log_doc
            
        except Exception as e:
            logger.error(f"Failed to create daily log for child {log_data.get('child_id')}: {str(e)}")
            raise
    
    def get_logs_by_child(self, child_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get daily logs for a child."""
        try:
            logs_ref = self.db.collection(self.logs_collection)
            query = logs_ref.where('child_id', '==', child_id).order_by('date', direction=firestore.Query.DESCENDING)
            
            # Apply pagination
            if skip > 0:
                query = query.offset(skip)
            if limit > 0:
                query = query.limit(limit)
            
            docs = query.stream()
            
            logs = []
            for doc in docs:
                log_data = doc.to_dict()
                logs.append(log_data)
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to get logs for child {child_id}: {str(e)}")
            return []
    
    def get_log_by_id(self, log_id: str) -> Optional[dict]:
        """Get daily log by ID."""
        try:
            doc_ref = self.db.collection(self.logs_collection).document(log_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get log {log_id}: {str(e)}")
            return None
    
    def update_daily_log(self, log_id: str, update_data: dict) -> Optional[dict]:
        """Update daily log."""
        try:
            # Verify log exists
            existing_log = self.get_log_by_id(log_id)
            if not existing_log:
                return None
            
            # Prepare update data
            update_data['updated_at'] = datetime.now(timezone.utc)
            
            # Convert lists to proper format if needed
            if 'foods_consumed' in update_data and isinstance(update_data['foods_consumed'], list):
                pass  # Keep as list in Firestore
            if 'activities' in update_data and isinstance(update_data['activities'], list):
                pass  # Keep as list in Firestore
            if 'medications_taken' in update_data and isinstance(update_data['medications_taken'], list):
                pass  # Keep as list in Firestore
            
            # Update document
            doc_ref = self.db.collection(self.logs_collection).document(log_id)
            doc_ref.update(update_data)
            
            # Return updated log
            return self.get_log_by_id(log_id)
            
        except Exception as e:
            logger.error(f"Failed to update log {log_id}: {str(e)}")
            return None
    
    def delete_daily_log(self, log_id: str) -> bool:
        """Delete daily log."""
        try:
            # Verify log exists
            existing_log = self.get_log_by_id(log_id)
            if not existing_log:
                return False
            
            # Delete document
            doc_ref = self.db.collection(self.logs_collection).document(log_id)
            doc_ref.delete()
            
            logger.info(f"Deleted daily log {log_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete log {log_id}: {str(e)}")
            return False
    
    def get_logs_by_date_range(self, child_id: str, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get logs for a child within a date range."""
        try:
            logs_ref = self.db.collection(self.logs_collection)
            query = (logs_ref
                    .where('child_id', '==', child_id)
                    .where('date', '>=', start_date)
                    .where('date', '<=', end_date)
                    .order_by('date', direction=firestore.Query.DESCENDING))
            
            docs = query.stream()
            
            logs = []
            for doc in docs:
                log_data = doc.to_dict()
                logs.append(log_data)
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to get logs for child {child_id} in date range: {str(e)}")
            return []
    
    def get_latest_log_for_child(self, child_id: str) -> Optional[dict]:
        """Get the most recent log for a child."""
        try:
            logs_ref = self.db.collection(self.logs_collection)
            query = (logs_ref
                    .where('child_id', '==', child_id)
                    .order_by('date', direction=firestore.Query.DESCENDING)
                    .limit(1))
            
            docs = query.stream()
            
            for doc in docs:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get latest log for child {child_id}: {str(e)}")
            return None
