from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

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
    date = Column(DateTime)
    
    # Symptoms
    eczema_severity = Column(String)
    asthma_severity = Column(String)
    allergic_reaction_severity = Column(String)
    overall_mood = Column(String)
    
    # Activities and environment
    foods_consumed = Column(Text)  # JSON string
    activities = Column(Text)  # JSON string
    medications_taken = Column(Text)  # JSON string
    sleep_quality = Column(String)
    stress_level = Column(String)
    
    # Environmental data
    weather_conditions = Column(String)
    temperature = Column(Float)
    humidity = Column(Float)
    air_quality_index = Column(Integer)
    pollen_count = Column(String)
    
    # Notes
    symptoms_notes = Column(Text)
    trigger_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    child = relationship("Child", back_populates="daily_logs")

class PhotoEntry(Base):
    __tablename__ = "photo_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    date = Column(DateTime)
    
    # Photo information
    photo_url = Column(String)
    photo_type = Column(String)  # 'eczema', 'rash', 'general'
    body_area = Column(String)
    severity_rating = Column(String)
    
    # Metadata
    description = Column(Text)
    tags = Column(Text)  # JSON string
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
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
