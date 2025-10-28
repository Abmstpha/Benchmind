"""
Custom exceptions and error handlers for Benchmind API
"""

from typing import Any, Dict
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class BenchmindException(Exception):
    """Base exception for Benchmind application."""
    
    def __init__(self, message: str, details: Dict[str, Any] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ModelNotFoundError(BenchmindException):
    """Raised when a requested model is not found."""
    pass


class APIKeyError(BenchmindException):
    """Raised when API key is missing or invalid."""
    pass


class BenchmarkError(BenchmindException):
    """Raised when benchmark execution fails."""
    pass


class ConsultantError(BenchmindException):
    """Raised when AI consultant fails."""
    pass


async def benchmind_exception_handler(request: Request, exc: BenchmindException) -> JSONResponse:
    """Handle custom Benchmind exceptions."""
    return JSONResponse(
        status_code=400,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with consistent format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTPException",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "details": {"type": exc.__class__.__name__}
        }
    )
