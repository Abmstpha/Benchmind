from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..db.database import get_db
from ..db.models import Profile
from ..utils.auth_utils import verify_token
from pydantic import BaseModel


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and verify bearer token."""
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

router = APIRouter(prefix="/user", tags=["user"])


class UserStatusResponse(BaseModel):
    email: str
    credits: int


@router.get("/status", response_model=UserStatusResponse)
def get_user_status(
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile status"""
    user_email = token_data.get("sub")
    
    # Get profile
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return UserStatusResponse(
        email=profile.email,
        credits=profile.credits
    )
