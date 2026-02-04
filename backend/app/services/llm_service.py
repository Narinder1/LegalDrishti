"""
LLM Service - Ollama Integration
Uses local Ollama with gemma3:1b model
100% Open Source - No API keys needed
"""
import httpx
from typing import Optional, List, Dict
from app.core.config import settings


# System prompts for different use cases
SYSTEM_PROMPTS = {
    "legal_assistant": """You are LegalDrishti Assistant, an AI legal helper for India.
Give SHORT, helpful answers (2-3 sentences max). 
For specific legal matters, recommend consulting a qualified lawyer.""",
    
    "document_analysis": """You are a document analysis assistant.
Extract and summarize key information from legal documents.
Be precise and factual.""",
    
    "general": """You are a helpful AI assistant.
Provide clear and concise responses."""
}


class LLMService:
    """
    LLM Service using Ollama
    Singleton pattern - only one instance created
    """
    _instance: Optional['LLMService'] = None
    _client: Optional[httpx.Client] = None
    _is_available: bool = False
    
    @classmethod
    def get_instance(cls) -> 'LLMService':
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        """Initialize LLM service"""
        if LLMService._client is None:
            LLMService._client = httpx.Client(timeout=settings.OLLAMA_TIMEOUT)
            self._check_ollama()
    
    def _check_ollama(self) -> None:
        """Check if Ollama is running and model is available"""
        try:
            response = LLMService._client.get(
                f"{settings.OLLAMA_URL}/api/tags",
                timeout=5.0
            )
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                
                # Check if our model is available
                if any(settings.OLLAMA_MODEL in name for name in model_names):
                    LLMService._is_available = True
                    print(f"✅ Ollama connected: {settings.OLLAMA_URL}")
                    print(f"✅ Model ready: {settings.OLLAMA_MODEL}")
                else:
                    print(f"⚠️ Model '{settings.OLLAMA_MODEL}' not found in Ollama")
                    print(f"   Available models: {model_names}")
                    print(f"   Run: ollama pull {settings.OLLAMA_MODEL}")
            else:
                print(f"⚠️ Ollama returned status: {response.status_code}")
        except httpx.ConnectError:
            print(f"⚠️ Cannot connect to Ollama at {settings.OLLAMA_URL}")
            print("   Start Ollama with: ollama serve")
        except Exception as e:
            print(f"⚠️ Ollama check failed: {str(e)}")
    
    @property
    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return LLMService._is_available
    
    def generate(
        self,
        prompt: str,
        system_prompt: str = None,
        max_tokens: int = None,
        temperature: float = None,
        stream: bool = False
    ) -> str:
        """
        Generate response from LLM
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt (uses default if not provided)
            max_tokens: Max tokens to generate
            temperature: Randomness (0.0-1.0)
            stream: Stream response (not implemented yet)
        
        Returns:
            Generated text response
        """
        if not LLMService._is_available:
            return "⚠️ LLM service not available. Please ensure Ollama is running."
        
        # Use defaults from settings
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        temperature = temperature or settings.LLM_TEMPERATURE
        system_prompt = system_prompt or SYSTEM_PROMPTS["legal_assistant"]
        
        # Build full prompt
        full_prompt = f"{system_prompt}\n\nUser: {prompt}\n\nAssistant:"
        
        try:
            response = LLMService._client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data.get("response", "").strip()
                # Remove "Assistant:" prefix if model includes it
                if result.lower().startswith("assistant:"):
                    result = result[10:].strip()
                return result
            else:
                return f"Error: Ollama returned status {response.status_code}"
                
        except httpx.ConnectError:
            LLMService._is_available = False
            return "⚠️ Lost connection to Ollama. Please restart Ollama."
        except httpx.TimeoutException:
            return "⚠️ Request timed out. Please try again."
        except Exception as e:
            return f"Error: {str(e)}"
    
    def chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        persona: str = "legal_assistant"
    ) -> str:
        """
        Chat with context history
        
        Args:
            message: Current user message
            history: List of previous messages [{"role": "user/assistant", "content": "..."}]
            persona: Which system prompt to use
        
        Returns:
            Assistant response
        """
        system_prompt = SYSTEM_PROMPTS.get(persona, SYSTEM_PROMPTS["general"])
        
        # Build conversation context
        context = ""
        if history:
            for msg in history[-6:]:  # Last 6 messages for context
                role = "User" if msg.get("role") == "user" else "Assistant"
                context += f"{role}: {msg.get('content', '')}\n"
        
        # Build final prompt
        if context:
            prompt = f"{context}User: {message}"
        else:
            prompt = message
        
        return self.generate(
            prompt=prompt,
            system_prompt=system_prompt
        )
    
    def get_info(self) -> dict:
        """Get service information"""
        return {
            "provider": "Ollama",
            "model": settings.OLLAMA_MODEL,
            "url": settings.OLLAMA_URL,
            "available": LLMService._is_available,
            "max_tokens": settings.LLM_MAX_TOKENS,
            "temperature": settings.LLM_TEMPERATURE
        }


# Convenience function
def get_llm_service() -> LLMService:
    """Get LLM service instance"""
    return LLMService.get_instance()

