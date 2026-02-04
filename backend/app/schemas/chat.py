"""
Chat Schemas - Request/Response models for chat endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = Field(default=None, description="Message timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "What is a contract?"
            }
        }


class ChatRequest(BaseModel):
    """Chat request payload"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous chat messages")
    persona: Optional[str] = Field(default="legal_assistant", description="AI persona to use")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "What is a contract?",
                "history": [],
                "persona": "legal_assistant"
            }
        }


class ChatResponse(BaseModel):
    """Chat response payload"""
    response: str = Field(..., description="AI response")
    success: bool = Field(default=True, description="Whether request was successful")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "A contract is a legally binding agreement between two or more parties.",
                "success": True
            }
        }


class QuickActionRequest(BaseModel):
    """Quick action request"""
    action: str = Field(..., description="Quick action identifier")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action": "explain_contract"
            }
        }


class ModelInfoResponse(BaseModel):
    """Model information response"""
    provider: str
    model: str
    url: str
    available: bool
    max_tokens: int
    temperature: float
