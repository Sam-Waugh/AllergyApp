"""
Firestore service for child profile management - replacing SQLAlchemy Child operations.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from google.cloud import firestore
import json

from config.firebase_config import get_firestore_client

logger = logging.getLogger(__name__)

class FirestoreChildService:
    """Child profile management using Firestore instead of SQLAlchemy."""
    
    def __init__(self):
        self.db = get_firestore_client()
        self.children_collection = 'children'
    
    def create_child(self, child_data: dict, parent_id: str) -> dict:
        """Create a new child profile in Firestore."""
        try:
            # Create child document ID
            child_id = f"child_{int(datetime.now(timezone.utc).timestamp())}"
            
            # Prepare child data
            child_doc = {
                'id': child_id,
                'parent_id': parent_id,
                'name': child_data.get('name'),
                'date_of_birth': child_data.get('date_of_birth'),
                'gender': child_data.get('gender'),
                'known_allergies': child_data.get('known_allergies', []),
                'medications': child_data.get('medications', []),
                'medical_conditions': child_data.get('medical_conditions', []),
                'emergency_contact': child_data.get('emergency_contact'),
                'doctor_name': child_data.get('doctor_name'),
                'doctor_contact': child_data.get('doctor_contact'),
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
            
            # Store in Firestore
            self.db.collection(self.children_collection).document(child_id).set(child_doc)
            
            logger.info(f"Created child {child_id} for parent {parent_id}")
            return child_doc
            
        except Exception as e:
            logger.error(f"Failed to create child for parent {parent_id}: {str(e)}")
            raise
    
    def get_children_by_parent(self, parent_id: str) -> List[dict]:
        """Get all children for a parent."""
        try:
            children_ref = self.db.collection(self.children_collection)
            query = children_ref.where('parent_id', '==', parent_id)
            docs = query.stream()
            
            children = []
            for doc in docs:
                child_data = doc.to_dict()
                children.append(child_data)
            
            return children
            
        except Exception as e:
            logger.error(f"Failed to get children for parent {parent_id}: {str(e)}")
            return []
    
    def get_child_by_id(self, child_id: str, parent_id: str) -> Optional[dict]:
        """Get child by ID and verify parent ownership."""
        try:
            doc_ref = self.db.collection(self.children_collection).document(child_id)
            doc = doc_ref.get()
            
            if doc.exists:
                child_data = doc.to_dict()
                
                # Verify parent ownership
                if child_data.get('parent_id') == parent_id:
                    return child_data
                else:
                    logger.warning(f"Parent {parent_id} attempted to access child {child_id} belonging to {child_data.get('parent_id')}")
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get child {child_id} for parent {parent_id}: {str(e)}")
            return None
    
    def update_child(self, child_id: str, parent_id: str, update_data: dict) -> Optional[dict]:
        """Update child profile."""
        try:
            # First verify ownership
            existing_child = self.get_child_by_id(child_id, parent_id)
            if not existing_child:
                return None
            
            # Prepare update data
            update_data['updated_at'] = datetime.now(timezone.utc)
            
            # Update document
            doc_ref = self.db.collection(self.children_collection).document(child_id)
            doc_ref.update(update_data)
            
            # Return updated child
            return self.get_child_by_id(child_id, parent_id)
            
        except Exception as e:
            logger.error(f"Failed to update child {child_id} for parent {parent_id}: {str(e)}")
            return None
    
    def delete_child(self, child_id: str, parent_id: str) -> bool:
        """Delete child profile (actually delete from Firestore)."""
        try:
            # First verify ownership
            existing_child = self.get_child_by_id(child_id, parent_id)
            if not existing_child:
                return False
            
            # Delete document
            doc_ref = self.db.collection(self.children_collection).document(child_id)
            doc_ref.delete()
            
            logger.info(f"Deleted child {child_id} for parent {parent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete child {child_id} for parent {parent_id}: {str(e)}")
            return False
    
    def get_child_by_id_only(self, child_id: str) -> Optional[dict]:
        """Get child by ID without parent verification (for internal use)."""
        try:
            doc_ref = self.db.collection(self.children_collection).document(child_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get child {child_id}: {str(e)}")
            return None
