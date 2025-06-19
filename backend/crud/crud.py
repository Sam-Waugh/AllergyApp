from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import json
from datetime import datetime

from models.models import User, Child, DailyLog, PhotoEntry, ResearchArticle
from schemas.schemas import (
    UserCreate, ChildCreate, ChildUpdate, DailyLogCreate, DailyLogUpdate, 
    PhotoEntryCreate
)
from utils.auth import get_password_hash

# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Child CRUD
def get_children(db: Session, parent_id: int):
    return db.query(Child).filter(Child.parent_id == parent_id).all()

def get_child(db: Session, child_id: int, parent_id: int):
    return db.query(Child).filter(
        and_(Child.id == child_id, Child.parent_id == parent_id)
    ).first()

def create_child(db: Session, child: ChildCreate, parent_id: int):
    db_child = Child(
        name=child.name,
        date_of_birth=child.date_of_birth,
        gender=child.gender,
        parent_id=parent_id,
        known_allergies=json.dumps(child.known_allergies),
        medications=json.dumps(child.medications),
        medical_conditions=json.dumps(child.medical_conditions),
        emergency_contact=child.emergency_contact,
        doctor_name=child.doctor_name,
        doctor_contact=child.doctor_contact
    )
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    return db_child

def update_child(db: Session, child_id: int, parent_id: int, child_update: ChildUpdate):
    db_child = get_child(db, child_id, parent_id)
    if db_child:
        update_data = child_update.dict(exclude_unset=True)
        if 'known_allergies' in update_data:
            update_data['known_allergies'] = json.dumps(update_data['known_allergies'])
        if 'medications' in update_data:
            update_data['medications'] = json.dumps(update_data['medications'])
        if 'medical_conditions' in update_data:
            update_data['medical_conditions'] = json.dumps(update_data['medical_conditions'])
        
        for field, value in update_data.items():
            setattr(db_child, field, value)
        
        db_child.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_child)
    return db_child

# Daily Log CRUD
def get_daily_logs(db: Session, child_id: int, skip: int = 0, limit: int = 100):
    return db.query(DailyLog).filter(DailyLog.child_id == child_id).offset(skip).limit(limit).all()

def get_daily_log(db: Session, log_id: int):
    return db.query(DailyLog).filter(DailyLog.id == log_id).first()

def create_daily_log(db: Session, log: DailyLogCreate):
    db_log = DailyLog(
        child_id=log.child_id,
        date=log.date,
        eczema_severity=log.eczema_severity,
        asthma_severity=log.asthma_severity,
        allergic_reaction_severity=log.allergic_reaction_severity,
        overall_mood=log.overall_mood,
        foods_consumed=json.dumps(log.foods_consumed),
        activities=json.dumps(log.activities),
        medications_taken=json.dumps(log.medications_taken),
        sleep_quality=log.sleep_quality,
        stress_level=log.stress_level,
        weather_conditions=log.weather_conditions,
        temperature=log.temperature,
        humidity=log.humidity,
        air_quality_index=log.air_quality_index,
        pollen_count=log.pollen_count,
        symptoms_notes=log.symptoms_notes,
        trigger_notes=log.trigger_notes
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def update_daily_log(db: Session, log_id: int, log_update: DailyLogUpdate):
    db_log = get_daily_log(db, log_id)
    if db_log:
        update_data = log_update.dict(exclude_unset=True)
        if 'foods_consumed' in update_data:
            update_data['foods_consumed'] = json.dumps(update_data['foods_consumed'])
        if 'activities' in update_data:
            update_data['activities'] = json.dumps(update_data['activities'])
        if 'medications_taken' in update_data:
            update_data['medications_taken'] = json.dumps(update_data['medications_taken'])
        
        for field, value in update_data.items():
            setattr(db_log, field, value)
        
        db_log.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_log)
    return db_log

# Photo Entry CRUD
def get_photo_entries(db: Session, child_id: int):
    return db.query(PhotoEntry).filter(PhotoEntry.child_id == child_id).all()

def create_photo_entry(db: Session, photo: PhotoEntryCreate, photo_url: str):
    db_photo = PhotoEntry(
        child_id=photo.child_id,
        date=photo.date,
        photo_url=photo_url,
        photo_type=photo.photo_type,
        body_area=photo.body_area,
        severity_rating=photo.severity_rating,
        description=photo.description,
        tags=json.dumps(photo.tags)
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo

# Research Article CRUD
def get_research_articles(db: Session, skip: int = 0, limit: int = 10):
    return db.query(ResearchArticle).offset(skip).limit(limit).all()
