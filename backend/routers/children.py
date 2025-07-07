"""
API router for HIPAA-compliant child profile management.

This router provides secure endpoints for managing child profiles and related
patient data with full HIPAA compliance and audit logging.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import List, Optional
from datetime import date
import logging

from models.firestore_models import CreateChildRequest, ChildResponse, SymptomLogEntry
from services.firestore_service import firestore_service
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/children", tags=["children"])
security = HTTPBearer()

@router.post("/", response_model=ChildResponse)
async def create_child(
    child_data: CreateChildRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new child profile with HIPAA compliance.
    
    This endpoint creates a comprehensive child profile including:
    - Basic demographic information
    - Medical history and allergies
    - Current medications
    - Emergency contacts and healthcare providers
    - HIPAA consent tracking
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        # Create child profile in Firestore
        child_response = await firestore_service.create_child_profile(user_id, child_data)
        
        logger.info(f"Child profile created successfully: {child_response.child_id}")
        return child_response
        
    except PermissionError as e:
        logger.warning(f"Permission denied for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    except ValueError as e:
        logger.warning(f"Invalid data for child creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to create child profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create child profile"
        )

@router.get("/", response_model=List[ChildResponse])
async def get_children(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all children profiles for the authenticated user.
    
    Returns a list of child profiles that the user has access to,
    with basic information and calculated age data.
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        children = await firestore_service.get_user_children(user_id)
        
        logger.info(f"Retrieved {len(children)} children for user {user_id}")
        return children
        
    except Exception as e:
        logger.error(f"Failed to get children for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve children profiles"
        )

@router.get("/{child_id}")
async def get_child_profile(
    child_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed child profile information.
    
    Returns comprehensive child profile including:
    - Medical history and conditions
    - Current medications and allergies
    - Emergency contacts and healthcare providers
    - Privacy and consent settings
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        child_profile = await firestore_service.get_child_profile(user_id, child_id)
        
        if not child_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child profile not found"
            )
        
        return child_profile
        
    except PermissionError:
        logger.warning(f"Permission denied for user {user_id} accessing child {child_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to child profile"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get child profile {child_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve child profile"
        )

@router.put("/{child_id}")
async def update_child_profile(
    child_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update child profile information.
    
    Allows updating medical information, emergency contacts,
    and other profile data with full audit logging.
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        # Remove sensitive fields that shouldn't be updated directly
        sensitive_fields = ['child_id', 'parent_user_id', 'created_at', 'encryption_key_id']
        for field in sensitive_fields:
            update_data.pop(field, None)
        
        success = await firestore_service.update_child_profile(user_id, child_id, update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child profile not found"
            )
        
        return {"message": "Child profile updated successfully"}
        
    except PermissionError:
        logger.warning(f"Permission denied for user {user_id} updating child {child_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to child profile"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update child profile {child_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update child profile"
        )

@router.delete("/{child_id}")
async def delete_child_profile(
    child_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Soft delete a child profile (HIPAA compliant).
    
    Performs a soft delete by marking the profile as deleted
    while maintaining data for audit and recovery purposes.
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        success = await firestore_service.delete_child_profile(user_id, child_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child profile not found"
            )
        
        return {"message": "Child profile deleted successfully"}
        
    except PermissionError:
        logger.warning(f"Permission denied for user {user_id} deleting child {child_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to child profile"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete child profile {child_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete child profile"
        )

@router.post("/{child_id}/symptom-logs")
async def create_symptom_log(
    child_id: str,
    symptom_log: SymptomLogEntry,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new symptom log entry for a child.
    
    Records detailed symptom information, triggers, medications,
    and environmental data with full HIPAA compliance.
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        # Ensure the child_id matches
        symptom_log.child_id = child_id
        
        log_id = await firestore_service.create_symptom_log(user_id, symptom_log)
        
        return {"message": "Symptom log created successfully", "log_id": log_id}
        
    except PermissionError:
        logger.warning(f"Permission denied for user {user_id} creating symptom log for child {child_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to child profile"
        )
    except ValueError as e:
        logger.warning(f"Invalid symptom log data: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to create symptom log for child {child_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create symptom log"
        )

@router.get("/{child_id}/symptom-logs")
async def get_symptom_logs(
    child_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get symptom logs for a child with optional date filtering.
    
    Returns chronologically ordered symptom logs with comprehensive
    symptom tracking, environmental data, and medication information.
    """
    try:
        user_id = current_user.get("sub") or current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user authentication"
            )
        
        logs = await firestore_service.get_child_symptom_logs(
            user_id, child_id, start_date, end_date
        )
        
        return {"logs": logs, "count": len(logs)}
        
    except PermissionError:
        logger.warning(f"Permission denied for user {user_id} accessing symptom logs for child {child_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to child profile"
        )
    except Exception as e:
        logger.error(f"Failed to get symptom logs for child {child_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve symptom logs"
        )

# Test endpoint for development (remove in production)
@router.post("/test", response_model=ChildResponse)
async def create_child_test(child_data: CreateChildRequest):
    """
    Test endpoint for creating child profiles without authentication.
    
    WARNING: This endpoint should only be used for development testing
    and must be removed or disabled in production environments.
    """
    try:
        # Use a test user ID for development
        test_user_id = "test_user_123"
        
        # Create child profile in Firestore
        child_response = await firestore_service.create_child_profile(test_user_id, child_data)
        
        logger.info(f"Test child profile created successfully: {child_response.child_id}")
        return child_response
        
    except Exception as e:
        logger.error(f"Failed to create child profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create child profile: {str(e)}"
        )

@router.get("/test", response_model=List[ChildResponse])
async def list_children_test():
    """
    Test endpoint for listing children without authentication.
    
    WARNING: This endpoint should only be used for development testing.
    """
    try:
        test_user_id = "test_user_123"
        children = await firestore_service.get_user_children(test_user_id)
        return children
        
    except Exception as e:
        logger.error(f"Failed to list children: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list children: {str(e)}"
        )

# Health check endpoint for monitoring
@router.get("/health/firestore")
async def firestore_health_check():
    """
    Health check endpoint for Firestore connectivity.
    
    Used for monitoring the Firebase/Firestore connection status
    and HIPAA compliance validation.
    """
    try:
        # Simple connectivity test
        from config.firebase_config import get_firestore_client, validate_hipaa_compliance
        
        db = get_firestore_client()
        # Test basic connectivity
        test_doc = db.collection('health_check').document('test').get()
        
        # Validate HIPAA compliance
        validate_hipaa_compliance()
        
        return {
            "status": "healthy",
            "firestore_connected": True,
            "hipaa_compliant": True,
            "timestamp": str(date.today())
        }
        
    except Exception as e:
        logger.error(f"Firestore health check failed: {e}")
        return {
            "status": "unhealthy",
            "firestore_connected": False,
            "hipaa_compliant": False,
            "error": str(e),
            "timestamp": str(date.today())
        }
