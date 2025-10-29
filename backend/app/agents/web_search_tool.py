"""
Custom web search tool for finding quality benchmarks and model information.
Uses DuckDuckGo search (no API key required) to avoid conflicts with ADK built-in tools.
"""
import logging
from typing import Optional

logger = logging.getLogger("benchmind.web_search")


def search_model_quality_info(model_names: str) -> str:
    """
    Search the web for quality benchmarks, performance reviews, and news about AI models.
    
    This tool searches for:
    - Benchmark results (MMLU, HumanEval, etc.)
    - Quality comparisons and reviews
    - Recent news and updates
    - Performance assessments
    
    Args:
        model_names: Comma-separated list of model names to search for (e.g., "mistral-tiny,mistral-small")
    
    Returns:
        A formatted string with quality insights found from web search
    """
    try:
        logger.info(f"🔍 Searching web for quality info about: {model_names}")
        
        # Import here to avoid dependency issues
        try:
            from duckduckgo_search import DDGS
        except ImportError:
            logger.warning("⚠️ duckduckgo_search not installed. Install with: pip install duckduckgo-search")
            return "Web search unavailable. Install duckduckgo-search package to enable quality research."
        
        models = [m.strip() for m in model_names.split(',')]
        all_insights = []
        
        for model in models[:3]:  # Limit to 3 models to avoid rate limits
            logger.info(f"🔎 Searching for: {model}")
            
            # Search for benchmark results and quality info
            search_query = f"{model} benchmark MMLU HumanEval quality performance"
            
            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(search_query, max_results=3))
                
                if results:
                    model_insights = [f"\n**{model}:**"]
                    for i, result in enumerate(results, 1):
                        title = result.get('title', 'No title')
                        snippet = result.get('body', 'No description')
                        url = result.get('href', '')
                        # Clean and truncate snippet
                        snippet = snippet[:120] + "..." if len(snippet) > 120 else snippet
                        
                        # Format with URL on separate line for visibility
                        if url:
                            model_insights.append(f"• **{title}**")
                            model_insights.append(f"  {snippet}")
                            model_insights.append(f"  🔗 Source: {url}")
                            logger.info(f"📎 Found URL: {url}")
                        else:
                            model_insights.append(f"• {title}: {snippet}")
                    
                    all_insights.append("\n".join(model_insights))
                    logger.info(f"✅ Found {len(results)} results for {model}")
                else:
                    logger.warning(f"⚠️ No results found for {model}")
                    
            except Exception as search_error:
                logger.error(f"❌ Search failed for {model}: {search_error}")
                continue
        
        if all_insights:
            header = "📊 **Quality & Benchmark Insights from Web Search:**\n\n"
            header += "I searched the internet and found the following information:\n"
            footer = "\n\n⚠️ **Important:** These are real search results from the internet. All URLs above are clickable sources. If a source lacks specific MMLU/HumanEval scores, that means no public data was found for these exact model versions."
            return header + "\n".join(all_insights) + footer
        else:
            return "📊 **Quality & Benchmark Insights from Web Search:**\n\n⚠️ No quality benchmark data found from internet search. These model versions may be too new or lack public MMLU/HumanEval scores. Recommend testing on your actual dataset."
            
    except Exception as e:
        logger.error(f"💥 Web search tool failed: {e}")
        return f"Web search encountered an error: {str(e)}"
