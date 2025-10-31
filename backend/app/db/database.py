import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Use only the configured database URL - NO FALLBACK
SQLALCHEMY_DATABASE_URL = settings.database_url

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is required! Please set it in your .env file.")

print(f"🔍 Setting up database engine: {SQLALCHEMY_DATABASE_URL[:50]}...")

# Configure engine based on database type
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Production PostgreSQL configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_timeout=30,
        pool_recycle=3600,
        pool_pre_ping=True,
        connect_args={
            "connect_timeout": 30,
            "application_name": "benchmind_backend"
        }
    )
else:
    # Development SQLite configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

print(f"✅ Database engine configured (will connect on first use)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        try:
            db.close()
        except Exception as e:
            # Log the error but don't raise it to prevent breaking the response
            print(f"⚠️ Database cleanup error (non-critical): {e}")
            pass
