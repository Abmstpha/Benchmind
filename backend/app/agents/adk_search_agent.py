"""
Google Search Sub-Agent for Quality Benchmarks
This is a dedicated sub-agent that ONLY uses google_search (no custom tools)
"""
import logging
import os
import time
import re
import requests
from typing import Optional

from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.tools import google_search
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types

from ..core.config import settings

logger = logging.getLogger("benchmind.google_search_agent")

_search_cache = {}
_cache_timestamps = {}


def create_google_search_agent(enable_search: bool = True) -> Optional[LlmAgent]:
    """
    Create a dedicated sub-agent that ONLY uses google_search.
    
    This bypasses the ADK limitation where google_search cannot be mixed with custom tools.
    The main agent will delegate to this sub-agent when it needs web search.
    
    Args:
        enable_search: If False, returns None (disables search functionality)
    
    Returns:
        LlmAgent configured with google_search tool only, or None if disabled
    """
    if not enable_search:
        logger.info("🚫 Google Search sub-agent disabled")
        return None
        
    logger.info("🔧 Creating Google Search sub-agent...")
    
    # CRITICAL: ADK expects GOOGLE_API_KEY environment variable
    if not os.environ.get("GOOGLE_API_KEY"):
        if settings.google_api_key:
            os.environ["GOOGLE_API_KEY"] = settings.google_api_key
            logger.info("✅ Set GOOGLE_API_KEY from settings (separate key for search)")
        elif settings.gemini_api_key:
            os.environ["GOOGLE_API_KEY"] = settings.gemini_api_key
            logger.warning("⚠️ Using GEMINI_API_KEY as fallback - consider adding separate GOOGLE_API_KEY")
        else:
            logger.error("❌ No API key available - cannot create search agent")
            return None
    
    try:
        llm = Gemini(
            model_name="gemini-1.5-flash",
            temperature=0.1
        )
        logger.info(f"✅ Gemini model created for search")
    except Exception as e:
        logger.error(f"❌ Failed to create Gemini model: {e}")
        return None
    
    search_agent = LlmAgent(
        name="google_search_specialist",
        model=llm,
        description="Specialist agent that searches Google for AI model quality benchmarks, MMLU scores, HumanEval results, and academic papers.",
        instruction="""
You are an expert AI model benchmark researcher. Your mission is to find comprehensive, accurate quality benchmarks for AI language models.

**BENCHMARK TYPES TO SEARCH FOR (in priority order):**
1. **Academic Benchmarks:** MMLU, HumanEval, GSM8K, HellaSwag, TruthfulQA
2. **Code & Technical:** HumanEval Plus, MBPP
3. **Reasoning & Logic:** GPQA, DROP, LogiQA
4. **Real-World Performance:** Chatbot Arena Elo, AlpacaEval, MT-Bench

**SEARCH STRATEGY:**
For EACH model, perform multiple targeted searches:
1. "MODEL_NAME MMLU HumanEval benchmark scores"
2. "MODEL_NAME official benchmarks model card"
3. "MODEL_NAME Hugging Face leaderboard"

**OUTPUT FORMAT (use this EXACT structure):**

**MODEL_NAME:**
• **MMLU:** [score]% - [brief context if available]
• **HumanEval:** [score]% - [brief context if available]
• **GSM8K:** [score]% (if found)
• **Other Benchmarks:** [list any other scores found]
• **Key Strengths:** [what the model excels at based on benchmarks]
• **Sources:**
    * https://medium.com/@alakov/google-is-showing-only-1-result-here-is-why-it-ok-3a991cafc47f
    * https://stackoverflow.com/questions/29377504/perform-a-google-search-and-return-the-number-of-results
• **Credibility:** ✅ Highly Credible / ⚠️ Moderately Credible / ❌ Low Credibility

**CRITICAL URL REQUIREMENTS:**
1. You MUST copy the EXACT URLs returned by google_search
2. NEVER make up or guess URLs
3. NEVER include "vertexaisearch.cloud.google.com" URLs (skip them)
4. Copy URLs character-by-character exactly

**QUALITY STANDARDS:**
✅ DO: Cite SPECIFIC numerical scores (e.g., "MMLU: 81.2%")
❌ DON'T: Use vague terms like "performs well"

**CREDIBILITY ASSESSMENT:**
✅ Highly Credible: Official model cards, academic papers, Hugging Face
⚠️ Moderately Credible: Tech blogs citing official sources
❌ Low Credibility: Forums, unverified claims

**SPECIAL CASES:**
- If no data found: "No public benchmark data available for this specific model version"
""",
        tools=[google_search]  # ONLY google_search, no custom tools
    )
    
    logger.info("✅ Google Search sub-agent created successfully")
    return search_agent


