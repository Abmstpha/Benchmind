"""
Models router - handles model listing and information
"""

from fastapi import APIRouter, Depends

from ..services.model_registry import ModelRegistry
from ..schemas.responses import ModelsResponse

router = APIRouter(prefix="/models", tags=["models"])


def get_model_registry() -> ModelRegistry:
    """Dependency to get model registry service."""
    return ModelRegistry()


@router.get("/", response_model=ModelsResponse)
async def get_models(registry: ModelRegistry = Depends(get_model_registry)):
    """Get available AI models from registry."""
    return await registry.get_available_models()


@router.get("/{model_id}")
async def get_model_info(model_id: str, registry: ModelRegistry = Depends(get_model_registry)):
    """Get detailed information about a specific model."""
    return registry.get_model_info(model_id)
