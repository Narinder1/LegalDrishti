"""
Health API - Health check and status endpoints
"""
from fastapi import APIRouter, Depends
from datetime import datetime
from app.schemas.common import HealthResponse
from app.services.llm_service import LLMService
from app.core.dependencies import get_llm_service
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(llm: LLMService = Depends(get_llm_service)):
    """
    Comprehensive health check endpoint
    Returns status of all services
    """
    return HealthResponse(
        status="healthy" if llm.is_available else "degraded",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow(),
        services={
            "api": True,
            "ollama": llm.is_available
        }
    )


@router.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": "/api/health"
    }
