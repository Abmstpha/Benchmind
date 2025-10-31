from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import Profile, OTP
from ..routers.user import get_current_user
from ..utils.auth_utils import send_otp_email, generate_otp
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import hashlib
import hmac

router = APIRouter(prefix="/settings", tags=["settings"])


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None


class ChangeEmailRequest(BaseModel):
    new_email: EmailStr


class ChangePasswordRequest(BaseModel):
    new_password: str


class VerifyChangeRequest(BaseModel):
    code: str
    new_email: str | None = None


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.put("")
def update_profile(
    request: UpdateProfileRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile name and/or email"""
    user_email = token_data.get("sub")
    
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if request.name is not None:
        profile.name = request.name
    
    if request.email is not None:
        existing = db.query(Profile).filter(
            Profile.email == request.email.lower(),
            Profile.id != profile.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        profile.email = request.email.lower()
    
    db.commit()
    db.refresh(profile)
    
    return {
        "message": "Profile updated successfully",
        "name": profile.name,
        "email": profile.email
    }


@router.post("/change-email")
async def request_email_change(
    request: ChangeEmailRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request email change - sends OTP to new email"""
    user_email = token_data.get("sub")
    
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    existing = db.query(Profile).filter(Profile.email == request.new_email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )
    
    db.query(OTP).filter(OTP.email == request.new_email.lower()).delete()
    db.commit()
    
    code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otp = OTP(
        email=request.new_email.lower(),
        code=code,
        expires_at=expires_at,
        password_hash=user_email  # Store current email for verification
    )
    db.add(otp)
    db.commit()
    
    await send_otp_email(request.new_email.lower(), code, profile.name or "User")
    
    return {
        "message": "OTP sent to new email address",
        "new_email": request.new_email
    }


@router.post("/verify-email-change")
def verify_email_change(
    request: VerifyChangeRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify OTP and update email"""
    user_email = token_data.get("sub")
    
    if not request.new_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email is required"
        )
    
    # Find valid OTP
    otps = db.query(OTP).filter(
        OTP.email == request.new_email.lower(),
        OTP.verified == False,
        OTP.expires_at > datetime.utcnow()
    ).order_by(OTP.created_at.desc()).all()
    
    if not otps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid OTP found"
        )
    
    otp = None
    for candidate_otp in otps:
        if hmac.compare_digest(candidate_otp.code, request.code) and candidate_otp.password_hash == user_email:
            otp = candidate_otp
            break
    
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Update email
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    profile.email = request.new_email.lower()
    otp.verified = True
    db.commit()
    
    db.query(OTP).filter(
        OTP.email == request.new_email.lower(),
        (OTP.verified == True) | (OTP.expires_at < datetime.utcnow())
    ).delete()
    db.commit()
    
    return {
        "message": "Email updated successfully",
        "new_email": request.new_email
    }


@router.post("/change-password")
async def request_password_change(
    request: ChangePasswordRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request password change - sends OTP to current email"""
    user_email = token_data.get("sub")
    
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    db.query(OTP).filter(OTP.email == user_email).delete()
    db.commit()
    
    code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otp = OTP(
        email=user_email,
        code=code,
        expires_at=expires_at,
        password_hash=hash_password(request.new_password)
    )
    db.add(otp)
    db.commit()
    
    await send_otp_email(user_email, code, profile.name or "User")
    
    return {
        "message": "OTP sent to your email"
    }


@router.post("/verify-password-change")
def verify_password_change(
    request: VerifyChangeRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify OTP and update password"""
    user_email = token_data.get("sub")
    
    # Find valid OTP
    otps = db.query(OTP).filter(
        OTP.email == user_email,
        OTP.verified == False,
        OTP.expires_at > datetime.utcnow()
    ).order_by(OTP.created_at.desc()).all()
    
    if not otps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid OTP found"
        )
    
    otp = None
    for candidate_otp in otps:
        if hmac.compare_digest(candidate_otp.code, request.code):
            otp = candidate_otp
            break
    
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    otp.verified = True
    db.commit()
    
    db.query(OTP).filter(
        OTP.email == user_email,
        (OTP.verified == True) | (OTP.expires_at < datetime.utcnow())
    ).delete()
    db.commit()
    
    return {
        "message": "Password updated successfully"
    }
