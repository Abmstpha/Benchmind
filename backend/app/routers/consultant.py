"""
AI Consultant router - Direct ReAct Agent implementation without service wrapper layer.
"""

import logging
import asyncio
from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types

from ..agents.adk_green_agent import create_consultant_agent
from ..schemas.requests import AIConsultantRequest
from ..schemas.responses import AIConsultantResponse
from ..core.config import settings
from ..db.database import get_db
from ..db.models import Profile
from ..routers.user import get_current_user

router = APIRouter(prefix="/ai-consultant", tags=["ai-consultant"])

consultant_logger = logging.getLogger("benchmind.consultant")

react_agent = None
try:
    react_agent = create_consultant_agent(settings.default_gemini_model)
except Exception as e:
    consultant_logger.error(f"❌ Failed to initialize ReAct agent: {e}")


@router.post("/", response_model=AIConsultantResponse)
async def get_ai_recommendation(
    request: AIConsultantRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get intelligent AI model recommendation using PARALLEL agents - benchmarking + search!

    """
    
    # Get user profile and check credits
    user_email = token_data.get("sub")
    profile = db.query(Profile).filter(Profile.email == user_email).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile.credits < 1:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits. You need at least 1 credit to make a consultation request."
        )
    
    # Deduct 1 credit
    profile.credits -= 1
    db.commit()
    
    
    if not react_agent:
        raise HTTPException(status_code=500, detail="AI Consultant not available")
    
    try:
        prompt_parts = [request.task_description]
        if request.user_context:
            prompt_parts.append(f"Additional context: {request.user_context}")
        prompt_parts.append(f"Please compare these specific models: {', '.join(request.selected_models)}")
        
        full_prompt = "\n\n".join(prompt_parts)
        
        
        
        session_service = InMemorySessionService()
        session = await session_service.create_session(
            user_id="benchmind-user",
            app_name="benchmind"
        )
        
        runner = Runner(
            agent=react_agent, 
            session_service=session_service,
            app_name="benchmind"
        )
        
        run_config = RunConfig(streaming_mode=StreamingMode.SSE)
        
        message = types.Content(
            role='user',
            parts=[types.Part.from_text(text=full_prompt)]
        )
        
        
        final_response = None
        all_events = []
        event_count = 0
        
        try:
            for event in runner.run(
                new_message=message,
                user_id="benchmind-user",
                session_id=session.id,
                run_config=run_config
            ):
                event_count += 1
                all_events.append(event)
                
                if hasattr(event, 'content') and event.content:
                    if hasattr(event.content, 'parts') and event.content.parts:
                        for i, part in enumerate(event.content.parts):
                            if hasattr(part, 'text') and part.text:
                                if final_response is None:
                                    final_response = ""
                                final_response += part.text
                
        except Exception as agent_error:
            consultant_logger.error(f"Agent event loop failed: {type(agent_error).__name__}: {agent_error}")
        
        if not final_response:
            consultant_logger.error("No final response extracted from agent")
        
        recommendation = final_response if final_response else "No response from agent"
        
        
        
        async def run_search_agent():
            """Run search agent independently"""
            try:
                from ..agents.adk_search_agent import search_model_benchmarks
                result = await search_model_benchmarks(request.selected_models)
                return result if result else "No search results found"
            except Exception as e:
                consultant_logger.error(f"Search agent failed: {e}")
                return "No search results found"
        
        async def run_benchmarking_agent():
            """Run benchmarking agent independently"""
            try:
                from ..tools.tools import benchmark_models_for_task
                import json
                
                models_str = ",".join(request.selected_models)
                task_desc = f"Benchmarking for: {request.task_description}"
                test_prompt = f"Analyze this text: {request.task_description}"
                
                
                loop = asyncio.get_event_loop()
                tool_result = await loop.run_in_executor(
                    None,
                    benchmark_models_for_task,
                    task_desc,
                    models_str,
                    test_prompt,
                    "medium"
                )
                
                
                if isinstance(tool_result, str):
                    try:
                        parsed_results = json.loads(tool_result)
                        
                        return parsed_results
                    except json.JSONDecodeError as je:
                        consultant_logger.error(f"Benchmark agent JSON decode error: {je}")
                        return []
                else:
                    consultant_logger.error(f"Benchmark agent invalid result type: {type(tool_result)}")
                    return []
            except Exception as e:
                consultant_logger.error(f"Benchmark agent failed: {e}")
                return []
        
        web_insights, benchmark_results = await asyncio.gather(
            run_search_agent(),
            run_benchmarking_agent(),
            return_exceptions=False
        )
        
                
        if not benchmark_results:
            
            # Try calling the benchmarking tool directly as a last resort
            try:
                from ..tools.tools import benchmark_models_for_task
                import json
                
                models_str = ",".join(request.selected_models)
                task_desc = f"Benchmarking for: {request.task_description}"
                test_prompt = f"Analyze this text: {request.task_description}"
                
                direct_result = benchmark_models_for_task(task_desc, models_str, test_prompt, "medium")
                
                if isinstance(direct_result, str):
                    fallback_results = json.loads(direct_result)
                    benchmark_results = fallback_results
                else:
                    raise ValueError(f"Invalid result type: {type(direct_result)}")
                    
            except Exception as fallback_error:
                consultant_logger.error(f"Fallback direct tool call failed: {fallback_error}")
                
                # Try to fetch recent data from database for these models
                try:
                    from ..db.database import SessionLocal
                    from ..db.models import EcoLogitsMetrics
                    from sqlalchemy import desc
                    
                    db = SessionLocal()
                    recent_results = []
                    
                    for model_id in request.selected_models:
                        # Get the most recent benchmark for this model
                        recent_metric = db.query(EcoLogitsMetrics).filter(
                            EcoLogitsMetrics.model_id == model_id
                        ).order_by(desc(EcoLogitsMetrics.id)).first()
                        
                        if recent_metric:
                            recent_results.append({
                                "model_id": recent_metric.model_id,
                                "model_name": recent_metric.model_name,
                                "cost_usd": float(recent_metric.cost_usd),
                                "latency_ms": recent_metric.latency_ms,
                                "co2_g": float(recent_metric.co2_g),
                                "energy_wh": float(recent_metric.energy_wh),
                                "tokens_used": 100  # Approximate
                            })
                    
                    db.close()
                    
                    if recent_results:
                        benchmark_results = recent_results
                    else:
                        benchmark_results = []  # Return empty instead of fake data
                        
                except Exception as db_error:
                    consultant_logger.error(f"Database lookup failed: {db_error}")
                    benchmark_results = []  # Return empty instead of fake data
        
        
        if recommendation:
            sections = recommendation.split("SECTION 1:")
            if len(sections) > 2:
                recommendation = "SECTION 1:" + sections[1]
        
        if 'web_insights' not in locals():
            web_insights = None
        
        return {
            "success": True,
            "task": request.task_description,
            "recommendation": recommendation,
            "reasoning_steps": [],  # ADK events don't have explicit reasoning steps like LangGraph
            "benchmark_results": benchmark_results,
            "web_insights": web_insights,  # Latest news/insights from Google Search
            "timestamp": datetime.now().isoformat(),
            "consultant_version": "3.0-ADK-GOOGLE-SEARCH"
        }
        
    except Exception as e:
        import traceback
        consultant_logger.error(f"Direct ReAct agent failed: {e}")
        raise HTTPException(status_code=500, detail=f"ReAct agent failed: {str(e)}")
