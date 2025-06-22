from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
import json

from database.database import get_db
from schemas.schemas import (
    DailyLogCreate, DailyLogUpdate, DailyLogResponse, APIResponse,
    EnhancedDailyLogCreate, EnhancedDailyLogUpdate, EnhancedDailyLogResponse
)
from crud.crud import create_daily_log, get_daily_logs, get_daily_log, update_daily_log, get_child
from utils.auth import get_current_user
from models.models import User, DailyLog, Child

router = APIRouter()

@router.post("/", response_model=APIResponse)
def create_log_entry(
    log: DailyLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify child belongs to current user
    child = get_child(db, log.child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    db_log = create_daily_log(db=db, log=log)
    return APIResponse(
        success=True,
        message="Daily log created successfully",
        data={"log_id": db_log.id}
    )

@router.get("/{child_id}", response_model=List[DailyLogResponse])
def get_child_logs(
    child_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify child belongs to current user
    child = get_child(db, child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    logs = get_daily_logs(db, child_id=child_id, skip=skip, limit=limit)
    return logs

@router.put("/{log_id}", response_model=APIResponse)
def update_log_entry(
    log_id: int,
    log_update: DailyLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the log and verify ownership
    db_log = get_daily_log(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Verify child belongs to current user
    child = get_child(db, db_log.child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    updated_log = update_daily_log(db=db, log_id=log_id, log_update=log_update)
    return APIResponse(
        success=True,
        message="Daily log updated successfully",
        data={"log_id": updated_log.id}
    )

@router.get("/entry/{log_id}", response_model=DailyLogResponse)
def get_log_entry(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_log = get_daily_log(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Verify child belongs to current user
    child = get_child(db, db_log.child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return db_log

# --- Enhanced Daily Tracker Endpoints ---
@router.post("/enhanced/", response_model=APIResponse)
def create_enhanced_log_entry(
    log: EnhancedDailyLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify child belongs to current user
    child = get_child(db, log.child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    # Convert to dict for flexible JSON fields
    log_dict = log.dict()
    db_log = DailyLog(
        child_id=log.child_id,
        date=log.date,
        symptoms=log_dict.get("symptoms"),
        symptom_severity=log_dict.get("symptom_details"),
        triggers=log_dict.get("triggers"),
        suspected_triggers=log_dict.get("suspected_triggers"),
        mood=log_dict.get("mood"),
        mood_scale=log_dict.get("mood_scale"),
        energy_level=log_dict.get("energy_level"),
        sleep_quality=log_dict.get("sleep_quality"),
        sleep_hours=log_dict.get("sleep_hours"),
        activities=log_dict.get("activities"),
        foods_consumed=log_dict.get("foods_consumed"),
        medications_taken=log_dict.get("medications_taken"),
        weather_conditions=log_dict.get("weather_conditions"),
        temperature=log_dict.get("temperature"),
        humidity=log_dict.get("humidity"),
        air_quality_index=log_dict.get("air_quality_index"),
        pollen_count=log_dict.get("pollen_count"),
        pollen_data=log_dict.get("pollen_data"),
        symptoms_notes=log_dict.get("symptoms_notes"),
        trigger_notes=log_dict.get("trigger_notes"),
        general_notes=log_dict.get("general_notes"),
        parent_observations=log_dict.get("parent_observations"),
        eczema_severity=log_dict.get("eczema_severity"),
        asthma_severity=log_dict.get("asthma_severity"),
        allergic_reaction_severity=log_dict.get("allergic_reaction_severity"),
        overall_mood=log_dict.get("overall_mood"),
        stress_level=log_dict.get("stress_level"),
        photo_count=0
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return APIResponse(success=True, message="Enhanced daily log created", data={"log_id": db_log.id})

@router.get("/enhanced/{child_id}", response_model=List[EnhancedDailyLogResponse])
def get_enhanced_child_logs(
    child_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    child = get_child(db, child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    logs = db.query(DailyLog).filter(DailyLog.child_id == child_id).order_by(desc(DailyLog.date)).offset(skip).limit(limit).all()
    return [EnhancedDailyLogResponse(
        id=log.id,
        child_id=log.child_id,
        date=log.date,
        symptoms=log.symptoms,
        symptom_details=log.symptom_severity,
        triggers=log.triggers,
        suspected_triggers=log.suspected_triggers,
        mood=log.mood,
        mood_scale=log.mood_scale,
        energy_level=log.energy_level,
        sleep_quality=log.sleep_quality,
        sleep_hours=log.sleep_hours,
        activities=log.activities,
        foods_consumed=log.foods_consumed,
        medications_taken=log.medications_taken,
        weather_conditions=log.weather_conditions,
        temperature=log.temperature,
        humidity=log.humidity,
        air_quality_index=log.air_quality_index,
        pollen_count=log.pollen_count,
        pollen_data=log.pollen_data,
        symptoms_notes=log.symptoms_notes,
        trigger_notes=log.trigger_notes,
        general_notes=log.general_notes,
        parent_observations=log.parent_observations,
        eczema_severity=log.eczema_severity,
        asthma_severity=log.asthma_severity,
        allergic_reaction_severity=log.allergic_reaction_severity,
        overall_mood=log.overall_mood,
        stress_level=log.stress_level,
        photo_count=log.photo_count or 0,
        photos=[] if not hasattr(log, 'photos') else log.photos,
        created_at=log.created_at,
        updated_at=log.updated_at
    ) for log in logs]

@router.put("/enhanced/{log_id}", response_model=APIResponse)
def update_enhanced_log_entry(
    log_id: int,
    log_update: EnhancedDailyLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_log = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")
    # Only allow update if user owns the child
    child = get_child(db, db_log.child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = log_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)
    db.commit()
    db.refresh(db_log)
    return APIResponse(success=True, message="Enhanced daily log updated", data={"log_id": db_log.id})
# --- End Enhanced Daily Tracker Endpoints ---
