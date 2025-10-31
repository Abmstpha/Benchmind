"""
Response schemas for Benchmind API
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class ModelsResponse(BaseModel):
    """Response schema for models endpoint."""
    available_models: List[Dict[str, Any]] = Field(..., description="List of available models")
    total_count: int = Field(..., description="Total number of available models")
    providers: List[str] = Field(..., description="List of model providers")


class AIConsultantResponse(BaseModel):
    """Response schema for AI consultant endpoint."""
    success: bool = Field(..., description="Whether the consultation was successful")
    task: str = Field(..., description="The original task description")
    recommendation: Optional[str] = Field(None, description="AI recommendation text")
    reasoning_steps: List[Any] = Field(default=[], description="Agent reasoning steps")
    benchmark_results: List[Dict[str, Any]] = Field(default=[], description="Benchmark results data")
    web_insights: Optional[str] = Field(None, description="Latest insights from web search about the models")
    error: Optional[str] = Field(None, description="Error message if consultation failed")
    fallback_recommendation: Optional[str] = Field(None, description="Fallback recommendation")
    timestamp: str = Field(..., description="Timestamp of the consultation")
    consultant_version: str = Field(..., description="Version of the consultant agent")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "task": "I want to build a recommendation system",
                "recommendation": "Based on your requirements, I recommend...",
                "reasoning_steps": [],
                "benchmark_results": [],
                "timestamp": "2024-10-28T15:00:00Z",
                "consultant_version": "1.0"
            }
        }


class ConsultationResponse(BaseModel):
    """Response schema for a single consultation history entry."""
    id: UUID
    task_description: str
    recommendation_text: Optional[str]
    benchmark_results: Optional[List[Dict[str, Any]]]
    web_insights: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
