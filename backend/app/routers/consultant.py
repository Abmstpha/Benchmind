"""
AI Consultant router - Direct ReAct Agent implementation without service wrapper layer.
"""

import logging
from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException

from ..agents.agent import create_consultant_agent
from ..schemas.requests import AIConsultantRequest
from ..schemas.responses import AIConsultantResponse
from ..core.config import settings

router = APIRouter(prefix="/ai-consultant", tags=["ai-consultant"])

# Set up logging
consultant_logger = logging.getLogger("benchmind.consultant")
consultant_logger.setLevel(logging.DEBUG)
if not consultant_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    consultant_logger.addHandler(handler)

# Initialize the ReAct agent ONCE
react_agent = None
try:
    react_agent = create_consultant_agent(settings.default_gemini_model)
    consultant_logger.info("✅ ReAct agent initialized successfully")
except Exception as e:
    consultant_logger.error(f"❌ Failed to initialize ReAct agent: {e}")


@router.post("/", response_model=AIConsultantResponse)
async def get_ai_recommendation(request: AIConsultantRequest):
    """Get intelligent AI model recommendation using DIRECT ReAct agent - NO WRAPPER!"""
    
    consultant_logger.info("🚀 DIRECT REACT AGENT REQUEST STARTED")
    consultant_logger.info(f"📋 Task: {request.task_description}")
    consultant_logger.info(f"🤖 Selected models: {request.selected_models}")
    consultant_logger.info(f"📝 User context: {request.user_context}")
    
    if not react_agent:
        consultant_logger.error("❌ ReAct agent not available")
        raise HTTPException(status_code=500, detail="AI Consultant not available")
    
    try:
        # Prepare the prompt for ReAct agent
        consultant_logger.info("🔧 Preparing ReAct agent prompt...")
        prompt_parts = [request.task_description]
        if request.user_context:
            prompt_parts.append(f"Additional context: {request.user_context}")
        prompt_parts.append(f"Please compare these specific models: {', '.join(request.selected_models)}")
        
        full_prompt = "\n\n".join(prompt_parts)
        consultant_logger.info(f"📝 Full prompt prepared ({len(full_prompt)} chars)")
        
        consultant_logger.info("🧠 Invoking ReAct agent DIRECTLY (no wrapper)...")
        
        # Call ReAct agent DIRECTLY
        result = react_agent.invoke({
            "messages": [{"role": "user", "content": full_prompt}]
        })
        
        consultant_logger.info("✅ ReAct agent invocation completed")
        consultant_logger.info(f"📊 Agent result type: {type(result)}")
        consultant_logger.info(f"📊 Agent result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        # Extract response from ReAct agent
        messages = result.get("messages", [])
        if messages:
            final_message = messages[-1]
            raw_content = final_message.content if hasattr(final_message, 'content') else str(final_message)
            
            # Handle complex response formats
            if isinstance(raw_content, list) and len(raw_content) > 0:
                if isinstance(raw_content[0], dict) and 'text' in raw_content[0]:
                    recommendation = raw_content[0]['text']
                else:
                    recommendation = str(raw_content[0])
            else:
                recommendation = str(raw_content)
        else:
            recommendation = "ReAct agent completed but no recommendation generated."
        
        # Extract benchmark results from agent tools (if any)
        benchmark_results = []
        for message in messages:
            if hasattr(message, 'tool_calls') and message.tool_calls:
                for tool_call in message.tool_calls:
                    if tool_call.get('name') == 'benchmark_models_for_task':
                        try:
                            import json
                            tool_result = tool_call.get('result', '[]')
                            if isinstance(tool_result, str):
                                parsed_results = json.loads(tool_result)
                                if isinstance(parsed_results, list):
                                    benchmark_results.extend(parsed_results)
                        except Exception as e:
                            consultant_logger.warning(f"Failed to parse benchmark results: {e}")
        
        consultant_logger.info("🎉 DIRECT REACT AGENT REQUEST COMPLETED")
        
        return {
            "success": True,
            "task": request.task_description,
            "recommendation": recommendation,
            "reasoning_steps": result.get("reasoning_steps", []),
            "benchmark_results": benchmark_results,
            "timestamp": datetime.now().isoformat(),
            "consultant_version": "3.0-DIRECT-REACT"
        }
        
    except Exception as e:
        consultant_logger.error(f"💥 DIRECT REACT AGENT FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"ReAct agent failed: {str(e)}")
