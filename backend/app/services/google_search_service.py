"""
Google Search Service - Quality analysis via web search
"""

import logging
import asyncio
from typing import List, Dict, Any

logger = logging.getLogger("benchmind.google_search_service")

class GoogleSearchService:
    """Service for Google search quality analysis"""
    
    async def analyze_quality(self, task_description: str, model_ids: List[str]) -> Dict[str, Any]:
        """
        Search web for quality benchmarks - runs in parallel
        """
        # Create cache key from task + models
        cache_key = f"quality_{hash(task_description + ''.join(sorted(model_ids)))}"
        
        # Check cache first
        from ..db.database import SessionLocal
        from ..db.models import SearchCache
        db = SessionLocal()
        
        try:
            cached = db.query(SearchCache).filter(SearchCache.cache_key == cache_key).first()
            if cached:
                logger.info(f"🎯 Cache HIT for quality analysis: {cache_key}")
                import json
                return json.loads(cached.result_text)
        except Exception as e:
            logger.warning(f"Cache check failed: {e}")
        finally:
            db.close()
        
        logger.info(f"🔍 Cache MISS - Analyzing quality for {len(model_ids)} models via Google search")
        
        # Run REAL search agent for quality analysis
        try:
            from ..agents.adk_search_agent import create_google_search_agent
            
            # Create search agent
            search_agent = create_google_search_agent(enable_search=True)
            
            if search_agent:
                logger.info("🤖 Running Google Search agent for quality analysis...")
                
                # Create search prompt for quality analysis
                search_prompt = f"""
Research the quality and performance of these AI models for the task: {task_description}

Models to research: {', '.join(model_ids)}

Please search the internet and provide:
1. Performance benchmarks from academic papers or leaderboards
2. Real-world usage reports and comparisons
3. Specific metrics relevant to: {task_description}
4. Any known limitations or strengths

Format your response as a comprehensive analysis with sources and URLs.
Do NOT make up data - only use real information you find online.
"""
                
                # Run the search agent using Runner (correct ADK pattern)
                from google.adk.runners import Runner
                from google.adk.sessions.in_memory_session_service import InMemorySessionService
                from google.genai import types
                
                session_service = InMemorySessionService()
                session = await session_service.create_session(user_id='benchmind', app_name='benchmind')
                runner = Runner(agent=search_agent, session_service=session_service, app_name='benchmind')
                
                message = types.Content(
                    parts=[types.Part.from_text(text=search_prompt)]
                )
                
                analysis_text = ""
                async for event in runner.run_async(
                    new_message=message,
                    user_id='benchmind',
                    session_id=session.id
                ):
                    if hasattr(event, 'content') and event.content:
                        if hasattr(event.content, 'parts') and event.content.parts:
                            for part in event.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    analysis_text += part.text
                
                logger.info(f"✅ Search agent analysis received: {len(analysis_text)} characters")
                
                # LOG THE ACTUAL SEARCH AGENT OUTPUT
                logger.info("=" * 80)
                logger.info("🔍 SEARCH AGENT OUTPUT (WHAT GETS SAVED TO DB):")
                logger.info("=" * 80)
                logger.info(analysis_text)
                logger.info("=" * 80)
                
                # Structure the result as markdown text for UI rendering
                result = {
                    "analysis_text": analysis_text,
                    "summary": f"Internet research completed for {len(model_ids)} models",
                    "search_queries": [
                        f"{task_description} model comparison",
                        f"AI model benchmarks {' '.join(model_ids[:2])}"
                    ],
                    "evidence": []  # Keep empty - UI will parse analysis_text
                }
                
            else:
                logger.warning("⚠️ Search agent not available - using fallback")
                result = {
                    "analysis_text": f"## Quality Analysis\n\nSearch agent unavailable. Please manually research the quality of these models for your {task_description} task:\n\n" + "\n".join([f"- {model_id}" for model_id in model_ids]),
                    "summary": "Search agent unavailable",
                    "search_queries": [],
                    "evidence": []
                }
                
        except Exception as e:
            logger.error(f"❌ Search agent failed: {e}")
            result = {
                "analysis_text": f"## Quality Analysis\n\nSearch analysis failed: {str(e)}\n\nPlease manually research the quality of these models for your {task_description} task.",
                "summary": "Search analysis failed",
                "search_queries": [],
                "evidence": []
            }
        
        # Save to cache for future use
        try:
            db = SessionLocal()
            import json
            from datetime import datetime
            cache_entry = SearchCache(
                cache_key=cache_key,
                result_text=json.dumps(result),
                created_at=datetime.utcnow()
            )
            db.add(cache_entry)
            db.commit()
            logger.info(f"💾 Cached quality analysis: {cache_key}")
        except Exception as e:
            logger.warning(f"Failed to cache result: {e}")
        finally:
            db.close()
        
        logger.info(f"✅ Quality analysis complete: {len(result.get('evidence', []))} evidence points")
        
        return result
