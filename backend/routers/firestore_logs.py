"""
Firestore-based logs router - replacing SQLAlchemy daily logs operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging

from schemas.firestore_schemas import (
    FirestoreDailyLogCreate, FirestoreDailyLogUpdate, FirestoreDailyLogResponse, FirestoreAPIResponse
)
from services.firestore_logs import FirestoreLogsService
from services.firestore_children import FirestoreChildService
from routers.firestore_auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Firestore services
logs_service = FirestoreLogsService()
child_service = FirestoreChildService()

@router.post("/", response_model=FirestoreAPIResponse)
def create_log_entry(
    log: FirestoreDailyLogCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new daily log entry using Firestore."""
    try:
        # Verify child belongs to current user
        child = child_service.get_child_by_id(log.child_id, current_user['id'])
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Convert DailyLogCreate to dict
        log_data = {
            'child_id': log.child_id,
            'date': log.date,
            'eczema_severity': log.eczema_severity,
            'asthma_severity': log.asthma_severity,
            'allergic_reaction_severity': log.allergic_reaction_severity,
            'overall_mood': log.overall_mood,
            'foods_consumed': log.foods_consumed,
            'activities': log.activities,
            'medications_taken': log.medications_taken,
            'sleep_quality': log.sleep_quality,
            'stress_level': log.stress_level,
            'weather_conditions': log.weather_conditions,
            'temperature': log.temperature,
            'humidity': log.humidity,
            'air_quality_index': log.air_quality_index,
            'pollen_count': log.pollen_count,
            'symptoms_notes': log.symptoms_notes,
            'trigger_notes': log.trigger_notes
        }
        
        new_log = logs_service.create_daily_log(log_data)
        
        return FirestoreAPIResponse(
            success=True,
            message="Daily log created successfully",
            data={"log_id": new_log['id']}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create daily log: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create daily log"
        )

@router.get("/{child_id}", response_model=List[FirestoreDailyLogResponse])
def get_child_logs(
    child_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get daily logs for a child."""
    try:
        # Verify child belongs to current user
        child = child_service.get_child_by_id(child_id, current_user['id'])
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        logs = logs_service.get_logs_by_child(child_id, skip, limit)
        
        # Convert to DailyLogResponse format
        log_responses = []
        for log in logs:
            log_response = FirestoreDailyLogResponse(
                id=log['id'],
                child_id=log['child_id'],
                date=log['date'],
                eczema_severity=log['eczema_severity'],
                asthma_severity=log['asthma_severity'],
                allergic_reaction_severity=log['allergic_reaction_severity'],
                overall_mood=log['overall_mood'],
                foods_consumed=log['foods_consumed'],
                activities=log['activities'],
                medications_taken=log['medications_taken'],
                sleep_quality=log['sleep_quality'],
                stress_level=log['stress_level'],
                weather_conditions=log['weather_conditions'],
                temperature=log['temperature'],
                humidity=log['humidity'],
                air_quality_index=log['air_quality_index'],
                pollen_count=log['pollen_count'],
                symptoms_notes=log['symptoms_notes'],
                trigger_notes=log['trigger_notes'],
                created_at=log['created_at'],
                updated_at=log['updated_at']
            )
            log_responses.append(log_response)
        
        return log_responses
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get logs for child {child_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve daily logs"
        )

@router.put("/{log_id}", response_model=FirestoreAPIResponse)
def update_log_entry(
    log_id: str,
    log_update: FirestoreDailyLogUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a daily log entry."""
    try:
        # Get the log and verify ownership
        existing_log = logs_service.get_log_by_id(log_id)
        if not existing_log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        # Verify child belongs to current user
        child = child_service.get_child_by_id(existing_log['child_id'], current_user['id'])
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Convert to dict, excluding unset values
        update_data = {}
        for field, value in log_update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        updated_log = logs_service.update_daily_log(log_id, update_data)
        
        if not updated_log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        return FirestoreAPIResponse(
            success=True,
            message="Daily log updated successfully",
            data={"log_id": updated_log['id']}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update log {log_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update daily log"
        )

@router.get("/entry/{log_id}", response_model=FirestoreDailyLogResponse)
def get_log_entry(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific log entry."""
    try:
        log = logs_service.get_log_by_id(log_id)
        if not log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        # Verify child belongs to current user
        child = child_service.get_child_by_id(log['child_id'], current_user['id'])
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        return FirestoreDailyLogResponse(
            id=log['id'],
            child_id=log['child_id'],
            date=log['date'],
            eczema_severity=log['eczema_severity'],
            asthma_severity=log['asthma_severity'],
            allergic_reaction_severity=log['allergic_reaction_severity'],
            overall_mood=log['overall_mood'],
            foods_consumed=log['foods_consumed'],
            activities=log['activities'],
            medications_taken=log['medications_taken'],
            sleep_quality=log['sleep_quality'],
            stress_level=log['stress_level'],
            weather_conditions=log['weather_conditions'],
            temperature=log['temperature'],
            humidity=log['humidity'],
            air_quality_index=log['air_quality_index'],
            pollen_count=log['pollen_count'],
            symptoms_notes=log['symptoms_notes'],
            trigger_notes=log['trigger_notes'],
            created_at=log['created_at'],
            updated_at=log['updated_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get log {log_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve daily log"
        )

@router.delete("/{log_id}", response_model=FirestoreAPIResponse)
def delete_log_entry(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a daily log entry."""
    try:
        # Get the log and verify ownership
        existing_log = logs_service.get_log_by_id(log_id)
        if not existing_log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        # Verify child belongs to current user
        child = child_service.get_child_by_id(existing_log['child_id'], current_user['id'])
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        success = logs_service.delete_daily_log(log_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Log not found")
        
        return FirestoreAPIResponse(
            success=True,
            message="Daily log deleted successfully",
            data={"log_id": log_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete log {log_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete daily log"
        )
