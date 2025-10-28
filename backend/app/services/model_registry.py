"""
Model registry service - manages available models and their metadata
"""

import requests
from typing import List, Dict, Any, Optional

from ..core.config import settings
from ..core.logging import LoggerMixin
from ..core.exceptions import APIKeyError, ModelNotFoundError


class ModelRegistry(LoggerMixin):
    """Service for managing AI model registry and metadata."""
    
    def __init__(self):
        self.api_key = settings.mistral_api_key
        self._cache: Optional[List[Dict[str, Any]]] = None
    
    async def get_available_models(self) -> Dict[str, Any]:
        """Get available models from Mistral API with caching."""
        if not self.api_key:
            self.logger.error("MISTRAL_API_KEY not configured")
            raise APIKeyError("MISTRAL_API_KEY not configured")
        
        try:
            self.logger.info("Fetching models from Mistral API...")
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                "https://api.mistral.ai/v1/models",
                headers=headers,
                timeout=10
            )
            
            self.logger.info(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                models = data.get('data', [])
                
                self.logger.info(f"Got {len(models)} total models from API")
                
                working_models = self._filter_models(models)
                self._cache = working_models
                
                self.logger.info(f"Returning {len(working_models)} filtered models")
                return {
                    "available_models": working_models,
                    "total_count": len(working_models),
                    "providers": ["mistral"]
                }
            else:
                self.logger.error(f"API returned {response.status_code}: {response.text}")
                
        except Exception as e:
            self.logger.error(f"Error fetching models: {e}")
        
        # Fallback
        self.logger.info("Using fallback models")
        fallback_models = self._get_fallback_models()
        return {
            "available_models": fallback_models,
            "total_count": len(fallback_models),
            "providers": ["mistral"]
        }
    
    def _filter_models(self, models: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter and deduplicate models."""
        working_models = []
        seen_ids = set()
        
        for model in models:
            model_id = model.get('id')
            if not model_id or model_id in seen_ids:
                continue
            
            # Skip embed/moderation models
            if any(skip in model_id.lower() for skip in ['embed', 'moderation']):
                continue
            
            seen_ids.add(model_id)
            name = model_id.replace('-', ' ').title()
            description = "AI model"
            
            working_models.append({
                "id": model_id,
                "name": name,
                "provider": "mistral",
                "description": description
            })
        
        return working_models
    
    def _get_fallback_models(self) -> List[Dict[str, Any]]:
        """Get fallback models when API is unavailable."""
        return [
            {"id": "mistral-tiny", "name": "Mistral Tiny", "provider": "mistral", "description": "Fast"},
            {"id": "mistral-small", "name": "Mistral Small", "provider": "mistral", "description": "Balanced"}
        ]
    
    def get_model_info(self, model_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific model."""
        # This could be enhanced with model-specific metadata
        model_metadata = {
            "mistral-tiny": {"params": 7e9, "description": "Fast and efficient"},
            "mistral-small": {"params": 22e9, "description": "Balanced performance"},
            "mistral-medium": {"params": 70e9, "description": "High quality"},
            "mistral-large": {"params": 175e9, "description": "Best quality"},
            "mistral-large-latest": {"params": 175e9, "description": "Latest best quality"}
        }
        
        if model_id not in model_metadata:
            raise ModelNotFoundError(f"Model {model_id} not found")
        
        return {
            "id": model_id,
            "name": model_id.replace('-', ' ').title(),
            **model_metadata[model_id]
        }
