"""
Firestore service for user management - replacing SQLAlchemy User operations.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List
from google.cloud import firestore
from google.api_core.exceptions import NotFound, AlreadyExists
import hashlib

from config.firebase_config import get_firestore_client

logger = logging.getLogger(__name__)

class FirestoreUserService:
    """User management using Firestore instead of SQLAlchemy."""
    
    def __init__(self):
        self.db = get_firestore_client()
        self.users_collection = 'users'
    
    def create_user(self, email: str, hashed_password: str, full_name: str) -> dict:
        """Create a new user in Firestore."""
        try:
            # Check if user already exists
            existing_user = self.get_user_by_email(email)
            if existing_user:
                raise ValueError(f"User with email {email} already exists")
            
            # Create user document
            user_id = f"user_{int(datetime.now(timezone.utc).timestamp())}"
            user_data = {
                'id': user_id,
                'email': email,
                'hashed_password': hashed_password,
                'full_name': full_name,
                'is_active': True,
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
            
            # Store in Firestore
            self.db.collection(self.users_collection).document(user_id).set(user_data)
            
            logger.info(f"Created user {user_id} with email {email}")
            return user_data
            
        except Exception as e:
            logger.error(f"Failed to create user {email}: {str(e)}")
            raise
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email."""
        try:
            users_ref = self.db.collection(self.users_collection)
            query = users_ref.where('email', '==', email).limit(1)
            docs = query.stream()
            
            for doc in docs:
                user_data = doc.to_dict()
                return user_data
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user by email {email}: {str(e)}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID."""
        try:
            doc_ref = self.db.collection(self.users_collection).document(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get user by ID {user_id}: {str(e)}")
            return None
    
    def update_user(self, user_id: str, update_data: dict) -> Optional[dict]:
        """Update user data."""
        try:
            doc_ref = self.db.collection(self.users_collection).document(user_id)
            
            # Add updated_at timestamp
            update_data['updated_at'] = datetime.now(timezone.utc)
            
            # Update document
            doc_ref.update(update_data)
            
            # Return updated user
            return self.get_user_by_id(user_id)
            
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {str(e)}")
            return None
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user (mark as inactive)."""
        try:
            update_data = {
                'is_active': False,
                'updated_at': datetime.now(timezone.utc)
            }
            
            return self.update_user(user_id, update_data) is not None
            
        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {str(e)}")
            return False
    
    def authenticate_user(self, email: str, password_hash: str) -> Optional[dict]:
        """Authenticate user by email and password hash."""
        try:
            user = self.get_user_by_email(email)
            if user and user.get('is_active', False) and user.get('hashed_password') == password_hash:
                return user
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to authenticate user {email}: {str(e)}")
            return None
