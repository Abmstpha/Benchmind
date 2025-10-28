"""
Utility functions for Benchmind AI Consultant
"""

import os
import requests
import time
import logging
from typing import Dict, Any
from ecologits import EcoLogits

# Set up detailed logger for EcoLogits workflow
logger = logging.getLogger("benchmind.ecologits")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def calculate_cost(total_tokens: int, model_id: str) -> float:
    """Calculate cost based on model pricing."""
    # Pricing per 1K tokens (approximate)
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
    
    # Default pricing for unknown models
    default_price = 0.002
    price_per_1k = pricing.get(model_id, default_price)
    
    return (total_tokens / 1000) * price_per_1k


def calculate_environmental_impact_from_ecologits(response_with_impacts) -> tuple[float, float]:
    """Extract real environmental impact from EcoLogits-wrapped response."""
    try:
        # Get real measurements from EcoLogits
        energy_kwh = response_with_impacts.impacts.energy.value  # kWh
        co2_kg = response_with_impacts.impacts.gwp.value        # kgCO₂e
        
        # Convert to our display units
        energy_wh = energy_kwh * 1000  # kWh -> Wh
        co2_g = co2_kg * 1000         # kg -> g
        
        return energy_wh, co2_g
    except (AttributeError, TypeError) as e:
        # No fallback - environmental data must be real
        raise Exception(f"EcoLogits environmental data not available: {e}. Cannot provide fake estimates.")

