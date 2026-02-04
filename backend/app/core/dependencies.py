"""
FastAPI Dependencies
Reusable dependencies for route handlers
"""
from typing import Generator
from app.services.llm_service import LLMService


def get_llm_service() -> LLMService:
    """
    Get LLM service instance (singleton)
    Usage: llm = Depends(get_llm_service)
    """
    return LLMService.get_instance()


# Future dependencies can be added here:
# - get_db() - Database session
# - get_current_user() - Auth dependency
# - get_redis() - Redis client
