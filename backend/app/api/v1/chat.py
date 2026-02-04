"""
Chat API v1 - Legal Assistant chat endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from app.schemas.chat import ChatRequest, ChatResponse, QuickActionRequest, ModelInfoResponse
from app.services.llm_service import LLMService
from app.core.dependencies import get_llm_service

router = APIRouter()


# Quick action prompts mapping
QUICK_ACTIONS: Dict[str, str] = {
    "search_lawyers": "I'm looking for a corporate lawyer in India. What should I consider when choosing one?",
    "file_case": "How can I file a case online in India? Explain the e-filing process briefly.",
    "legal_advice": "What are the common legal issues people face and how can a legal platform help?",
    "find_templates": "What types of legal document templates are commonly needed?",
    "understand_rights": "What are my basic legal rights as a citizen of India?",
    "contract_basics": "Explain the basic elements required for a valid contract in India."
}


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    llm: LLMService = Depends(get_llm_service)
):
    """
    Main chat endpoint for Legal Assistant
    
    - **message**: User's question or message
    - **history**: Optional list of previous messages for context
    - **persona**: AI persona (default: legal_assistant)
    """
    try:
        # Convert history to dict format
        history = None
        if request.history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.history]
        
        # Generate response
        response_text = llm.chat(
            message=request.message,
            history=history,
            persona=request.persona or "legal_assistant"
        )
        
        return ChatResponse(response=response_text, success=True)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


@router.post("/quick-action", response_model=ChatResponse)
async def quick_action(
    request: QuickActionRequest,
    llm: LLMService = Depends(get_llm_service)
):
    """
    Handle quick action buttons
    
    - **action**: Quick action identifier (e.g., "search_lawyers", "file_case")
    """
    try:
        # Get the prompt for the quick action, or use action as prompt
        prompt = QUICK_ACTIONS.get(request.action, request.action)
        
        # Generate response
        response_text = llm.generate(prompt=prompt)
        
        return ChatResponse(response=response_text, success=True)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process quick action: {str(e)}"
        )


@router.get("/quick-actions")
async def list_quick_actions():
    """
    Get list of available quick actions
    """
    return {
        "actions": list(QUICK_ACTIONS.keys()),
        "descriptions": {
            "search_lawyers": "Find and search for lawyers",
            "file_case": "Learn how to file a case online",
            "legal_advice": "Get general legal guidance",
            "find_templates": "Browse legal document templates",
            "understand_rights": "Learn about your legal rights",
            "contract_basics": "Understand contract basics"
        }
    }


@router.get("/model-info", response_model=ModelInfoResponse)
async def model_info(llm: LLMService = Depends(get_llm_service)):
    """
    Get information about the loaded LLM model
    """
    return llm.get_info()
