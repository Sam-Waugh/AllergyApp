"""
Patching the logs.py router to use Firestore for symptom logs storage.
This patch modifies the existing endpoints to use Firestore instead of SQLAlchemy
without changing the endpoint URLs or response formats.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
import logging

# Keep the original schema imports for API compatibility
from schemas.schemas import DailyLogCreate, DailyLogUpdate, DailyLogResponse, APIResponse
from crud.crud import get_child
from utils.auth import get_current_user
from models.models import User

# Import the new Firestore adapter service
from services.firestore_log_adapter import FirestoreLogService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Firestore service
firestore_logs = FirestoreLogService()

@router.post("/", response_model=APIResponse)
def create_log_entry(
    log: DailyLogCreate,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Create a new daily log entry (using Firestore instead of SQLAlchemy)"""
    try:
        # Get database from request state (will be unused)
        db = request.state.db
        
        # Verify child belongs to current user (still using SQLAlchemy for now)
        child = get_child(db, log.child_id, int(current_user.id))
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Convert Pydantic model to dict
        log_data = log.dict()
        
        # Use Firestore adapter instead of SQLAlchemy
        db_log = firestore_logs.create_daily_log(log_data)
        
        # Extract ID for response (handling both dict and object access)
        log_id = getattr(db_log, 'id', None) or db_log.get('id')
        
        # Log the operation
        logger.info(f"Created Firestore log {log_id} for child {log.child_id}")
        
        return APIResponse(
            success=True,
            message="Daily log created successfully",
            data={"log_id": log_id}
        )
        
    except Exception as e:
        logger.error(f"Failed to create daily log: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create daily log: {str(e)}"
        )

@router.get("/{child_id}", response_model=List[DailyLogResponse])
def get_child_logs(
    child_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get daily logs for a child (using Firestore instead of SQLAlchemy)"""
    try:
        # Get database from request state (will be unused)
        db = request.state.db
        
        # Verify child belongs to current user (still using SQLAlchemy for now)
        child = get_child(db, child_id, int(current_user.id))
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Use Firestore adapter instead of SQLAlchemy
        logs = firestore_logs.get_daily_logs(child_id, skip, limit)
        
        # Log the operation
        logger.info(f"Retrieved {len(logs)} Firestore logs for child {child_id}")
        
        # Convert to DailyLogResponse models
        # Note: DailyLogResponse expects integer IDs, but Firestore uses string IDs
        # We'll need to extract the numeric part from the Firestore ID
        response_logs = []
        for log in logs:
            log_id = log.get('id', '')
            if log_id.startswith('log_'):
                try:
                    numeric_id = int(log_id.split('_')[1])
                except (IndexError, ValueError):
                    numeric_id = 0
                    
                # Replace string ID with numeric ID for API compatibility
                log['id'] = numeric_id
                
                # Replace string child_id with numeric child_id
                child_id_str = log.get('child_id', '')
                if child_id_str.startswith('child_'):
                    try:
                        numeric_child_id = int(child_id_str.split('_')[1])
                        log['child_id'] = numeric_child_id
                    except (IndexError, ValueError):
                        pass
            
            # Convert to Pydantic model
            try:
                response_logs.append(DailyLogResponse(**log))
            except Exception as e:
                logger.error(f"Failed to convert log to response: {str(e)}")
        
        return response_logs
        
    except Exception as e:
        logger.error(f"Failed to get logs for child {child_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get logs: {str(e)}"
        )

@router.put("/{log_id}", response_model=APIResponse)
def update_log_entry(
    log_id: int,
    log_update: DailyLogUpdate,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Update a daily log entry (using Firestore instead of SQLAlchemy)"""
    try:
        # Get database from request state (will be unused)
        db = request.state.db
        
        # First get the log from Firestore
        db_log = firestore_logs.get_daily_log(log_id)
        if not db_log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        # Extract child_id from log
        child_id_str = db_log.get('child_id', '')
        numeric_child_id = None
        
        if child_id_str.startswith('child_'):
            try:
                numeric_child_id = int(child_id_str.split('_')[1])
            except (IndexError, ValueError):
                raise HTTPException(status_code=500, detail="Invalid child ID format")
        
        # Verify child belongs to current user (still using SQLAlchemy for now)
        if numeric_child_id:
            child = get_child(db, numeric_child_id, int(current_user.id))
            if not child:
                raise HTTPException(status_code=404, detail="Child not found")
        else:
            raise HTTPException(status_code=404, detail="Child ID not found in log")
        
        # Convert Pydantic model to dict
        update_data = log_update.dict(exclude_unset=True)
        
        # Use Firestore adapter instead of SQLAlchemy
        updated_log = firestore_logs.update_daily_log(log_id, update_data)
        
        if not updated_log:
            raise HTTPException(status_code=404, detail="Failed to update log")
        
        # Log the operation
        logger.info(f"Updated Firestore log {log_id}")
        
        return APIResponse(
            success=True,
            message="Daily log updated successfully",
            data={"log_id": log_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update log {log_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update log: {str(e)}"
        )

@router.get("/entry/{log_id}", response_model=DailyLogResponse)
def get_log_entry(
    log_id: int,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get a specific log entry (using Firestore instead of SQLAlchemy)"""
    try:
        # Get database from request state (will be unused)
        db = request.state.db
        
        # Get log from Firestore
        db_log = firestore_logs.get_daily_log(log_id)
        if not db_log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        # Extract child_id from log
        child_id_str = db_log.get('child_id', '')
        numeric_child_id = None
        
        if child_id_str.startswith('child_'):
            try:
                numeric_child_id = int(child_id_str.split('_')[1])
            except (IndexError, ValueError):
                raise HTTPException(status_code=500, detail="Invalid child ID format")
        
        # Verify child belongs to current user (still using SQLAlchemy for now)
        if numeric_child_id:
            child = get_child(db, numeric_child_id, int(current_user.id))
            if not child:
                raise HTTPException(status_code=404, detail="Child not found")
        else:
            raise HTTPException(status_code=404, detail="Child ID not found in log")
        
        # Replace string ID with numeric ID for API compatibility
        db_log['id'] = log_id
        db_log['child_id'] = numeric_child_id
        
        # Convert to Pydantic model
        return DailyLogResponse(**db_log)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get log {log_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get log: {str(e)}"
        )

@router.delete("/{log_id}", response_model=APIResponse)
def delete_log_entry(
    log_id: int,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Delete a daily log entry (using Firestore instead of SQLAlchemy)"""
    try:
        # Get database from request state (will be unused)
        db = request.state.db
        
        # Get log from Firestore
        db_log = firestore_logs.get_daily_log(log_id)
        if not db_log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        # Extract child_id from log
        child_id_str = db_log.get('child_id', '')
        numeric_child_id = None
        
        if child_id_str.startswith('child_'):
            try:
                numeric_child_id = int(child_id_str.split('_')[1])
            except (IndexError, ValueError):
                raise HTTPException(status_code=500, detail="Invalid child ID format")
        
        # Verify child belongs to current user (still using SQLAlchemy for now)
        if numeric_child_id:
            child = get_child(db, numeric_child_id, int(current_user.id))
            if not child:
                raise HTTPException(status_code=404, detail="Child not found")
        else:
            raise HTTPException(status_code=404, detail="Child ID not found in log")
        
        # Delete log from Firestore
        success = firestore_logs.delete_daily_log(log_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete log")
        
        # Log the operation
        logger.info(f"Deleted Firestore log {log_id}")
        
        return APIResponse(
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
            detail=f"Failed to delete log: {str(e)}"
        )
