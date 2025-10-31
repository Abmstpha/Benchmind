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
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,https://benchmind.vercel.app,https://benchmind-frontend.onrender.com,https://benchmind.netlify.app"
    
    # Environment
    environment: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    # API Keys
    mistral_api_key: str = ""
    gemini_api_key: str = ""  # For main agent
    google_api_key: str = ""  # For search sub-agent

    # Database Configuration
    database_url: str = ""
    
    # JWT Authentication
    jwt_secret: str = ""
    jwt_exp_seconds: int = 345600  # 4 days
    
    # Email Configuration
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@benchmind.ai"
    
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
