"""
Firestore-based profiles router - replacing SQLAlchemy children operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging

from schemas.firestore_schemas import (
    FirestoreChildCreate, FirestoreChildUpdate, FirestoreChildResponse, FirestoreAPIResponse
)
from services.firestore_children import FirestoreChildService
from routers.firestore_auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Firestore service
child_service = FirestoreChildService()

@router.post("/children", response_model=FirestoreAPIResponse)
def create_child_profile(
    child: FirestoreChildCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new child profile using Firestore."""
    try:
        # Convert ChildCreate to dict
        child_data = {
            'name': child.name,
            'date_of_birth': child.date_of_birth,
            'gender': child.gender,
            'known_allergies': child.known_allergies,
            'medications': child.medications,
            'medical_conditions': child.medical_conditions,
            'emergency_contact': child.emergency_contact,
            'doctor_name': child.doctor_name,
            'doctor_contact': child.doctor_contact
        }
        
        new_child = child_service.create_child(child_data, current_user['id'])
        
        return FirestoreAPIResponse(
            success=True,
            message="Child profile created successfully",
            data={"child_id": new_child['id']}
        )
        
    except Exception as e:
        logger.error(f"Failed to create child profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create child profile"
        )

@router.get("/children", response_model=List[FirestoreChildResponse])
def get_user_children(
    current_user: dict = Depends(get_current_user)
):
    """Get all children for the current user."""
    try:
        children = child_service.get_children_by_parent(current_user['id'])
        
        # Convert to ChildResponse format
        child_responses = []
        for child in children:
            child_response = FirestoreChildResponse(
                id=child['id'],
                parent_id=child['parent_id'],
                name=child['name'],
                date_of_birth=child['date_of_birth'],
                gender=child['gender'],
                known_allergies=child['known_allergies'],
                medications=child['medications'],
                medical_conditions=child['medical_conditions'],
                emergency_contact=child['emergency_contact'],
                doctor_name=child['doctor_name'],
                doctor_contact=child['doctor_contact'],
                created_at=child['created_at'],
                updated_at=child['updated_at']
            )
            child_responses.append(child_response)
        
        return child_responses
        
    except Exception as e:
        logger.error(f"Failed to get children for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve children"
        )

@router.get("/children/{child_id}", response_model=FirestoreChildResponse)
def get_child_profile(
    child_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific child profile."""
    try:
        child = child_service.get_child_by_id(child_id, current_user['id'])
        
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        return FirestoreChildResponse(
            id=child['id'],
            parent_id=child['parent_id'],
            name=child['name'],
            date_of_birth=child['date_of_birth'],
            gender=child['gender'],
            known_allergies=child['known_allergies'],
            medications=child['medications'],
            medical_conditions=child['medical_conditions'],
            emergency_contact=child['emergency_contact'],
            doctor_name=child['doctor_name'],
            doctor_contact=child['doctor_contact'],
            created_at=child['created_at'],
            updated_at=child['updated_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get child {child_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve child profile"
        )

@router.put("/children/{child_id}", response_model=FirestoreAPIResponse)
def update_child_profile(
    child_id: str,
    child_update: FirestoreChildUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a child profile."""
    try:
        # Convert to dict, excluding unset values
        update_data = {}
        for field, value in child_update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        updated_child = child_service.update_child(child_id, current_user['id'], update_data)
        
        if not updated_child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        return FirestoreAPIResponse(
            success=True,
            message="Child profile updated successfully",
            data={"child_id": updated_child['id']}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update child {child_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update child profile"
        )

@router.delete("/children/{child_id}", response_model=FirestoreAPIResponse)
def delete_child_profile(
    child_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a child profile."""
    try:
        success = child_service.delete_child(child_id, current_user['id'])
        
        if not success:
            raise HTTPException(status_code=404, detail="Child not found")
        
        return FirestoreAPIResponse(
            success=True,
            message="Child profile deleted successfully",
            data={"child_id": child_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete child {child_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete child profile"
        )
