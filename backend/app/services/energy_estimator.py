"""
Real environmental impact estimation using EcoLogits + LiteLLM

"""

from typing import Tuple, Dict, Any
import os
from ecologits import EcoLogits
import litellm

# Initialize EcoLogits with LiteLLM provider - DO THIS ONCE
EcoLogits.init(providers=["litellm"])

def call_mistral_with_ecologits(
    model: str,
    user_prompt: str,
    max_tokens: int = 128,
) -> Tuple[Dict[str, Any], float, float]:
    """
    Calls Mistral via LiteLLM and returns (response_dict, energy_Wh, co2_g).
    Supported models: "mistral/mistral-tiny", "mistral/mistral-small", etc.
    
    NO FALLBACKS - Either we get real EcoLogits data or we fail.
    """
    # Call Mistral via LiteLLM with EcoLogits tracking
    resp = litellm.completion(
        model=model,  # e.g., "mistral/mistral-tiny"
        messages=[{"role": "user", "content": user_prompt}],
        api_base=os.getenv("MISTRAL_API_BASE", "https://api.mistral.ai/v1"),
        api_key=os.getenv("MISTRAL_API_KEY"),
        max_tokens=max_tokens,
        temperature=0.2,
    )

    # Extract EcoLogits impact data - MUST BE REAL
    impacts = getattr(resp, "impacts", None) or getattr(resp, "_impacts", None)
    if impacts and getattr(impacts, "energy", None) and getattr(impacts, "gwp", None):
        # Handle RangeValue objects - extract the actual numeric value
        energy_val = impacts.energy.value
        co2_val = impacts.gwp.value
        
        # If it's a RangeValue, get the min/max/avg - use min for conservative estimate
        if hasattr(energy_val, 'min'):
            energy_kwh = float(energy_val.min)
        else:
            energy_kwh = float(energy_val)
            
        if hasattr(co2_val, 'min'):
            co2_kg = float(co2_val.min)
        else:
            co2_kg = float(co2_val)
        
        # Convert units: kWh → Wh, kgCO2e → g
        energy_wh = energy_kwh * 1000.0
        co2_g = co2_kg * 1000.0
    else:
        raise RuntimeError(
            "EcoLogits impacts not attached to response. "
            "Real environmental tracking failed - cannot provide fake data."
        )

    # Convert response to standard format
    result = resp.model_dump() if hasattr(resp, "model_dump") else resp

    return result, energy_wh, co2_g

def led_minutes(energy_wh: float, led_watts: float = 6.0) -> float:
    """Convert energy to LED bulb minutes equivalent."""
    return (energy_wh / led_watts) * 60.0

def video_seconds(energy_wh: float, wh_per_second: float = 0.04) -> float:
    """Convert energy to online video streaming seconds equivalent."""
    return energy_wh / wh_per_second
