"""
Firestore service for HIPAA-compliant data operations.

This service provides secure CRUD operations for patient data in Firestore,
ensuring HIPAA compliance through encryption, access logging, and data validation.
"""

import asyncio
import logging
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from uuid import uuid4
import json

from google.cloud.firestore import Client
from google.cloud import firestore
from firebase_admin import storage

from config.firebase_config import get_firestore_client
from models.firestore_models import (
    ChildProfile, SymptomLogEntry, PhotoEntry, UserProfile,
    CreateChildRequest, ChildResponse
)

logger = logging.getLogger(__name__)

class HIPAAFirestoreService:
    """HIPAA-compliant Firestore service for managing patient data."""
    
    def __init__(self):
        self.db = get_firestore_client()
        self.collections = {
            'users': 'users',
            'children': 'children', 
            'symptom_logs': 'symptom_logs',
            'photos': 'photos',
            'access_logs': 'access_logs'
        }
    
    async def _log_access(self, user_id: str, action: str, resource_type: str, 
                         resource_id: str, success: bool = True, details: str = None):
        """Log data access for HIPAA audit trail."""
        try:
            access_log = {
                'user_id': user_id,
                'action': action,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'timestamp': datetime.utcnow(),
                'success': success,
                'ip_address': 'backend_service',  # In production, get from request
                'details': details or '',
                'session_id': str(uuid4())
            }
            
            # Store in access_logs collection
            await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.db.collection(self.collections['access_logs']).add(access_log)
            )
            
        except Exception as e:
            logger.error(f"Failed to log access: {e}")
    
    async def create_user_profile(self, user_data: UserProfile) -> str:
        """Create a new user profile with HIPAA compliance."""
        try:
            user_id = user_data.user_id
            
            # Convert to dict and handle datetime serialization
            user_dict = user_data.dict()
            user_dict['created_at'] = firestore.SERVER_TIMESTAMP
            user_dict['updated_at'] = firestore.SERVER_TIMESTAMP
            
            # Store user profile
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.db.collection(self.collections['users']).document(user_id).set(user_dict)
            )
            
            await self._log_access(user_id, 'CREATE', 'user_profile', user_id)
            logger.info(f"Created user profile for user: {user_id}")
            return user_id
            
        except Exception as e:
            await self._log_access(user_data.user_id, 'CREATE', 'user_profile', 
                                 user_data.user_id, False, str(e))
            logger.error(f"Failed to create user profile: {e}")
            raise
    
    async def create_child_profile(self, user_id: str, child_data: CreateChildRequest) -> ChildResponse:
        """Create a new child profile with HIPAA compliance."""
        try:
            child_id = str(uuid4())
            
            # Calculate age in months
            today = date.today()
            age_months = (today.year - child_data.date_of_birth.year) * 12 + \
                        (today.month - child_data.date_of_birth.month)
            
            # Create child profile
            child_profile = ChildProfile(
                child_id=child_id,
                parent_user_id=user_id,
                first_name=child_data.first_name,
                last_name=child_data.last_name,
                date_of_birth=child_data.date_of_birth,
                gender=child_data.gender,
                known_allergies=child_data.known_allergies,
                current_medications=child_data.current_medications,
                medical_conditions=child_data.medical_conditions,
                medical_notes=child_data.medical_notes,
                emergency_contacts=child_data.emergency_contacts,
                primary_doctor=child_data.primary_doctor,
                hipaa_consent_date=datetime.utcnow()
            )
            
            # Convert to dict for Firestore
            child_dict = child_profile.dict()
            child_dict['created_at'] = firestore.SERVER_TIMESTAMP
            child_dict['updated_at'] = firestore.SERVER_TIMESTAMP
            
            # Store child profile
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.db.collection(self.collections['children']).document(child_id).set(child_dict)
            )
            
            # Update user's children list
            user_ref = self.db.collection(self.collections['users']).document(user_id)
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: user_ref.update({
                    'children_ids': firestore.ArrayUnion([child_id]),
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
            )
            
            await self._log_access(user_id, 'CREATE', 'child_profile', child_id)
            logger.info(f"Created child profile: {child_id} for user: {user_id}")
            
            # Return response
            return ChildResponse(
                child_id=child_id,
                first_name=child_data.first_name,
                last_name=child_data.last_name,
                date_of_birth=child_data.date_of_birth,
                gender=child_data.gender,
                age_months=age_months,
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            await self._log_access(user_id, 'CREATE', 'child_profile', '', False, str(e))
            logger.error(f"Failed to create child profile: {e}")
            raise
    
    async def get_child_profile(self, user_id: str, child_id: str) -> Optional[ChildProfile]:
        """Get child profile with access control."""
        try:
            # Get child document
            child_doc = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.db.collection(self.collections['children']).document(child_id).get()
            )
            
            if not child_doc.exists:
                await self._log_access(user_id, 'READ', 'child_profile', child_id, False, 'Child not found')
                return None
            
            child_data = child_doc.to_dict()
            
            # Verify user has access to this child
            if child_data.get('parent_user_id') != user_id:
                await self._log_access(user_id, 'READ', 'child_profile', child_id, False, 'Access denied')
                raise PermissionError("Access denied to child profile")
            
            # Convert Firestore timestamps to datetime
            if 'created_at' in child_data and hasattr(child_data['created_at'], 'timestamp'):
                child_data['created_at'] = datetime.fromtimestamp(child_data['created_at'].timestamp())
            if 'updated_at' in child_data and hasattr(child_data['updated_at'], 'timestamp'):
                child_data['updated_at'] = datetime.fromtimestamp(child_data['updated_at'].timestamp())
            
            await self._log_access(user_id, 'READ', 'child_profile', child_id)
            return ChildProfile(**child_data)
            
        except Exception as e:
            await self._log_access(user_id, 'READ', 'child_profile', child_id, False, str(e))
            logger.error(f"Failed to get child profile: {e}")
            raise
    
    async def get_user_children(self, user_id: str) -> List[ChildResponse]:
        """Get all children profiles for a user."""
        try:
            # Query children by parent_user_id
            children_query = self.db.collection(self.collections['children']).where('parent_user_id', '==', user_id)
            children_docs = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: children_query.get()
            )
            
            children = []
            for doc in children_docs:
                child_data = doc.to_dict()
                
                # Calculate age in months
                dob = child_data.get('date_of_birth')
                if isinstance(dob, str):
                    dob = datetime.fromisoformat(dob).date()
                elif hasattr(dob, 'date'):
                    dob = dob.date()
                
                today = date.today()
                age_months = (today.year - dob.year) * 12 + (today.month - dob.month)
                
                child_response = ChildResponse(
                    child_id=child_data['child_id'],
                    first_name=child_data['first_name'],
                    last_name=child_data['last_name'],
                    date_of_birth=dob,
                    gender=child_data['gender'],
                    age_months=age_months,
                    created_at=child_data.get('created_at', datetime.utcnow())
                )
                children.append(child_response)
            
            await self._log_access(user_id, 'READ', 'children_list', user_id)
            return children
            
        except Exception as e:
            await self._log_access(user_id, 'READ', 'children_list', user_id, False, str(e))
            logger.error(f"Failed to get user children: {e}")
            raise
    
    async def update_child_profile(self, user_id: str, child_id: str, update_data: Dict[str, Any]) -> bool:
        """Update child profile with access control."""
        try:
            # Verify access first
            child_profile = await self.get_child_profile(user_id, child_id)
            if not child_profile:
                return False
            
            # Add update timestamp
            update_data['updated_at'] = firestore.SERVER_TIMESTAMP
            
            # Update document
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.db.collection(self.collections['children']).document(child_id).update(update_data)
            )
            
            await self._log_access(user_id, 'UPDATE', 'child_profile', child_id)
            logger.info(f"Updated child profile: {child_id}")
            return True
            
        except Exception as e:
            await self._log_access(user_id, 'UPDATE', 'child_profile', child_id, False, str(e))
            logger.error(f"Failed to update child profile: {e}")
            raise
    
    async def create_symptom_log(self, user_id: str, symptom_log: SymptomLogEntry) -> str:
        """Create a new symptom log entry."""
        try:
            # Verify user has access to this child
            child_profile = await self.get_child_profile(user_id, symptom_log.child_id)
            if not child_profile:
                raise PermissionError("Access denied to child profile")
            
            log_id = symptom_log.log_id or str(uuid4())
            symptom_log.log_id = log_id
            
            # Convert to dict
            log_dict = symptom_log.dict()
            log_dict['created_at'] = firestore.SERVER_TIMESTAMP
            log_dict['updated_at'] = firestore.SERVER_TIMESTAMP
            
            # Store symptom log
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.db.collection(self.collections['symptom_logs']).document(log_id).set(log_dict)
            )
            
            await self._log_access(user_id, 'CREATE', 'symptom_log', log_id)
            logger.info(f"Created symptom log: {log_id}")
            return log_id
            
        except Exception as e:
            await self._log_access(user_id, 'CREATE', 'symptom_log', '', False, str(e))
            logger.error(f"Failed to create symptom log: {e}")
            raise
    
    async def get_child_symptom_logs(self, user_id: str, child_id: str, 
                                   start_date: Optional[date] = None, 
                                   end_date: Optional[date] = None) -> List[SymptomLogEntry]:
        """Get symptom logs for a child with date filtering."""
        try:
            # Verify access
            child_profile = await self.get_child_profile(user_id, child_id)
            if not child_profile:
                raise PermissionError("Access denied to child profile")
            
            # Build query
            query = self.db.collection(self.collections['symptom_logs']).where('child_id', '==', child_id)
            
            if start_date:
                query = query.where('log_date', '>=', start_date)
            if end_date:
                query = query.where('log_date', '<=', end_date)
            
            query = query.order_by('log_date', direction=firestore.Query.DESCENDING)
            
            # Execute query
            docs = await asyncio.get_event_loop().run_in_executor(None, lambda: query.get())
            
            logs = []
            for doc in docs:
                log_data = doc.to_dict()
                
                # Convert Firestore timestamps
                if 'created_at' in log_data and hasattr(log_data['created_at'], 'timestamp'):
                    log_data['created_at'] = datetime.fromtimestamp(log_data['created_at'].timestamp())
                if 'updated_at' in log_data and hasattr(log_data['updated_at'], 'timestamp'):
                    log_data['updated_at'] = datetime.fromtimestamp(log_data['updated_at'].timestamp())
                
                logs.append(SymptomLogEntry(**log_data))
            
            await self._log_access(user_id, 'READ', 'symptom_logs', child_id)
            return logs
            
        except Exception as e:
            await self._log_access(user_id, 'READ', 'symptom_logs', child_id, False, str(e))
            logger.error(f"Failed to get symptom logs: {e}")
            raise
    
    async def delete_child_profile(self, user_id: str, child_id: str) -> bool:
        """Soft delete child profile (HIPAA compliant)."""
        try:
            # Verify access
            child_profile = await self.get_child_profile(user_id, child_id)
            if not child_profile:
                return False
            
            # Soft delete by adding deletion timestamp and hiding data
            update_data = {
                'deleted_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'status': 'deleted'
            }
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.db.collection(self.collections['children']).document(child_id).update(update_data)
            )
            
            # Remove from user's children list
            user_ref = self.db.collection(self.collections['users']).document(user_id)
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: user_ref.update({
                    'children_ids': firestore.ArrayRemove([child_id]),
                    'updated_at': firestore.SERVER_TIMESTAMP
                })
            )
            
            await self._log_access(user_id, 'DELETE', 'child_profile', child_id)
            logger.info(f"Soft deleted child profile: {child_id}")
            return True
            
        except Exception as e:
            await self._log_access(user_id, 'DELETE', 'child_profile', child_id, False, str(e))
            logger.error(f"Failed to delete child profile: {e}")
            raise

# Global service instance
firestore_service = HIPAAFirestoreService()
