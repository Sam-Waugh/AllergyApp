"""
Simplified Firestore logs service for direct integration with existing API endpoints.
This service allows for drop-in replacement of SQLAlchemy log operations without changing API endpoints.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import json
from google.cloud import firestore

from config.firebase_config import get_firestore_client

logger = logging.getLogger(__name__)

class FirestoreLogService:
    """Firestore service for symptom logs that mimics SQLAlchemy interfaces for easier integration"""
    
    def __init__(self):
        self.db = get_firestore_client()
        self.logs_collection = 'daily_logs'
    
    def get_daily_logs(self, child_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get logs for a child with SQLAlchemy-compatible interface"""
        try:
            # Convert to Firestore ID format
            firestore_child_id = f"child_{child_id}"
            
            # Simplified query - only filter by child_id
            # Apply skip/limit in memory to avoid index requirements
            logs_ref = self.db.collection(self.logs_collection)
            query = logs_ref.where('child_id', '==', firestore_child_id)
            
            # Execute query
            docs = query.stream()
            
            # Convert to list and apply pagination in memory
            logs = []
            for doc in docs:
                logs.append(doc.to_dict())
            
            # Sort by date (descending) in memory
            logs.sort(key=lambda x: x.get('date', datetime.min), reverse=True)
            
            # Apply pagination in memory
            paginated_logs = logs[skip:skip+limit] if skip < len(logs) else []
            
            logger.info(f"Retrieved {len(paginated_logs)} logs for child {child_id}")
            return paginated_logs
            
        except Exception as e:
            logger.error(f"Failed to get logs for child {child_id}: {str(e)}")
            return []
    
    def get_daily_log(self, log_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific log by ID with SQLAlchemy-compatible interface"""
        try:
            # Convert to Firestore ID format
            firestore_log_id = f"log_{log_id}"
            
            # Get document
            doc_ref = self.db.collection(self.logs_collection).document(firestore_log_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get log {log_id}: {str(e)}")
            return None
    
    def create_daily_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new log with SQLAlchemy-compatible interface"""
        try:
            # Extract child_id and convert to Firestore format
            child_id = log_data.get('child_id')
            firestore_child_id = f"child_{child_id}"
            
            # Create log document ID
            timestamp = int(datetime.now(timezone.utc).timestamp())
            log_id = f"log_{timestamp}"
            
            # Prepare log data
            log_doc = {
                'id': log_id,
                'child_id': firestore_child_id,
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
            
            # Handle any JSON strings that need to be parsed
            for field in ['foods_consumed', 'activities', 'medications_taken']:
                if isinstance(log_doc.get(field), str):
                    try:
                        log_doc[field] = json.loads(log_doc[field])
                    except:
                        log_doc[field] = []
            
            # Store in Firestore
            self.db.collection(self.logs_collection).document(log_id).set(log_doc)
            
            # For compatibility with SQLAlchemy, we need to return a dict with an 'id' attribute
            # that can be accessed like an object property
            class DictWithAttr(dict):
                def __getattr__(self, attr):
                    return self.get(attr)
                    
            return DictWithAttr(log_doc)
            
        except Exception as e:
            logger.error(f"Failed to create daily log: {str(e)}")
            raise
    
    def update_daily_log(self, log_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a log with SQLAlchemy-compatible interface"""
        try:
            # Convert to Firestore ID format
            firestore_log_id = f"log_{log_id}"
            
            # Get existing log
            doc_ref = self.db.collection(self.logs_collection).document(firestore_log_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.warning(f"Log {log_id} not found for update")
                return None
            
            # Prepare update data
            update_dict = {}
            for key, value in update_data.items():
                if value is not None:
                    update_dict[key] = value
            
            # Handle any JSON strings that need to be parsed
            for field in ['foods_consumed', 'activities', 'medications_taken']:
                if isinstance(update_dict.get(field), str):
                    try:
                        update_dict[field] = json.loads(update_dict[field])
                    except:
                        if field in update_dict:
                            update_dict[field] = []
            
            # Add updated_at timestamp
            update_dict['updated_at'] = datetime.now(timezone.utc)
            
            # Update document
            doc_ref.update(update_dict)
            
            # Get updated document
            updated_doc = doc_ref.get().to_dict()
            
            # For compatibility with SQLAlchemy, we need to return a dict with an 'id' attribute
            # that can be accessed like an object property
            class DictWithAttr(dict):
                def __getattr__(self, attr):
                    return self.get(attr)
                    
            return DictWithAttr(updated_doc)
            
        except Exception as e:
            logger.error(f"Failed to update log {log_id}: {str(e)}")
            return None
    
    def delete_daily_log(self, log_id: int) -> bool:
        """Delete a log with SQLAlchemy-compatible interface"""
        try:
            # Convert to Firestore ID format
            firestore_log_id = f"log_{log_id}"
            
            # Delete document
            doc_ref = self.db.collection(self.logs_collection).document(firestore_log_id)
            doc_ref.delete()
            
            logger.info(f"Deleted log {log_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete log {log_id}: {str(e)}")
            return False
    
    def get_logs_by_date_range(self, child_id: int, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get logs within a date range with SQLAlchemy-compatible interface"""
        try:
            # Convert to Firestore ID format
            firestore_child_id = f"child_{child_id}"
            
            # First get all logs for the child (simplified query)
            logs_ref = self.db.collection(self.logs_collection)
            query = logs_ref.where('child_id', '==', firestore_child_id)
            
            docs = query.stream()
            
            # Filter by date range in memory
            logs = []
            for doc in docs:
                log_data = doc.to_dict()
                log_date = log_data.get('date')
                
                # Only include logs within the date range
                if log_date and start_date <= log_date <= end_date:
                    logs.append(log_data)
            
            # Sort by date (descending) in memory
            logs.sort(key=lambda x: x.get('date', datetime.min), reverse=True)
            
            logger.info(f"Retrieved {len(logs)} logs for child {child_id} in date range")
            return logs
            
        except Exception as e:
            logger.error(f"Failed to get logs for child {child_id} in date range: {str(e)}")
            return []
