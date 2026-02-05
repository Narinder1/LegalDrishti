"""
API v1 module - Version 1 of the API
"""
from fastapi import APIRouter

# Create v1 router
router = APIRouter(prefix="/v1")

# Import and include sub-routers
from app.api.v1 import chat, health, auth

router.include_router(auth.router, tags=["Authentication"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
router.include_router(health.router, tags=["Health"])

