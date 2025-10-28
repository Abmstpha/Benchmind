"""
Core configuration for Benchmind API
"""

import os
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic BaseSettings."""
    
    # API Configuration
    app_name: str = "Benchmind API"
    app_version: str = "0.1.0"
    app_description: str = "AI Model Evaluation Platform with Green AI Observability"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # CORS Configuration
    cors_origins: List[str] = [
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001", 
        "http://localhost:3002", "http://127.0.0.1:3002",
        "http://localhost:3003", "http://127.0.0.1:3003"
    ]
    
    # API Keys
    mistral_api_key: str = ""
    gemini_api_key: str = ""
    
    # Model Configuration
    default_gemini_model: str = "models/gemini-2.5-flash"
    
    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env


# Global settings instance
settings = Settings()
