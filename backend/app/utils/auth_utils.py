from datetime import datetime, timedelta
from typing import Dict, Any
from jose import JWTError, jwt
from ..core.config import settings
import uuid
import random
import string
import hashlib

try:
    import sendgrid
    from sendgrid.helpers.mail import Mail
except Exception:  # pragma: no cover
    sendgrid = None
    Mail = None


def generate_otp() -> str:
    """Generate 6-digit OTP code."""
    return ''.join(random.choices(string.digits, k=6))


async def send_otp_email(email: str, code: str, student_name: str):
    """Send OTP via SendGrid email."""
    # Check if SendGrid is properly configured
    if not settings.sendgrid_api_key or not sendgrid or not Mail:
        # Dev fallback - print to console
        print(f"\n{'='*60}")
        print(f"📧 OTP EMAIL (DEV MODE - SendGrid not configured)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Subject: Your Benchmind OTP Code")
        print(f"\nHello,\n")
        print(f"Your OTP code is: {code}")
        print(f"\nThis code will expire in 5 minutes.")
        print(f"{'='*60}\n")
        return
    
    try:
        print(f"🔑 Using SendGrid API Key: {settings.sendgrid_api_key[:20]}...")
        print(f"📧 From Email: {settings.sendgrid_from_email}")
        
        sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
        message = Mail(
            from_email=settings.sendgrid_from_email,
            to_emails=email,
            subject="Your Benchmind OTP Code",
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Welcome to Benchmind!</h2>
                <p>Hello,</p>
                <p>Thank you for signing up. Please verify your email address by entering this code:</p>
                <div style="background-color: #059669; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #ffffff; font-size: 36px; margin: 0; letter-spacing: 8px;">{code}</h1>
                </div>
                <p>This code will expire in <strong>5 minutes</strong>.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <p>Best regards,<br>The Benchmind Team</p>
            </div>
            """
        )
        response = sg.send(message)
        print(f"✅ SendGrid email sent successfully to {email}: {response.status_code}")
        print(f"📨 Response body: {response.body}")
    except Exception as e:
        # Fallback to console output if SendGrid fails
        print(f"⚠️  SendGrid failed: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"\n{'='*60}")
        print(f"📧 OTP EMAIL (FALLBACK)")
        print(f"{'='*60}")
        print(f"To: {email}")
        print(f"Hello {student_name}, Your OTP code is: {code}")
        print(f"{'='*60}\n")


def create_token(election_id: uuid.UUID, student_email: str, student_name: str) -> str:
    """Create JWT token for voting with JTI replay protection."""
    jti = str(uuid.uuid4())  # Single-use token ID
    payload = {
        "sub": student_email,  # Subject (user identifier)
        "election_id": str(election_id),
        "student_email": student_email,
        "student_name": student_name,
        "jti": jti,  # JWT ID for replay protection
        "iat": int(datetime.utcnow().timestamp()),
        "exp": int((datetime.utcnow() + timedelta(seconds=settings.jwt_exp_seconds)).timestamp())  # Configurable expiry
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode JWT token with clock skew tolerance."""
    try:
        # Allow ±5 minutes clock skew for messy servers
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=["HS256"],
            options={"verify_exp": True, "leeway": 300}  # 5 minutes tolerance
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")
