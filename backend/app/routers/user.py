from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..db.database import get_db
from ..db.models import Profile
from ..utils.auth_utils import verify_token
from pydantic import BaseModel


def get_current_user_token(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and verify bearer token - returns token data."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        return verify_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


def get_current_user(
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
) -> Profile:
    """Get current user Profile object from token."""
    user_email = token_data.get("sub")
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get profile from database
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return profile

router = APIRouter(prefix="/user", tags=["user"])
profile_router = APIRouter(prefix="/profile", tags=["profile"])


class UserStatusResponse(BaseModel):
    email: str
    name: str | None = None
    credits: int


@router.get("/status", response_model=UserStatusResponse)
def get_user_status(
    profile: Profile = Depends(get_current_user)
):
    """Get current user's profile status"""
    return UserStatusResponse(
        email=profile.email,
        name=profile.name,
        credits=profile.credits
    )


@profile_router.get("", response_model=UserStatusResponse)
def get_profile(
    profile: Profile = Depends(get_current_user)
):
    """Get user profile information"""
    return UserStatusResponse(
        email=profile.email,
        name=profile.name,
        credits=profile.credits
    )
