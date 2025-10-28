"""
AI Consultant router - handles intelligent model recommendations
"""

from fastapi import APIRouter, Depends, HTTPException

from ..services.consultant_agent import ConsultantAgent
from ..schemas.requests import AIConsultantRequest
from ..schemas.responses import AIConsultantResponse

router = APIRouter(prefix="/ai-consultant", tags=["ai-consultant"])


def get_consultant_agent() -> ConsultantAgent:
    """Dependency to get consultant agent service."""
    return ConsultantAgent()


@router.post("/", response_model=AIConsultantResponse)
async def get_ai_recommendation(
    request: AIConsultantRequest,
    agent: ConsultantAgent = Depends(get_consultant_agent)
):
    """Get intelligent AI model recommendation using ReAct agent."""
    if not agent.is_available():
        raise HTTPException(status_code=500, detail="AI Consultant not available")
    
    return await agent.get_recommendation(
        task_description=request.task_description,
        selected_models=request.selected_models,
        user_context=request.user_context
    )
