from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas.schemas import ChildCreate, ChildUpdate, ChildResponse, APIResponse
from crud.crud import create_child, get_children, get_child, update_child
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

@router.post("/children", response_model=APIResponse)
def create_child_profile(
    child: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_child = create_child(db=db, child=child, parent_id=int(current_user.id))
    return APIResponse(
        success=True,
        message="Child profile created successfully",
        data={"child_id": db_child.id}
    )

@router.get("/children", response_model=List[ChildResponse])
def get_user_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    children = get_children(db, parent_id=int(current_user.id))
    return children

@router.get("/children/{child_id}", response_model=ChildResponse)
def get_child_profile(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    child = get_child(db, child_id=child_id, parent_id=int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

@router.put("/children/{child_id}", response_model=APIResponse)
def update_child_profile(
    child_id: int,
    child_update: ChildUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_child = update_child(
        db=db, 
        child_id=child_id, 
        parent_id=int(current_user.id), 
        child_update=child_update
    )
    if not updated_child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return APIResponse(
        success=True,
        message="Child profile updated successfully",
        data={"child_id": updated_child.id}
    )
