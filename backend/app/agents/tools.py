"""
Tools for Benchmind AI Consultant ReAct Agent
"""

import json
import time
import logging
from langchain_core.tools import tool
from ..utils.utils import call_mistral_api_with_ecologits, calculate_cost, get_model_name
from ..core.config import settings

# Set up detailed logger for benchmarking tools
tools_logger = logging.getLogger("benchmind.tools")
tools_logger.setLevel(logging.DEBUG)
if not tools_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    tools_logger.addHandler(handler)


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
    
    tools_logger.info(" BENCHMARKING TOOL CALLED")
    tools_logger.info(f" User task: {user_task}")
    tools_logger.info(f" Selected models: {selected_models}")
    tools_logger.info(f" Test prompt: {test_prompt}")
    tools_logger.info(f" Complexity: {complexity}")
    
    results = []
    model_list = [m.strip() for m in selected_models.split(",")]
    
    tools_logger.info(f" Processing {len(model_list)} models: {model_list}")
    
    for model_id in model_list:
        tools_logger.info(f" Starting benchmark for model: {model_id}")
        try:
            # Calculate expected tokens based on prompt length and complexity
            prompt_tokens = len(test_prompt.split()) * 1.3  # Rough token estimation
            if complexity == "simple":
                expected_response_tokens = 50
            elif complexity == "medium":
                expected_response_tokens = 150
            else:
                expected_response_tokens = 300
            
            total_expected_tokens = int(prompt_tokens + expected_response_tokens)
            
            # Execute the actual API call with EcoLogits environmental tracking
            tools_logger.info(f"📡 Calling EcoLogits API for {model_id}...")
            start_time = time.time()
            try:
                response, energy_wh, co2_g = call_mistral_api_with_ecologits(
                    model_id, test_prompt, expected_response_tokens, settings.mistral_api_key
                )
                end_time = time.time()
                tools_logger.info(f"✅ EcoLogits call successful for {model_id}")
                tools_logger.info(f"⚡ Energy: {energy_wh} Wh, CO2: {co2_g} g")
            except Exception as e:
                # Skip invalid models and continue with others
                tools_logger.warning(f"⚠️ Skipping model {model_id}: {str(e)}")
                continue
            
            # Calculate real metrics
            latency_ms = (end_time - start_time) * 1000
            usage = response.get('usage', {})
            actual_tokens = usage.get('total_tokens', total_expected_tokens)
            
            tools_logger.info(f"📊 {model_id} results - Latency: {latency_ms:.1f}ms, Tokens: {actual_tokens}")
            
            # Calculate cost based on ACTUAL token usage
            cost_usd = calculate_cost(actual_tokens, model_id)
            
            # Environmental impact already calculated by EcoLogits (energy_wh, co2_g from function return)
            
            # Get response text for token counting
            response_text = response['choices'][0]['message']['content']
            
            results.append({
                "model": get_model_name(model_id),
                "latency_ms": latency_ms,
                "cost_usd": cost_usd,
                "energy_wh": energy_wh,
                "co2_g": co2_g,
                "tokens_used": actual_tokens,
                "test_prompt": test_prompt[:100] + "..." if len(test_prompt) > 100 else test_prompt
            })
        except Exception as e:
            tools_logger.error(f"❌ Failed to benchmark {model_id}: {str(e)}")
            continue
        
    if not results:
        tools_logger.warning("⚠️ No valid models found")
        return json.dumps({"error": "No valid models found. Please check model names and try again."})
    
    tools_logger.info(f"✅ Benchmarking completed for {len(results)} models")
    return json.dumps(results)


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
