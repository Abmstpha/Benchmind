from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from .database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    credits = Column(Integer, default=100)

class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    task_description = Column(String, nullable=False)
    recommendation_text = Column(String)
    benchmark_results = Column(JSON)
    web_insights = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SearchCache(Base):
    __tablename__ = "search_cache"
    cache_key = Column(String, primary_key=True, index=True)
    result_text = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OTP(Base):
    __tablename__ = "otps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified = Column(Boolean, default=False)
