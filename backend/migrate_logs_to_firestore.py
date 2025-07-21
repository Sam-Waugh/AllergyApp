"""
Script to migrate SQLAlchemy symptom logs data to Firestore.
This is the key solution to fix the issue where symptom logs are using SQLAlchemy when they should use Firestore.
"""

import os
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# SQLAlchemy imports
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, and_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Firestore imports
from config.firebase_config import get_firestore_client
from models.models import Base, DailyLog, User, Child
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# SQLAlchemy setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./allergy_app.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Firestore setup
db = get_firestore_client()

def get_db():
    """Get SQLAlchemy database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

def convert_sqlalchemy_object_to_dict(obj: Any) -> Dict[str, Any]:
    """Convert SQLAlchemy object to dictionary for Firestore storage"""
    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        
        # Handle JSON strings
        if column.name in ["foods_consumed", "activities", "medications_taken"]:
            import json
            if value and isinstance(value, str):
                try:
                    value = json.loads(value)
                except:
                    value = []
        
        # Convert datetime to UTC
        if isinstance(value, datetime):
            value = value.replace(tzinfo=timezone.utc)
        
        result[column.name] = value
    
    return result

def migrate_children_to_firestore():
    """Migrate all children from SQLAlchemy to Firestore"""
    logger.info("Starting children migration...")
    
    db_session = get_db()
    children = db_session.query(Child).all()
    
    for child in children:
        child_dict = convert_sqlalchemy_object_to_dict(child)
        
        # Create Firestore ID
        child_id = f"child_{child.id}"
        
        # Update parent_id to string format
        parent_id = f"user_{child.parent_id}"
        child_dict["parent_id"] = parent_id
        child_dict["id"] = child_id
        
        # Check if child already exists in Firestore
        doc_ref = db.collection("children").document(child_id)
        if not doc_ref.get().exists:
            doc_ref.set(child_dict)
            logger.info(f"Migrated child {child_id} - {child.name}")
        else:
            logger.info(f"Child {child_id} already exists in Firestore")
    
    logger.info(f"Completed children migration. Migrated {len(children)} children.")
    return [f"child_{child.id}" for child in children]

def migrate_logs_to_firestore(child_ids: List[str] = None):
    """Migrate all daily logs from SQLAlchemy to Firestore"""
    logger.info("Starting logs migration...")
    
    db_session = get_db()
    
    # Get all logs or filter by child IDs
    if child_ids:
        # Convert Firestore IDs back to integers
        sql_child_ids = [int(child_id.replace("child_", "")) for child_id in child_ids]
        logs = db_session.query(DailyLog).filter(DailyLog.child_id.in_(sql_child_ids)).all()
    else:
        logs = db_session.query(DailyLog).all()
    
    migrated_count = 0
    for log in logs:
        log_dict = convert_sqlalchemy_object_to_dict(log)
        
        # Create Firestore ID
        log_id = f"log_{log.id}"
        
        # Update child_id to string format
        child_id = f"child_{log.child_id}"
        log_dict["child_id"] = child_id
        log_dict["id"] = log_id
        
        # Check if log already exists in Firestore
        doc_ref = db.collection("daily_logs").document(log_id)
        if not doc_ref.get().exists:
            doc_ref.set(log_dict)
            logger.info(f"Migrated log {log_id} for child {child_id}")
            migrated_count += 1
        else:
            logger.info(f"Log {log_id} already exists in Firestore")
    
    logger.info(f"Completed logs migration. Migrated {migrated_count} logs out of {len(logs)} total.")

def run_migration():
    """Run the full migration process"""
    try:
        logger.info("Starting migration from SQLAlchemy to Firestore...")
        
        # First migrate children to maintain references
        child_ids = migrate_children_to_firestore()
        
        # Then migrate logs with proper child references
        migrate_logs_to_firestore(child_ids)
        
        logger.info("Migration completed successfully.")
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
