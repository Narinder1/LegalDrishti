"""
LegalDrishti Backend - Main FastAPI Application
Clean, modular structure for scalability
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1 import router as api_v1_router
from app.services.llm_service import get_llm_service
from app.core.database import init_db, close_db, AsyncSessionLocal
from app.services.auth_service import auth_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler
    - Startup: Initialize services
    - Shutdown: Cleanup resources
    """
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Environment: {settings.ENVIRONMENT}")
    
    # Initialize Database
    print("🔄 Initializing database...")
    try:
        await init_db()
        print("✅ Database initialized")
        
        # Seed admin user
        async with AsyncSessionLocal() as db:
            await auth_service.seed_admin(db)
    except Exception as e:
        print(f"⚠️ Database initialization failed: {e}")
        print("   (App will continue, but auth features may not work)")
    
    # Initialize LLM service (checks Ollama connection)
    llm = get_llm_service()
    
    print(f"✅ {settings.APP_NAME} is ready!")
    print(f"📚 API Docs: http://localhost:8000/docs")
    
    yield  # App is running
    
    # Shutdown
    print(f"👋 Shutting down {settings.APP_NAME}...")
    await close_db()


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    LegalDrishti API - AI-powered Legal Assistant for India
    
    ## Features
    - 🤖 AI Chat Assistant (powered by Ollama + Gemma)
    - 📄 Document Processing (coming soon)
    - 🔍 Legal Search (coming soon)
    - 📝 Template Management (coming soon)
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# ===================
# Middleware
# ===================

# CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================
# Routers
# ===================

# API v1 routes
app.include_router(api_v1_router, prefix="/api")

# Serve uploaded files as static files
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Legacy routes for backward compatibility with frontend
from app.api.v1 import chat as chat_v1
app.include_router(chat_v1.router, prefix="/api/chat", tags=["Chat (Legacy)"])


# ===================
# Root Endpoints
# ===================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "message": "Welcome to LegalDrishti API",
        "docs": "/docs",
        "api": "/api/v1"
    }


@app.get("/health")
async def health():
    """Simple health check"""
    llm = get_llm_service()
    return {
        "status": "healthy" if llm.is_available else "degraded",
        "version": settings.APP_VERSION,
        "ollama": llm.is_available
    }


# ===================
# Run with: python -m app.main
# ===================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

