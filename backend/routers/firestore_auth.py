"""
Firestore-based authentication router - replacing SQLAlchemy auth.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
import logging

from schemas.firestore_schemas import (
    FirestoreUserCreate, FirestoreUserResponse, Token, FirestoreAPIResponse
)
from services.firestore_users import FirestoreUserService
from utils.firestore_auth import (
    create_access_token, verify_token, get_password_hash, 
    verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
)

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Initialize Firestore service
user_service = FirestoreUserService()

@router.post("/register", response_model=FirestoreAPIResponse)
def register_user(user: FirestoreUserCreate):
    """Register a new user using Firestore."""
    try:
        # Check if user already exists
        existing_user = user_service.get_user_by_email(user.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = get_password_hash(user.password)
        new_user = user_service.create_user(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name
        )
        
        return FirestoreAPIResponse(
            success=True,
            message="User registered successfully",
            data={"user_id": new_user['id']}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return access token."""
    try:
        # Get user by email
        user = user_service.get_user_by_email(form_data.username)
        
        if not user or not verify_password(form_data.password, user['hashed_password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.get('is_active', False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user['email'], "user_id": user['id']},
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Login failed"
        )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token using Firestore."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        email = payload.get("sub")
        user_id = payload.get("user_id")
        
        if email is None or user_id is None:
            raise credentials_exception
            
    except Exception:
        raise credentials_exception
    
    # Get user from Firestore
    user = user_service.get_user_by_email(email)
    if user is None:
        raise credentials_exception
    
    if not user.get('is_active', False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    return user

@router.get("/me", response_model=FirestoreUserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return FirestoreUserResponse(
        id=current_user['id'],
        email=current_user['email'],
        full_name=current_user['full_name'],
        is_active=current_user['is_active'],
        created_at=current_user['created_at']
    )

@router.get("/verify", response_model=FirestoreAPIResponse)
async def verify_token_endpoint(current_user: dict = Depends(get_current_user)):
    """Verify if token is valid."""
    return FirestoreAPIResponse(
        success=True,
        message="Token is valid",
        data={
            "user_id": current_user['id'],
            "email": current_user['email']
        }
    )
