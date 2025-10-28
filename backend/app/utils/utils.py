"""
Utility functions for Benchmind AI Consultant
"""

import time
from typing import Dict, Any


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


def calculate_environmental_impact(total_tokens: int, model_id: str) -> tuple[float, float]:
    """Calculate environmental impact (energy_wh, co2_g)."""
    # Energy consumption per 1K tokens (Wh) - estimates based on model size
    energy_per_1k = {
        "mistral-tiny": 0.5,
        "mistral-small": 1.0,
        "mistral-medium": 2.5,
        "mistral-large": 5.0,
        "mistral-large-latest": 5.0,
        "open-mistral-7b": 0.8,
        "open-mixtral-8x7b": 2.0,
        "open-mixtral-8x22b": 4.0,
    }
    
    default_energy = 1.5
    energy_wh = (total_tokens / 1000) * energy_per_1k.get(model_id, default_energy)
    
    # CO2 emissions (g) - assuming 0.3g CO2 per Wh (typical grid mix)
    co2_g = energy_wh * 0.3
    
    return energy_wh, co2_g


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


def assess_universal_quality(response: str, user_task: str, complexity: str) -> float:
    """Universal quality assessment that works for any task type."""
    score = 0.5  # Base score
    
    word_count = len(response.split())
    
    # Length appropriateness based on complexity
    if complexity == "simple" and 20 <= word_count <= 150:
        score += 0.2
    elif complexity == "medium" and 50 <= word_count <= 300:
        score += 0.2
    elif complexity == "complex" and word_count >= 150:
        score += 0.2
    
    # Structure and completeness
    structure_indicators = [".", ":", "-", "1.", "2.", "•", "However", "Additionally"]
    structure_count = sum(1 for indicator in structure_indicators if indicator in response)
    if structure_count >= 3:
        score += 0.2
    
    # Task relevance (basic keyword matching)
    task_words = user_task.lower().split()
    relevant_words = [word for word in task_words if len(word) > 3]
    relevance_count = sum(1 for word in relevant_words if word in response.lower())
    if relevance_count >= 2:
        score += 0.1
    
    return min(score, 1.0)


def call_mistral_api(model_id: str, prompt: str, max_tokens: int, api_key: str) -> Dict[str, Any]:
    """Call Mistral API."""
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
    
    return response.json()
