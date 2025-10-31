"""
Benchmind FastAPI Application
AI Model Evaluation Platform with Green AI Observability
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.logging import setup_logging, get_logger
from .core.exceptions import (
    BenchmindException,
    benchmind_exception_handler,
    http_exception_handler,
    general_exception_handler
)


setup_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    yield


def create_app() -> FastAPI:
    """Application factory."""
    
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_exception_handler(BenchmindException, benchmind_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    from .routers import models, consultant, test_ecologits, auth, user, run
    from .routers import settings as settings_router
    app.include_router(auth.router)
    app.include_router(user.router)
    app.include_router(user.profile_router)
    app.include_router(settings_router.router)
    app.include_router(run.router)
    app.include_router(models.router)
    app.include_router(consultant.router)
    app.include_router(test_ecologits.router)
    
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "message": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "endpoints": {
                "auth_signup": "/auth/signup",
                "auth_login": "/auth/login",
                "user_status": "/user/status",
                "models": "/models",
                "ai_consultant": "/ai-consultant",
                "test_ecologits_get": "/test/ecologits-simple",
                "test_ecologits_post": "/test/ecologits",
                "docs": "/docs",
                "health": "/health"
            }
        }
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": settings.app_version,
            "mistral_api_configured": bool(settings.mistral_api_key),
            "gemini_api_configured": bool(settings.gemini_api_key)
        }
    
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
