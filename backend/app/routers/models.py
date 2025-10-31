"""
Models router - handles model listing and information
"""

import logging
from fastapi import APIRouter, Depends

from ..services.model_registry import ModelRegistry
from ..schemas.responses import ModelsResponse

router = APIRouter(prefix="/models", tags=["models"])
logger = logging.getLogger("benchmind.models")


def get_model_registry() -> ModelRegistry:
    """Dependency to get model registry service."""
    return ModelRegistry()


@router.get("/", response_model=ModelsResponse)
async def get_models(registry: ModelRegistry = Depends(get_model_registry)):
    """Get available AI models from registry."""
    logger.info("🔍 Fetching available models from registry...")
    result = await registry.get_available_models()
    
    # Handle both dict and object responses
    models = result.get('available_models', []) if isinstance(result, dict) else result.available_models
    
    logger.info(f"✅ Fetched {len(models)} models")
    logger.info("=" * 80)
    logger.info("📋 FULL MODEL LIST (ALL MODELS):")
    logger.info("=" * 80)
    for i, model in enumerate(models, 1):
        # Models use 'name' and 'id', not 'model_name' and 'model_id'
        model_name = model.get('name') if isinstance(model, dict) else getattr(model, 'name', None)
        model_id = model.get('id') if isinstance(model, dict) else getattr(model, 'id', None)
        logger.info(f"{i}. {model_name} (ID: {model_id})")
    logger.info("=" * 80)
    logger.info(f"🔧 FIRST MODEL FULL STRUCTURE:")
    logger.info(f"{models[0] if models else 'No models'}")
    logger.info("=" * 80)
    
    return result


@router.get("/{model_id}")
async def get_model_info(model_id: str, registry: ModelRegistry = Depends(get_model_registry)):
    """Get detailed information about a specific model."""
    return registry.get_model_info(model_id)
