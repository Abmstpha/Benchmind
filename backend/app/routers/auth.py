from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import Profile, OTP
from ..schemas.auth import UserCreate, UserLogin, Token, OTPRequest
from ..utils.auth_utils import create_token, send_otp_email, generate_otp
from datetime import datetime, timedelta
import hashlib
import hmac

# Simple password hashing with SHA256
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(password), hashed)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(signup_request: UserCreate, db: Session = Depends(get_db)):
    print(f"🔍 Signup request for: {signup_request.email}")
    """
    Step 1: User enters email + password for signup, system sends OTP.
    """
    # Check if already registered
    existing_profile = db.query(Profile).filter(
        Profile.email == signup_request.email.lower()
    ).first()
    
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use login instead."
        )
    
    # Thread-safe cleanup of expired OTPs + existing OTPs for this email
    try:
        # Clean all expired OTPs globally
        expired_count = db.query(OTP).filter(
            OTP.expires_at < datetime.utcnow()
        ).delete(synchronize_session=False)
        
        # Clean existing OTPs for this email (prevent spam)
        existing_count = db.query(OTP).filter(
            OTP.email == signup_request.email.lower()
        ).delete(synchronize_session=False)
        
        db.commit()
        if expired_count > 0:
            print(f"🧹 Auto-cleaned {expired_count} expired OTPs")
        if existing_count > 0:
            print(f"🧹 Cleaned {existing_count} existing OTPs for {signup_request.email}")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Cleanup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database cleanup failed"
        )
    
    # Generate OTP (don't create student yet!)
    code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Save OTP to database with hashed password for later use
    otp = OTP(
        email=signup_request.email.lower(),
        code=code,
        expires_at=expires_at,
        password_hash=hash_password(signup_request.password)  # Store hashed password temporarily
    )
    db.add(otp)
    db.commit()
    
    # Send OTP email
    await send_otp_email(signup_request.email.lower(), code, "User")
    
    return {
        "message": "OTP sent to your email",
        "email": signup_request.email
    }


@router.post("/verify-signup")
def verify_signup(request: OTPRequest, db: Session = Depends(get_db)):
    # Thread-safe cleanup of expired OTPs (runs on each request)
    try:
        expired_count = db.query(OTP).filter(
            OTP.expires_at < datetime.utcnow()
        ).delete(synchronize_session=False)
        if expired_count > 0:
            db.commit()
            print(f"🧹 Auto-cleaned {expired_count} expired OTPs")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Cleanup failed (non-critical): {e}")
        # Continue with verification even if cleanup fails
    """
    Step 2: Student enters OTP code to verify email and create account.
    """
    # Find valid OTP (get all unverified OTPs for secure comparison)
    otps = db.query(OTP).filter(
        OTP.email == request.email.lower(),
        OTP.verified == False,
        OTP.expires_at > datetime.utcnow()
    ).order_by(OTP.created_at.desc()).all()
    
    # Secure OTP comparison using hmac.compare_digest
    valid_otp = None
    for otp in otps:
        if hmac.compare_digest(otp.code, request.code):
            valid_otp = otp
            break
    
    if not valid_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    otp = valid_otp
    
    # Check if profile already exists
    existing_profile = db.query(Profile).filter(
        Profile.email == request.email.lower()
    ).first()
    
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists"
        )
    
    # Create the profile
    profile = Profile(
        email=request.email.lower()
    )
    db.add(profile)
    
    # Mark OTP as verified
    otp.verified = True
    db.commit()
    
    # Clean up verified/expired OTPs
    db.query(OTP).filter(
        OTP.email == request.email.lower(),
        (OTP.verified == True) | (OTP.expires_at < datetime.utcnow())
    ).delete()
    db.commit()
    
    return {
        "message": "Account created and verified! You can now login.",
        "email": request.email
    }


@router.post("/login", response_model=Token)
def login(request: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email + password.
    """
    # Get profile
    profile = db.query(Profile).filter(
        Profile.email == request.email.lower()
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid email or password"
        )
    
    # Generate token
    token = create_token(str(profile.id), profile.email, profile.email)
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/reset-password")
async def reset_password(request: UserCreate, db: Session = Depends(get_db)):
    """
    Password reset: Send OTP to existing user for password change.
    """
    # Check if profile exists
    profile = db.query(Profile).filter(
        Profile.email == request.email.lower()
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email"
        )
    
    # Clean existing OTPs for this email
    db.query(OTP).filter(OTP.email == request.email.lower()).delete()
    db.commit()
    
    # Generate OTP for password reset
    code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Save OTP with new password hash
    otp = OTP(
        email=request.email.lower(),
        code=code,
        expires_at=expires_at,
        password_hash=hash_password(request.password)
    )
    db.add(otp)
    db.commit()
    
    # Send OTP email
    await send_otp_email(request.email.lower(), code, "User")
    
    return {
        "message": "Password reset OTP sent to your email",
        "email": request.email
    }


@router.post("/verify-reset")
def verify_reset(request: OTPRequest, db: Session = Depends(get_db)):
    """
    Verify OTP and update password.
    """
    # Find valid OTP
    otps = db.query(OTP).filter(
        OTP.email == request.email.lower(),
        OTP.verified == False,
        OTP.expires_at > datetime.utcnow()
    ).order_by(OTP.created_at.desc()).all()
    
    if not otps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid OTP found. Please request a new one."
        )
    
    # Verify OTP code
    otp = None
    for candidate_otp in otps:
        if hmac.compare_digest(candidate_otp.code, request.code):
            otp = candidate_otp
            break
    
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Get existing profile
    profile = db.query(Profile).filter(
        Profile.email == request.email.lower()
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Mark OTP as verified and clean up
    otp.verified = True
    db.commit()
    
    # Clean up all OTPs for this email
    db.query(OTP).filter(
        OTP.email == request.email.lower(),
        (OTP.verified == True) | (OTP.expires_at < datetime.utcnow())
    ).delete()
    db.commit()
    
    return {
        "message": "Password reset successful",
        "email": request.email
    }
