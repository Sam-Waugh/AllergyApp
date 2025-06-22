from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    children = relationship("Child", back_populates="parent")

class Child(Base):
    __tablename__ = "children"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date_of_birth = Column(DateTime)
    gender = Column(String)
    parent_id = Column(Integer, ForeignKey("users.id"))
    
    # Medical information
    known_allergies = Column(Text)  # JSON string
    medications = Column(Text)  # JSON string
    medical_conditions = Column(Text)  # JSON string
    emergency_contact = Column(String)
    doctor_name = Column(String)
    doctor_contact = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("User", back_populates="children")
    daily_logs = relationship("DailyLog", back_populates="child")
    photo_entries = relationship("PhotoEntry", back_populates="child")

class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    date = Column(DateTime, index=True)
    
    # Comprehensive Symptoms (using JSON for flexible arrays)
    symptoms = Column(JSON)  # ["runny nose", "itchy eyes", "eczema flare", "wheezing"]
    symptom_severity = Column(JSON)  # {"runny_nose": 3, "itchy_eyes": 2, "eczema": 4}
    
    # Triggers and Environmental Factors
    triggers = Column(JSON)  # ["pollen", "dust", "pet dander", "food"]
    suspected_triggers = Column(JSON)  # Additional triggers user suspects
    
    # Mood and Well-being
    mood = Column(String)  # "good", "tired", "irritable", "happy"
    mood_scale = Column(Integer)  # 1-10 scale
    energy_level = Column(Integer)  # 1-10 scale
    sleep_quality = Column(String)  # "poor", "fair", "good", "excellent"
    sleep_hours = Column(Float)
    
    # Activities and Lifestyle
    activities = Column(JSON)  # ["outdoor play", "swimming", "indoor activities"]
    foods_consumed = Column(JSON)  # [{"food": "peanuts", "time": "12:00", "reaction": false}]
    medications_taken = Column(JSON)  # [{"medication": "antihistamine", "time": "08:00", "dose": "10mg"}]
    
    # Environmental Data (from your pollen API)
    weather_conditions = Column(String)
    temperature = Column(Float)
    humidity = Column(Float)
    air_quality_index = Column(Integer)
    pollen_count = Column(String)
    pollen_data = Column(JSON)  # Store detailed pollen data from your API
    
    # Detailed Notes
    symptoms_notes = Column(Text)
    trigger_notes = Column(Text)
    general_notes = Column(Text)
    parent_observations = Column(Text)
    
    # Severity Scores (legacy compatibility)
    eczema_severity = Column(String)
    asthma_severity = Column(String)
    allergic_reaction_severity = Column(String)
    overall_mood = Column(String)
    stress_level = Column(String)
    
    # Photo References
    photo_count = Column(Integer, default=0)  # Number of photos taken this day
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    child = relationship("Child", back_populates="daily_logs")
    photos = relationship("PhotoEntry", back_populates="daily_log", cascade="all, delete-orphan")

class PhotoEntry(Base):
    __tablename__ = "photo_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    daily_log_id = Column(Integer, ForeignKey("daily_logs.id"), nullable=True)  # Link to daily log
    date = Column(DateTime, index=True)
    
    # Photo Information
    photo_url = Column(String, nullable=False)  # URL to stored photo
    photo_path = Column(String)  # Local storage path
    original_filename = Column(String)
    file_size = Column(Integer)  # Size in bytes
    mime_type = Column(String)  # image/jpeg, image/png, etc.
    
    # Medical Classification
    photo_type = Column(String)  # 'eczema', 'rash', 'hives', 'general', 'medication', 'food'
    body_area = Column(String)  # 'face', 'arms', 'legs', 'torso', 'hands', 'feet'
    severity_rating = Column(Integer)  # 1-10 scale
    
    # Symptom Association
    associated_symptoms = Column(JSON)  # ["redness", "swelling", "itching"]
    symptom_duration = Column(String)  # "new", "improving", "worsening", "chronic"
    
    # Metadata and Context
    description = Column(Text)
    tags = Column(JSON)  # ["before_treatment", "after_medication", "flare_up"]
    
    # Privacy and Security
    is_sensitive = Column(Boolean, default=True)  # Mark as sensitive health data
    shared_with_doctor = Column(Boolean, default=False)
    
    # Timestamps
    taken_at = Column(DateTime)  # When photo was actually taken
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    child = relationship("Child", back_populates="photo_entries")
    daily_log = relationship("DailyLog", back_populates="photos")
    
    # Relationships
    child = relationship("Child", back_populates="photo_entries")

class ResearchArticle(Base):
    __tablename__ = "research_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    summary = Column(Text)
    source = Column(String)
    publication_date = Column(DateTime)
    url = Column(String)
    tags = Column(Text)  # JSON string
    
    created_at = Column(DateTime, default=datetime.utcnow)
