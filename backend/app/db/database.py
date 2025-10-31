import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Try main database first, fallback to SQLite for development
SQLALCHEMY_DATABASE_URL = settings.database_url

# If no database URL or connection fails, use local SQLite
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./benchmind_dev.db"
    print("⚠️  No DATABASE_URL found, using local SQLite: benchmind_dev.db")

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Test the connection
    with engine.connect() as conn:
        pass
    print(f"✅ Connected to database: {SQLALCHEMY_DATABASE_URL}")
except Exception as e:
    print(f"❌ Failed to connect to {SQLALCHEMY_DATABASE_URL}: {e}")
    print("🔄 Falling back to local SQLite database...")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./benchmind_dev.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Create tables if using SQLite (for development)
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    print("🔧 Creating SQLite tables...")
    from . import models  # Import models to register them
    Base.metadata.create_all(bind=engine)
    print("✅ SQLite tables created successfully")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
