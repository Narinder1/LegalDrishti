"""
Common Schemas - Shared response models
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(default="healthy", description="Service status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Optional[dict] = Field(default=None, description="Status of dependent services")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-01-01T00:00:00Z",
                "services": {"ollama": True, "database": True}
            }
        }


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = Field(default=False)
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(default=None, description="Detailed error info")
    code: Optional[str] = Field(default=None, description="Error code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Invalid request",
                "detail": "Message field is required",
                "code": "VALIDATION_ERROR"
            }
        }


class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = Field(default=True)
    message: str = Field(..., description="Success message")
    data: Optional[Any] = Field(default=None, description="Response data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": None
            }
        }


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: list = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
