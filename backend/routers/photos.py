from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from datetime import datetime

from database.database import get_db
from schemas.schemas import PhotoEntryCreate, PhotoEntryResponse, APIResponse
from crud.crud import create_photo_entry, get_photo_entries, get_child
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}

def save_upload_file(upload_file: UploadFile) -> str:
    # Generate unique filename
    file_extension = os.path.splitext(upload_file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = upload_file.file.read()
        buffer.write(content)
    
    return f"/uploads/{unique_filename}"

@router.post("/", response_model=APIResponse)
async def upload_photo(
    child_id: int,
    photo_type: str,
    file: UploadFile = File(...),
    body_area: str = "",
    severity_rating: str = "",
    description: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify child belongs to current user
    child = get_child(db, child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Save uploaded file
    photo_url = save_upload_file(file)
    
    # Create photo entry
    photo_data = PhotoEntryCreate(
        child_id=child_id,
        date=datetime.utcnow(),
        photo_type=photo_type,
        body_area=body_area,
        severity_rating=severity_rating,
        description=description,
        tags=[]
    )
    
    db_photo = create_photo_entry(db=db, photo=photo_data, photo_url=photo_url)
    
    return APIResponse(
        success=True,
        message="Photo uploaded successfully",
        data={"photo_id": db_photo.id, "photo_url": photo_url}
    )

@router.get("/{child_id}", response_model=List[PhotoEntryResponse])
def get_child_photos(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify child belongs to current user
    child = get_child(db, child_id, int(current_user.id))
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    photos = get_photo_entries(db, child_id=child_id)
    return photos
