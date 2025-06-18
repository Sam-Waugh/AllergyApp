from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas.schemas import DailyLogCreate, DailyLogUpdate, DailyLogResponse, APIResponse
from crud.crud import create_daily_log, get_daily_logs, get_daily_log, update_daily_log, get_child
from utils.auth import get_current_user
from models.models import User

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