def search_model_benchmarks(model_names: list[str]) -> str:
    """
    Standalone function to search for model benchmarks independently.
    Includes caching and retry logic to handle API overload.
    
    Args:
        model_names: List of model names to search for
        
    Returns:
        String containing search results with benchmark data and URLs
    """
    
    cache_key = ",".join(sorted(model_names))
    if cache_key in _search_cache:
        cache_age = time.time() - _cache_timestamps.get(cache_key, 0)
        if cache_age < 3600:  # 1 hour = 3600 seconds
            logger.info(f"📦 Using cached search results ({int(cache_age/60)} minutes old)")
            return _search_cache[cache_key]
        else:
            logger.info(f"🗑️ Cache expired for key: {cache_key}, fetching fresh data.")
    
    logger.info(f"🔍 [Cache Miss] Starting independent search for {len(model_names)} models...")
    
    search_agent = create_google_search_agent(enable_search=True)
    if search_agent is None:
        logger.error("❌ Search agent unavailable")
        return "Search agent unavailable"
    
    try:
        session_service = InMemorySessionService()
        session = session_service.create_session_sync(user_id='benchmind', app_name='benchmind')
        runner = Runner(agent=search_agent, session_service=session_service, app_name='benchmind')
    except Exception as e:
        logger.error(f"❌ Session setup failed: {e}")
        return f"Session setup failed: {e}"
    
    models_list = ", ".join(model_names)
    query = f"Search for MMLU benchmark scores, HumanEval results, and quality benchmarks for these AI models: {models_list}"
    
    message = types.Content(
        role='user',
        parts=[types.Part.from_text(text=query)]
    )
    
    max_retries = 3
    retry_delay_base = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"🔎 Running search query (attempt {attempt + 1}/{max_retries})...")
            response_text = ""
            
            for event in runner.run(
                new_message=message,
                user_id='benchmind',
                session_id=session.id
            ):
                if hasattr(event, 'content') and event.content:
                    if hasattr(event.content, 'parts') and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                response_text += part.text
            
            logger.info(f"✅ Search completed - {len(response_text)} chars received")

            redirect_pattern = r'https://vertexaisearch\.cloud\.google\.com/grounding-api-redirect/[A-Za-z0-9_-]+'
            redirect_urls = re.findall(redirect_pattern, response_text)
            
            if redirect_urls:
                logger.info(f"🔗 Found {len(redirect_urls)} redirect URLs, resolving...")
                for redirect_url in set(redirect_urls):
                    try:
                        resp = requests.head(redirect_url, allow_redirects=True, timeout=3)
                        real_url = resp.url
                        if real_url != redirect_url:
                            logger.info(f"✅ Resolved: {redirect_url[:80]}... → {real_url}")
                            response_text = response_text.replace(redirect_url, real_url)
                        else:
                            logger.warning(f"⚠️ No redirect for: {redirect_url[:80]}...")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to resolve {redirect_url[:80]}...: {e}")
                logger.info("✅ URL resolution complete")
            
            remaining_redirects = re.findall(redirect_pattern, response_text)
            if remaining_redirects:
                logger.warning(f"⚠️ Removing {len(remaining_redirects)} unresolved redirect URLs")
                for unresolved_url in remaining_redirects:
                    response_text = re.sub(r'\s*\*\s+' + re.escape(unresolved_url) + r'[^\n]*\n?', '', response_text)
                logger.info("🧹 Removed all vertexaisearch URLs from output")

            response_text = re.sub(r'(https?://[^\s]+?)(=+)(\s|$)', r'\1\3', response_text)
            logger.info("🧹 Cleaned up URL formatting artifacts")

            try:
                debug_file = "/tmp/search_agent_output.txt"
                with open(debug_file, "w") as f:
                    f.write(response_text)
                logger.info(f"💾 Search output saved to {debug_file}")
            except Exception as e:
                logger.warning(f"⚠️ Could not write debug file: {e}")

            if response_text:
                logger.info(f"💾 Caching successful result for key: {cache_key}")
                _search_cache[cache_key] = response_text
                _cache_timestamps[cache_key] = time.time()
                return response_text
            else:
                logger.warning("⚠️ Search completed but returned no text.")
                return "No search results found"
            
        except Exception as e:
            error_msg = str(e)
            if "503" in error_msg or "overloaded" in error_msg.lower():
                if attempt < max_retries - 1:
                    wait_time = retry_delay_base * (2 ** attempt)  # Exponential backoff: 2s, 4s
                    logger.warning(f"⚠️ API overloaded (503). Retrying in {wait_time}s... (attempt {attempt + 2}/{max_retries})")
                    time.sleep(wait_time)
                    continue  # Go to the next attempt in the loop
                else:
                    logger.error(f"❌ API still overloaded after {max_retries} attempts.")
                    return "No search results found (API temporarily unavailable)"
            else:
                logger.error(f"❌ Search failed with non-retryable error: {type(e).__name__}: {e}")
                return f"Search error: {e}"
    
    return "No search results found (API temporarily unavailable)"


__all__ = ['create_google_search_agent', 'search_model_benchmarks']