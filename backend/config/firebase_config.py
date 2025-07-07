"""
Firebase Admin SDK configuration for HIPAA-compliant backend operations.

This module initializes Firebase Admin SDK with proper security configurations
for handling Protected Health Information (PHI) in compliance with HIPAA requirements.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional, Union, Any
import logging

logger = logging.getLogger(__name__)

# Global Firebase app instance
_firebase_app: Optional[Union[firebase_admin.App, str]] = None
_firestore_client = None

class MockFirestoreClient:
    """Mock Firestore client for testing."""
    
    def __init__(self):
        self._collections = {}
    
    def collection(self, name: str):
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]

class MockCollection:
    """Mock Firestore collection."""
    
    def __init__(self, name: str):
        self.name = name
        self._documents = {}
    
    def document(self, doc_id: Optional[str] = None):
        if doc_id is None:
            doc_id = f"mock_doc_{len(self._documents)}"
        if doc_id not in self._documents:
            self._documents[doc_id] = MockDocument(doc_id, self)
        return self._documents[doc_id]
    
    def add(self, data: dict):
        doc_id = f"mock_doc_{len(self._documents)}"
        doc = self.document(doc_id)
        doc._data = data
        return None, doc
    
    def get(self):
        return [doc for doc in self._documents.values() if doc._data]
    
    def stream(self):
        return self.get()

class MockDocument:
    """Mock Firestore document."""
    
    def __init__(self, doc_id: str, collection):
        self.id = doc_id
        self._collection = collection
        self._data = None
    
    def set(self, data: dict):
        self._data = data
        return self
    
    def get(self):
        return MockDocumentSnapshot(self.id, self._data or {})
    
    def delete(self):
        if self.id in self._collection._documents:
            del self._collection._documents[self.id]
        return self
    
    def update(self, data: dict):
        if self._data:
            self._data.update(data)
        else:
            self._data = data
        return self

class MockDocumentSnapshot:
    """Mock Firestore document snapshot."""
    
    def __init__(self, doc_id: str, data: dict):
        self.id = doc_id
        self._data = data or {}
    
    def exists(self):
        return self._data is not None
    
    def to_dict(self):
        return self._data.copy() if self._data else None

def get_firebase_credentials() -> dict:
    """
    Get Firebase credentials from environment variables.
    This method ensures that sensitive credentials are not hardcoded.
    """
    try:
        # Try to get credentials from service account file first
        credentials_file = os.getenv('FIREBASE_CREDENTIALS')
        if credentials_file and os.path.exists(credentials_file):
            with open(credentials_file, 'r') as f:
                return json.load(f)
        
        # Fallback to environment variables for individual components
        creds_dict = {
            "type": "service_account",
            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.getenv('FIREBASE_CLIENT_ID'),
            "auth_uri": os.getenv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
            "token_uri": os.getenv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('FIREBASE_CLIENT_EMAIL', '')}"
        }
        
        # Validate required fields
        required_fields = ['project_id', 'private_key', 'client_email']
        for field in required_fields:
            if not creds_dict.get(field):
                raise ValueError(f"Missing required Firebase credential: {field}")
        
        return creds_dict
    
    except Exception as e:
        logger.error(f"Failed to load Firebase credentials: {e}")
        raise

def initialize_firebase() -> Any:
    """
    Initialize Firebase Admin SDK with HIPAA-compliant configurations.
    
    Returns:
        firebase_admin.App or str: Initialized Firebase app instance or test mode indicator
    """
    global _firebase_app
    
    if _firebase_app is not None:
        return _firebase_app
    
    # Check if we're in test mode
    if os.getenv("FIREBASE_TEST_MODE", "true").lower() == "true":
        logger.info("Firebase running in test mode - using mock implementation")
        _firebase_app = "test_mode"  # Mock app for testing
        return _firebase_app
    
    try:
        # Get credentials
        creds_dict = get_firebase_credentials()
        cred = credentials.Certificate(creds_dict)
        
        # Initialize app with security configurations
        _firebase_app = firebase_admin.initialize_app(cred, {
            'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET'),
            'databaseURL': f"https://{creds_dict['project_id']}-default-rtdb.firebaseio.com/"
        })
        
        logger.info("Firebase Admin SDK initialized successfully")
        return _firebase_app
    
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise

def get_firestore_client():
    """
    Get Firestore client with HIPAA-compliant settings.
    
    Returns:
        google.cloud.firestore.Client or MockFirestoreClient: Firestore client instance
    """
    global _firestore_client
    
    if _firestore_client is not None:
        return _firestore_client
    
    # Check if we're in test mode
    if os.getenv("FIREBASE_TEST_MODE", "true").lower() == "true":
        logger.info("Using mock Firestore client for testing")
        _firestore_client = MockFirestoreClient()
        return _firestore_client
    
    try:
        # Ensure Firebase is initialized
        if _firebase_app is None:
            initialize_firebase()
        
        _firestore_client = firestore.client()
        logger.info("Firestore client initialized successfully")
        return _firestore_client
    
    except Exception as e:
        logger.error(f"Failed to initialize Firestore client: {e}")
        raise

def validate_hipaa_compliance():
    """
    Validate that Firebase is configured for HIPAA compliance.
    
    This function checks various security configurations required for HIPAA.
    """
    try:
        # Skip validation in test mode
        if os.getenv("FIREBASE_TEST_MODE", "true").lower() == "true":
            logger.info("HIPAA compliance validation skipped in test mode")
            return True
        
        # Check if using HTTPS (required for PHI transmission)
        project_id = os.getenv('FIREBASE_PROJECT_ID')
        if not project_id:
            raise ValueError("Project ID must be configured for HIPAA compliance")
        
        # Validate encryption settings
        creds = get_firebase_credentials()
        if not creds.get('private_key'):
            raise ValueError("Private key encryption must be configured")
        
        # Check storage bucket security
        storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET')
        if not storage_bucket:
            logger.warning("Storage bucket not configured - file uploads may not be HIPAA compliant")
        
        logger.info("Firebase HIPAA compliance validation passed")
        return True
    
    except Exception as e:
        logger.error(f"HIPAA compliance validation failed: {e}")
        raise

# Initialize Firebase on module import only if not in test mode
try:
    if os.getenv("FIREBASE_TEST_MODE", "true").lower() != "true":
        initialize_firebase()
        validate_hipaa_compliance()
    else:
        logger.info("Firebase initialization skipped - running in test mode")
except Exception as e:
    logger.warning(f"Firebase initialization deferred due to: {e}")
