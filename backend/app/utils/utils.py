"""
Utility functions for Benchmind AI Consultant
"""

import os
import requests
import time
import logging
from typing import Dict, Any
from ecologits import EcoLogits

logger = logging.getLogger("benchmind.ecologits")


def calculate_cost(total_tokens: int, model_id: str) -> float:
    """Calculate cost based on model pricing."""
 
    pricing = {
        "mistral-tiny": 0.00025,
        "mistral-small": 0.002,
        "mistral-medium": 0.006,
        "mistral-large": 0.012,
        "mistral-large-latest": 0.012,
        "open-mistral-7b": 0.00025,
        "open-mixtral-8x7b": 0.0007,
        "open-mixtral-8x22b": 0.002,
    }
    
    default_price = 0.002
    price_per_1k = pricing.get(model_id, default_price)
    
    return (total_tokens / 1000) * price_per_1k




def get_model_name(model_id: str) -> str:
    """Convert model ID to human-readable name."""
    name_mapping = {
        "mistral-tiny": "Mistral Tiny",
        "mistral-small": "Mistral Small", 
        "mistral-medium": "Mistral Medium",
        "mistral-large": "Mistral Large",
        "mistral-large-latest": "Mistral Large Latest",
        "open-mistral-7b": "Open Mistral 7B",
        "open-mixtral-8x7b": "Open Mixtral 8x7B",
        "open-mixtral-8x22b": "Open Mixtral 8x22B",
    }
    
    return name_mapping.get(model_id, model_id.replace('-', ' ').title())




def call_mistral_api_with_ecologits(model_id: str, prompt: str, max_tokens: int, api_key: str) -> tuple[Dict[str, Any], float, float]:
    """Call Mistral API with REAL EcoLogits environmental tracking via LiteLLM."""
    
    from ecologits import EcoLogits
    import litellm
    
    try:
        EcoLogits.init(providers=["litellm"])
    except Exception as e:
        logger.error(f"EcoLogits initialization failed: {e}")
        raise
    
    litellm_model = f"mistral/{model_id}"
    
    os.environ["MISTRAL_API_KEY"] = api_key
    os.environ["MISTRAL_API_BASE"] = "https://api.mistral.ai/v1"
    
    try:
        start_time = time.time()
        resp = litellm.completion(
            model=litellm_model,
            messages=[{"role": "user", "content": prompt}],
            api_base=os.environ.get("MISTRAL_API_BASE", "https://api.mistral.ai/v1"),
            api_key=os.environ.get("MISTRAL_API_KEY"),
            max_tokens=max_tokens,
            temperature=0.2,
        )
        
        end_time = time.time()
        
        impacts = getattr(resp, "impacts", None) or getattr(resp, "_impacts", None)
        
        if impacts:
            energy_attr = getattr(impacts, "energy", None)
            gwp_attr = getattr(impacts, "gwp", None)
            
            if energy_attr and gwp_attr:
                energy_val = impacts.energy.value
                co2_val = impacts.gwp.value
                
                if hasattr(energy_val, 'min'):
                    energy_kwh = float(energy_val.min)
                else:
                    energy_kwh = float(energy_val)
                    
                if hasattr(co2_val, 'min'):
                    co2_kg = float(co2_val.min)
                else:
                    co2_kg = float(co2_val)
                
                energy_wh = energy_kwh * 1000.0
                co2_g = co2_kg * 1000.0
                
            else:
                raise RuntimeError("EcoLogits energy/GWP data not available")
        else:
            raise RuntimeError("EcoLogits impacts not attached to response")

        result = resp.model_dump() if hasattr(resp, "model_dump") else resp
        
        standard_result = {
            "choices": [{"message": {"content": result["choices"][0]["message"]["content"]}}],
            "usage": {
                "total_tokens": result["usage"]["total_tokens"],
                "prompt_tokens": result["usage"]["prompt_tokens"],
                "completion_tokens": result["usage"]["completion_tokens"],
            }
        }
        
        
        return standard_result, energy_wh, co2_g
        
    except Exception as e:
        logger.error(f"EcoLogits workflow failed: {e}")
        raise Exception(f"REAL EcoLogits environmental tracking failed: {e}. NO FAKE DATA ALLOWED.")

