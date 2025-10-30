"""
Test endpoint for EcoLogits verification with detailed logging
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..utils.utils import call_mistral_api_with_ecologits
from ..core.config import settings

# Set up router
router = APIRouter(prefix="/test", tags=["testing"])

# Set up logging
logging.basicConfig(level=logging.DEBUG)

class EcoLogitsTestRequest(BaseModel):
    prompt: str = "Hello, how are you?"
    model_id: str = "mistral-tiny"
    max_tokens: int = 20

class EcoLogitsTestResponse(BaseModel):
    success: bool
    energy_wh: float
    co2_g: float
    tokens_used: int
    response_text: str
    latency_ms: float
    cost_usd: float

@router.post("/ecologits", response_model=EcoLogitsTestResponse)
async def test_ecologits_endpoint(request: EcoLogitsTestRequest):
    """
    Test EcoLogits integration with detailed logging.
    """
    
    logger = logging.getLogger("benchmind.ecologits")
    logger.info("🎯 TEST ENDPOINT CALLED")
    logger.info(f"📋 Request: {request}")
    
    try:
        import time
        start_time = time.time()
        
        # Call the EcoLogits function with full logging
        result, energy_wh, co2_g = call_mistral_api_with_ecologits(
            model_id=request.model_id,
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            api_key=settings.mistral_api_key
        )
        
        end_time = time.time()
        latency_ms = (end_time - start_time) * 1000
        
        # Calculate cost
        from ..utils.utils import calculate_cost
        cost_usd = calculate_cost(result['usage']['total_tokens'], request.model_id)
        
        logger.info("🎉 TEST ENDPOINT SUCCESS")
        
        return EcoLogitsTestResponse(
            success=True,
            energy_wh=energy_wh,
            co2_g=co2_g,
            tokens_used=result['usage']['total_tokens'],
            response_text=result['choices'][0]['message']['content'],
            latency_ms=latency_ms,
            cost_usd=cost_usd
        )
        
    except Exception as e:
        logger.error(f"💥 TEST ENDPOINT FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"EcoLogits test failed: {str(e)}")

@router.get("/ecologits-simple")
async def test_ecologits_simple():
    """
    Simple GET endpoint to test EcoLogits with default parameters.
    Just hit this URL in Postman with GET request.
    """
    
    logger = logging.getLogger("benchmind.ecologits")
    logger.info("🎯 SIMPLE GET TEST ENDPOINT CALLED")
    
    try:
        import time
        start_time = time.time()
        
        # Test with simple prompt
        result, energy_wh, co2_g = call_mistral_api_with_ecologits(
            model_id="mistral-tiny",
            prompt="Hi there!",
            max_tokens=15,
            api_key=settings.mistral_api_key
        )
        
        end_time = time.time()
        latency_ms = (end_time - start_time) * 1000
        
        logger.info("🎉 SIMPLE GET TEST SUCCESS")
        
        return {
            "success": True,
            "message": "EcoLogits test completed successfully",
            "energy_wh": energy_wh,
            "co2_g": co2_g,
            "tokens_used": result['usage']['total_tokens'],
            "response_text": result['choices'][0]['message']['content'],
            "latency_ms": latency_ms,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"💥 SIMPLE GET TEST FAILED: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "EcoLogits test failed - check logs for details"
        }
