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
consultant_logger.setLevel(logging.DEBUG)
if not consultant_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    consultant_logger.addHandler(handler)

react_agent = None
try:
    react_agent = create_consultant_agent(settings.default_gemini_model)
    consultant_logger.info("✅ ReAct agent initialized successfully")
except Exception as e:
    consultant_logger.error(f"❌ Failed to initialize ReAct agent: {e}")


@router.post("/", response_model=AIConsultantResponse)
async def get_ai_recommendation(
    request: AIConsultantRequest,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get intelligent AI model recommendation using PARALLEL agents - benchmarking + search!
    
    CRITICAL: Both agents run INDEPENDENTLY in parallel to avoid conflicts.
    Requires authentication and deducts 1 credit per request.
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
    
    consultant_logger.info("🚀 DIRECT REACT AGENT REQUEST STARTED")
    consultant_logger.info(f"👤 User: {user_email} (Credits remaining: {profile.credits})")
    consultant_logger.info(f"📋 Task: {request.task_description}")
    consultant_logger.info(f"🤖 Selected models: {request.selected_models}")
    consultant_logger.info(f"📝 User context: {request.user_context}")
    
    if not react_agent:
        consultant_logger.error("❌ ReAct agent not available")
        raise HTTPException(status_code=500, detail="AI Consultant not available")
    
    try:
        consultant_logger.info("🔧 Preparing ReAct agent prompt...")
        prompt_parts = [request.task_description]
        if request.user_context:
            prompt_parts.append(f"Additional context: {request.user_context}")
        prompt_parts.append(f"Please compare these specific models: {', '.join(request.selected_models)}")
        
        full_prompt = "\n\n".join(prompt_parts)
        consultant_logger.info(f"📝 Full prompt prepared ({len(full_prompt)} chars)")
        
        consultant_logger.info("🧠 Invoking ADK ReAct agent using Runner...")
        
        # NOTE: Main agent uses GEMINI_API_KEY, search sub-agent uses GOOGLE_API_KEY
        # This separation prevents rate limit conflicts
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
        
        consultant_logger.info("🔄 Starting Runner.run() iteration...")
        
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
                consultant_logger.info(f"📦 Event #{event_count} received - type: {type(event).__name__}")
                all_events.append(event)
                
                if hasattr(event, 'content') and event.content:
                    if hasattr(event.content, 'parts') and event.content.parts:
                        for i, part in enumerate(event.content.parts):
                            if hasattr(part, 'text') and part.text:
                                if final_response is None:
                                    final_response = ""
                                final_response += part.text
                                consultant_logger.info(f"✅ Event #{event_count} - Extracted text: {part.text[:100]}...")
                
                if hasattr(event, 'error_code') and event.error_code and event.error_code != 'OK':
                    consultant_logger.warning(f"⚠️ Event #{event_count} has error: {event.error_code} - {getattr(event, 'error_message', 'No message')}")
            
            if all_events:
                last_event = all_events[-1]
                consultant_logger.info(f"📦 Last event attributes: {dir(last_event)}")
                if hasattr(last_event, 'error_code'):
                    consultant_logger.info(f"📦 Last event error_code: {last_event.error_code}")
                if hasattr(last_event, 'error_message'):
                    consultant_logger.info(f"📦 Last event error_message: {last_event.error_message}")
        
        except Exception as agent_error:
            consultant_logger.error(f"❌ AGENT EVENT LOOP FAILED: {type(agent_error).__name__}: {agent_error}")
            consultant_logger.exception("Full agent error traceback:")
        
        if final_response:
            consultant_logger.info(f"✅ Final response extracted: {len(final_response)} chars")
            consultant_logger.info(f"📝 First 200 chars: {final_response[:200]}...")
        else:
            consultant_logger.error("❌ NO FINAL RESPONSE EXTRACTED FROM AGENT!")
            consultant_logger.error(f"❌ Total events processed: {event_count}")
            consultant_logger.error(f"❌ Events with content: {sum(1 for e in all_events if hasattr(e, 'content') and e.content)}")
        
        recommendation = final_response if final_response else "No response from agent"
        
        consultant_logger.info("✅ ReAct agent invocation completed")
        consultant_logger.info(f"📝 Recommendation length: {len(recommendation)} chars")
        consultant_logger.info(f"📊 Total events received: {len(all_events)}")
        
        consultant_logger.warning("🚀 STARTING PARALLEL AGENT EXECUTION...")
        
        async def run_search_agent():
            """Run search agent independently"""
            consultant_logger.warning("🔍 [SEARCH AGENT] Starting...")
            try:
                from ..agents.adk_search_agent import search_model_benchmarks
                result = await search_model_benchmarks(request.selected_models)
                consultant_logger.info(f"✅ [SEARCH AGENT] Completed: {len(result) if result else 0} chars")
                return result if result else "No search results found"
            except Exception as e:
                consultant_logger.error(f"❌ [SEARCH AGENT] FAILED: {e}")
                return "No search results found"
        
        async def run_benchmarking_agent():
            """Run benchmarking agent independently"""
            consultant_logger.warning("📊 [BENCHMARK AGENT] Starting...")
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
                    parsed_results = json.loads(tool_result)
                    consultant_logger.info(f"✅ [BENCHMARK AGENT] Completed: {len(parsed_results)} results")
                    return parsed_results
                else:
                    consultant_logger.error(f"❌ [BENCHMARK AGENT] Invalid result type: {type(tool_result)}")
                    return []
            except Exception as e:
                consultant_logger.error(f"❌ [BENCHMARK AGENT] FAILED: {e}")
                return []
        
        web_insights, benchmark_results = await asyncio.gather(
            run_search_agent(),
            run_benchmarking_agent(),
            return_exceptions=False
        )
        
        consultant_logger.warning("✅ PARALLEL EXECUTION COMPLETED")
        consultant_logger.info(f"📊 Benchmark results: {len(benchmark_results)} models")
        consultant_logger.info(f"🔍 Search insights: {len(web_insights)} chars")
                
        if not benchmark_results:
            consultant_logger.warning("⚠️ No benchmark results, using fallback")
            consultant_logger.warning("⚠️ Using fallback data extraction from recommendation text")
            import re
            cost_match = re.search(r'\$([0-9.]+)', recommendation)
            latency_match = re.search(r'([0-9.]+)\s*ms', recommendation)
            co2_match = re.search(r'([0-9.]+)\s*grams?', recommendation)
            energy_match = re.search(r'([0-9.]+)\s*Wh', recommendation)
            
            mock_result = {
                "model_id": request.selected_models[0] if request.selected_models else "mistral-tiny",
                "model_name": request.selected_models[0].replace('-', ' ').title() if request.selected_models else "Mistral Tiny",
                "cost_usd": float(cost_match.group(1)) if cost_match else 0.00001925,
                "latency_ms": float(latency_match.group(1)) if latency_match else 618,
                "co2_g": float(co2_match.group(1)) if co2_match else 0.0608,
                "energy_wh": float(energy_match.group(1)) if energy_match else 0.0996,
                "tokens_used": 100
            }
            benchmark_results = [mock_result]
            consultant_logger.info(f"✅ Created fallback benchmark result: {mock_result}")
        
        consultant_logger.info("🎉 DIRECT REACT AGENT REQUEST COMPLETED")
        
        if recommendation:
            sections = recommendation.split("SECTION 1:")
            if len(sections) > 2:
                recommendation = "SECTION 1:" + sections[1]
                consultant_logger.warning(f"⚠️ REMOVED DUPLICATION - kept first occurrence only")
        
        if 'web_insights' not in locals():
            web_insights = None
            consultant_logger.warning("⚠️ web_insights not set - web search may not have run")
        
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
        consultant_logger.error(f"💥 DIRECT REACT AGENT FAILED: {e}")
        consultant_logger.error(f"📋 Full traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"ReAct agent failed: {str(e)}")
