"""
Tools for Benchmind AI Consultant ReAct Agent
"""

import json
import time
from langchain_core.tools import tool
from ..utils.utils import call_mistral_api, calculate_cost, calculate_environmental_impact, get_model_name, assess_universal_quality
from ..core.config import settings


@tool
def benchmark_models_for_task(user_task: str, selected_models: str, test_prompt: str, complexity: str = "medium") -> str:
    """
    Universal AI model benchmarking tool for ANY use case.
    
    Before calling this tool, you should:
    1. Analyze the user's task description
    2. Create an appropriate test prompt that simulates what their system would need to process
    3. Then call this tool with that test prompt
    
    Args:
        user_task: Description of what the user wants to build
        selected_models: Comma-separated list of model IDs to test  
        test_prompt: The specific prompt to test the models with (YOU create this based on the task)
        complexity: simple, medium, or complex
    
    Returns:
        JSON string with detailed benchmark results
    """
    try:
        models = [m.strip() for m in selected_models.split(',')]
        results = []
        
        # Test each selected model with the agent-created prompt
        for model_id in models:
            # Calculate expected tokens based on prompt length and complexity
            prompt_tokens = len(test_prompt.split()) * 1.3  # Rough token estimation
            if complexity == "simple":
                expected_response_tokens = 50
            elif complexity == "medium":
                expected_response_tokens = 150
            else:
                expected_response_tokens = 300
            
            total_expected_tokens = int(prompt_tokens + expected_response_tokens)
            
            # Execute the actual API call
            start_time = time.time()
            response = call_mistral_api(model_id, test_prompt, expected_response_tokens, settings.mistral_api_key)
            end_time = time.time()
            
            # Calculate real metrics
            latency_ms = (end_time - start_time) * 1000
            usage = response.get('usage', {})
            actual_tokens = usage.get('total_tokens', total_expected_tokens)
            
            # Calculate real costs and environmental impact based on ACTUAL token usage
            cost_usd = calculate_cost(actual_tokens, model_id)
            energy_wh, co2_g = calculate_environmental_impact(actual_tokens, model_id)
            
            # Assess quality based on response
            response_text = response['choices'][0]['message']['content']
            quality_score = assess_universal_quality(response_text, user_task, complexity)
            
            results.append({
                "model": get_model_name(model_id),
                "quality": quality_score,
                "latency_ms": latency_ms,
                "cost_usd": cost_usd,
                "energy_wh": energy_wh,
                "co2_g": co2_g,
                "tokens_used": actual_tokens,
                "test_prompt": test_prompt[:100] + "..." if len(test_prompt) > 100 else test_prompt
            })
        
        return json.dumps(results)
        
    except Exception as e:
        return f"Error benchmarking models: {str(e)}"


@tool
def analyze_cost_efficiency(budget_usd: float) -> str:
    """Analyze which models fit within a given budget. Input: budget in USD as float"""
    analysis = {
        "budget_usd": budget_usd,
        "models": {
            "mistral-tiny": {"cost_per_1k_tokens": 0.00025, "suitable": budget_usd >= 0.00025},
            "mistral-small": {"cost_per_1k_tokens": 0.002, "suitable": budget_usd >= 0.002}
        },
        "recommendations": []
    }
    
    if budget_usd >= 0.002:
        analysis["recommendations"].append("Both models fit your budget. Consider quality vs cost trade-offs.")
    elif budget_usd >= 0.00025:
        analysis["recommendations"].append("Only Mistral Tiny fits your budget, but it's very cost-effective.")
    else:
        analysis["recommendations"].append("Budget is very tight. Consider increasing budget or reducing token usage.")
    
    return json.dumps(analysis, indent=2)