def calculate_environmental_impact(total_tokens: int, model_id: str) -> tuple[float, float]:
    """DEPRECATED: Only use EcoLogits for real environmental measurements."""
    raise NotImplementedError(
        "Environmental impact calculation requires EcoLogits. "
        "Use call_mistral_api_with_ecologits() instead of hardcoded estimates."
    )


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
    
    logger.info("🚀 STARTING ECOLOGITS WORKFLOW")
    logger.info(f"📋 Input params - model: {model_id}, prompt_length: {len(prompt)}, max_tokens: {max_tokens}")
    
    from ecologits import EcoLogits
    import litellm
    
    logger.info("📦 Importing EcoLogits and LiteLLM modules")
    
    # Initialize EcoLogits with LiteLLM provider
    logger.info("🔧 Initializing EcoLogits with litellm provider...")
    try:
        EcoLogits.init(providers=["litellm"])
        logger.info("✅ EcoLogits initialized successfully")
    except Exception as e:
        logger.error(f"❌ EcoLogits initialization failed: {e}")
        raise
    
    # Convert model_id to LiteLLM format
    litellm_model = f"mistral/{model_id}"
    logger.info(f"🔄 Converted model ID: {model_id} → {litellm_model}")
    
    # Set environment variables for LiteLLM
    logger.info("🔑 Setting up environment variables...")
    os.environ["MISTRAL_API_KEY"] = api_key
    os.environ["MISTRAL_API_BASE"] = "https://api.mistral.ai/v1"
    logger.info(f"🌐 API Base: {os.environ.get('MISTRAL_API_BASE')}")
    logger.info(f"🔐 API Key set: {'Yes' if api_key else 'No'}")
    
    try:
        logger.info("📡 Making LiteLLM API call with EcoLogits tracking...")
        start_time = time.time()
        
        # Call Mistral via LiteLLM with EcoLogits tracking
        resp = litellm.completion(
            model=litellm_model,
            messages=[{"role": "user", "content": prompt}],
            api_base=os.environ.get("MISTRAL_API_BASE", "https://api.mistral.ai/v1"),
            api_key=os.environ.get("MISTRAL_API_KEY"),
            max_tokens=max_tokens,
            temperature=0.2,
        )
        
        end_time = time.time()
        logger.info(f"✅ API call completed in {(end_time - start_time):.3f} seconds")
        
        # Log response structure
        logger.info(f"📊 Response type: {type(resp)}")
        logger.info(f"📊 Response attributes: {dir(resp)}")
        
        # Extract EcoLogits impact data
        logger.info("🔍 Extracting EcoLogits impact data...")
        impacts = getattr(resp, "impacts", None) or getattr(resp, "_impacts", None)
        
        if impacts:
            logger.info(f"✅ EcoLogits impacts found: {type(impacts)}")
            logger.info(f"📊 Impact attributes: {dir(impacts)}")
            
            energy_attr = getattr(impacts, "energy", None)
            gwp_attr = getattr(impacts, "gwp", None)
            
            logger.info(f"⚡ Energy attribute: {energy_attr}")
            logger.info(f"🌍 GWP attribute: {gwp_attr}")
            
            if energy_attr and gwp_attr:
                logger.info("✅ Both energy and GWP data available")
                
                # Handle RangeValue objects
                energy_val = impacts.energy.value
                co2_val = impacts.gwp.value
                
                logger.info(f"⚡ Raw energy value: {energy_val} (type: {type(energy_val)})")
                logger.info(f"🌍 Raw CO2 value: {co2_val} (type: {type(co2_val)})")
                
                # If it's a RangeValue, get the min for conservative estimate
                if hasattr(energy_val, 'min'):
                    energy_kwh = float(energy_val.min)
                    logger.info(f"📊 Using RangeValue.min for energy: {energy_kwh} kWh")
                else:
                    energy_kwh = float(energy_val)
                    logger.info(f"📊 Using direct value for energy: {energy_kwh} kWh")
                    
                if hasattr(co2_val, 'min'):
                    co2_kg = float(co2_val.min)
                    logger.info(f"📊 Using RangeValue.min for CO2: {co2_kg} kg")
                else:
                    co2_kg = float(co2_val)
                    logger.info(f"📊 Using direct value for CO2: {co2_kg} kg")
                
                # Convert units: kWh → Wh, kgCO2e → g
                energy_wh = energy_kwh * 1000.0
                co2_g = co2_kg * 1000.0
                
                logger.info(f"🔄 Unit conversion - Energy: {energy_kwh} kWh → {energy_wh} Wh")
                logger.info(f"🔄 Unit conversion - CO2: {co2_kg} kg → {co2_g} g")
                
            else:
                logger.error("❌ Energy or GWP data missing from impacts")
                raise RuntimeError("EcoLogits energy/GWP data not available")
        else:
            logger.error("❌ No EcoLogits impacts found in response")
            logger.error(f"❌ Response object: {resp}")
            raise RuntimeError("EcoLogits impacts not attached to response")

        # Convert response to standard format
        logger.info("🔄 Converting response to standard format...")
        result = resp.model_dump() if hasattr(resp, "model_dump") else resp
        
        logger.info(f"📊 Usage data: {result.get('usage', 'Not found')}")
        
        standard_result = {
            "choices": [{"message": {"content": result["choices"][0]["message"]["content"]}}],
            "usage": {
                "total_tokens": result["usage"]["total_tokens"],
                "prompt_tokens": result["usage"]["prompt_tokens"],
                "completion_tokens": result["usage"]["completion_tokens"],
            }
        }
        
        logger.info(f"✅ FINAL RESULTS:")
        logger.info(f"   Energy: {energy_wh} Wh")
        logger.info(f"   CO2: {co2_g} g")
        logger.info(f"   Tokens: {standard_result['usage']['total_tokens']}")
        logger.info(f"   Response: {standard_result['choices'][0]['message']['content'][:100]}...")
        
        return standard_result, energy_wh, co2_g
        
    except Exception as e:
        logger.error(f"❌ ECOLOGITS WORKFLOW FAILED: {e}")
        logger.error(f"❌ Exception type: {type(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise Exception(f"REAL EcoLogits environmental tracking failed: {e}. NO FAKE DATA ALLOWED.")

def call_mistral_api_fallback(model_id: str, prompt: str, max_tokens: int, api_key: str) -> Dict[str, Any]:
    """Fallback Mistral API call without EcoLogits."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.7
    }
    
    response = requests.post(
        "https://api.mistral.ai/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    if response.status_code != 200:
        raise Exception(f"Mistral API error {response.status_code}: {response.text}")
    
    result = response.json()
    
    # Validate response format
    if 'choices' not in result:
        raise Exception(f"Invalid API response format. Got: {list(result.keys())}")
    
    return result

def call_mistral_api(model_id: str, prompt: str, max_tokens: int, api_key: str) -> Dict[str, Any]:
    """Call Mistral API (legacy function for compatibility)."""
    return call_mistral_api_fallback(model_id, prompt, max_tokens, api_key)
