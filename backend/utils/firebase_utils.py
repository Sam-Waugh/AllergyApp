import firebase_admin
from firebase_admin import credentials, storage
import os
import json
from datetime import timedelta

# Option 1: Load the entire JSON credentials from an environment variable (Recommended for production)
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")

# Option 2: Load credentials from a file path (Good for local development)
# The path can be set via FIREBASE_CREDENTIALS env var, defaulting to 'google-services.json'
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS", "google-services.json")

FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")

firebase_app = None

def initialize_firebase():
    """
    Initializes the Firebase Admin SDK.

    Credentials can be provided in two ways, with priority given to the environment variable:
    1. FIREBASE_CREDENTIALS_JSON: An environment variable containing the full JSON content of the service account key.
    2. FIREBASE_CREDENTIALS: An environment variable specifying the file path to the service account key.
       If not set, it defaults to 'google-services.json' in the backend root.
    """
    global firebase_app
    if firebase_admin._apps:
        return firebase_app

    cred = None
    # Prioritize loading from the JSON environment variable
    if FIREBASE_CREDENTIALS_JSON:
        try:
            cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
        except json.JSONDecodeError:
            raise ValueError("Failed to parse FIREBASE_CREDENTIALS_JSON. Please check the variable content.")
    # Fallback to loading from the file path
    elif os.path.exists(FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    
    if not cred:
        raise ValueError(
            "Firebase credentials not found. "
            "Please set FIREBASE_CREDENTIALS_JSON (recommended) or "
            "ensure the file specified by FIREBASE_CREDENTIALS exists."
        )

    if not FIREBASE_STORAGE_BUCKET:
        raise ValueError("FIREBASE_STORAGE_BUCKET environment variable is not set.")

    firebase_app = firebase_admin.initialize_app(cred, {
        'storageBucket': FIREBASE_STORAGE_BUCKET
    })
    
    return firebase_app

def upload_file_to_firebase(file_data: bytes, filename: str, user_id: int):
    """
    Uploads a file to Firebase Storage and returns a secure, short-lived signed URL.
    """
    initialize_firebase()
    bucket = storage.bucket()
    blob = bucket.blob(f'user_uploads/{user_id}/{filename}')
    
    # Upload the file content
    blob.upload_from_string(file_data, content_type='application/octet-stream')
    
    # Generate a signed URL that expires in 1 hour.
    # This provides temporary, secure access to the file, which is critical for HIPAA compliance.
    signed_url = blob.generate_signed_url(version="v4", expiration=timedelta(hours=1))
    
    return signed_url
