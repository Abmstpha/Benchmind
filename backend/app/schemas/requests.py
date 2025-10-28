"""
Request schemas for Benchmind API
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AIConsultantRequest(BaseModel):
    """Request schema for AI consultant endpoint."""
    task_description: str = Field(..., description="Description of the AI task to be solved")
    user_context: Optional[str] = Field(None, description="Additional context about user requirements")
    selected_models: List[str] = Field(
        default=["mistral-large-latest", "mistral-tiny", "mistral-small"],
        description="List of model IDs to compare"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "task_description": "I want to build a recommendation system for my e-commerce platform",
                "user_context": "Budget constraints, need fast response times",
                "selected_models": ["mistral-large-latest", "mistral-small", "mistral-tiny"]
            }
        }
