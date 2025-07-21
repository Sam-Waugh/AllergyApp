"""
Script to migrate data from SQLAlchemy/SQLite to Firestore.

This script will:
1. Read all data from SQLite database
2. Convert it to the appropriate format for Firestore
3. Upload it to Firestore collections
"""

import os
import json
import logging
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize SQLAlchemy
from models.models import User, Child, DailyLog, PhotoEntry
from database.database import get_db, engine

# Initialize Firestore
from config.firebase_config import get_firestore_client

def init_firestore():
    """Initialize Firestore client"""
    try:
        db = get_firestore_client()
        logger.info("Firestore client initialized successfully")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize Firestore: {str(e)}")
        raise

def get_all_users_from_sql():
    """Get all users from SQLite database"""
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        users = session.query(User).all()
        logger.info(f"Retrieved {len(users)} users from SQLite")
        return users
    except Exception as e:
        logger.error(f"Failed to get users from SQLite: {str(e)}")
        return []

def get_all_children_from_sql():
    """Get all children from SQLite database"""
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        children = session.query(Child).all()
        logger.info(f"Retrieved {len(children)} children from SQLite")
        return children
    except Exception as e:
        logger.error(f"Failed to get children from SQLite: {str(e)}")
        return []

def get_all_logs_from_sql():
    """Get all daily logs from SQLite database"""
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        logs = session.query(DailyLog).all()
        logger.info(f"Retrieved {len(logs)} daily logs from SQLite")
        return logs
    except Exception as e:
        logger.error(f"Failed to get daily logs from SQLite: {str(e)}")
        return []

def convert_user_to_firestore(user):
    """Convert SQLAlchemy User to Firestore document"""
    user_id = f"user_{user.id}"
    return {
        'id': user_id,
        'email': user.email,
        'hashed_password': user.hashed_password,
        'full_name': user.full_name,
        'is_active': user.is_active,
        'created_at': user.created_at.replace(tzinfo=timezone.utc),
    }

def convert_child_to_firestore(child):
    """Convert SQLAlchemy Child to Firestore document"""
    child_id = f"child_{child.id}"
    parent_id = f"user_{child.parent_id}"
    
    return {
        'id': child_id,
        'parent_id': parent_id,
        'name': child.name,
        'date_of_birth': child.date_of_birth.replace(tzinfo=timezone.utc),
        'gender': child.gender,
        'known_allergies': json.loads(child.known_allergies) if child.known_allergies else [],
        'medications': json.loads(child.medications) if child.medications else [],
        'medical_conditions': json.loads(child.medical_conditions) if child.medical_conditions else [],
        'emergency_contact': child.emergency_contact,
        'doctor_name': child.doctor_name,
        'doctor_contact': child.doctor_contact,
        'created_at': child.created_at.replace(tzinfo=timezone.utc),
        'updated_at': child.updated_at.replace(tzinfo=timezone.utc) if child.updated_at else child.created_at.replace(tzinfo=timezone.utc),
    }

def convert_log_to_firestore(log):
    """Convert SQLAlchemy DailyLog to Firestore document"""
    log_id = f"log_{log.id}"
    child_id = f"child_{log.child_id}"
    
    return {
        'id': log_id,
        'child_id': child_id,
        'date': log.date.replace(tzinfo=timezone.utc),
        'eczema_severity': log.eczema_severity,
        'asthma_severity': log.asthma_severity,
        'allergic_reaction_severity': log.allergic_reaction_severity,
        'overall_mood': log.overall_mood,
        'foods_consumed': json.loads(log.foods_consumed) if log.foods_consumed else [],
        'activities': json.loads(log.activities) if log.activities else [],
        'medications_taken': json.loads(log.medications_taken) if log.medications_taken else [],
        'sleep_quality': log.sleep_quality,
        'stress_level': log.stress_level,
        'weather_conditions': log.weather_conditions,
        'temperature': log.temperature,
        'humidity': log.humidity,
        'air_quality_index': log.air_quality_index,
        'pollen_count': log.pollen_count,
        'symptoms_notes': log.symptoms_notes,
        'trigger_notes': log.trigger_notes,
        'created_at': log.created_at.replace(tzinfo=timezone.utc),
        'updated_at': log.updated_at.replace(tzinfo=timezone.utc) if hasattr(log, 'updated_at') and log.updated_at else log.created_at.replace(tzinfo=timezone.utc),
    }

def migrate_users_to_firestore(db, users):
    """Migrate users to Firestore"""
    batch_size = 500
    batches = [users[i:i + batch_size] for i in range(0, len(users), batch_size)]
    
    for i, batch in enumerate(batches):
        batch_ref = db.batch()
        
        for user in batch:
            user_data = convert_user_to_firestore(user)
            user_ref = db.collection('users').document(user_data['id'])
            batch_ref.set(user_ref, user_data)
        
        # Commit batch
        batch_ref.commit()
        logger.info(f"Committed batch {i+1}/{len(batches)} of users")
    
    logger.info(f"Migrated {len(users)} users to Firestore")

def migrate_children_to_firestore(db, children):
    """Migrate children to Firestore"""
    batch_size = 500
    batches = [children[i:i + batch_size] for i in range(0, len(children), batch_size)]
    
    for i, batch in enumerate(batches):
        batch_ref = db.batch()
        
        for child in batch:
            child_data = convert_child_to_firestore(child)
            child_ref = db.collection('children').document(child_data['id'])
            batch_ref.set(child_ref, child_data)
        
        # Commit batch
        batch_ref.commit()
        logger.info(f"Committed batch {i+1}/{len(batches)} of children")
    
    logger.info(f"Migrated {len(children)} children to Firestore")

def migrate_logs_to_firestore(db, logs):
    """Migrate daily logs to Firestore"""
    batch_size = 500
    batches = [logs[i:i + batch_size] for i in range(0, len(logs), batch_size)]
    
    for i, batch in enumerate(batches):
        batch_ref = db.batch()
        
        for log in batch:
            log_data = convert_log_to_firestore(log)
            log_ref = db.collection('daily_logs').document(log_data['id'])
            batch_ref.set(log_ref, log_data)
        
        # Commit batch
        batch_ref.commit()
        logger.info(f"Committed batch {i+1}/{len(batches)} of logs")
    
    logger.info(f"Migrated {len(logs)} daily logs to Firestore")

def main():
    """Main migration function"""
    try:
        # Initialize Firestore
        db = init_firestore()
        
        # Get data from SQLite
        users = get_all_users_from_sql()
        children = get_all_children_from_sql()
        logs = get_all_logs_from_sql()
        
        # Confirm migration
        print(f"\nReady to migrate:\n- {len(users)} users\n- {len(children)} children\n- {len(logs)} daily logs")
        confirmation = input("\nThis will add data to Firestore. Continue? (y/n): ")
        
        if confirmation.lower() != 'y':
            logger.info("Migration cancelled")
            return
        
        # Perform migration
        migrate_users_to_firestore(db, users)
        migrate_children_to_firestore(db, children)
        migrate_logs_to_firestore(db, logs)
        
        logger.info("Migration completed successfully")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")

if __name__ == "__main__":
    main()
