from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

router = APIRouter(prefix="/config", tags=["Configuration"])

class ConfigUpdateRequest(BaseModel):
    model_provider: Optional[str] = None
    chat_model: Optional[str] = None
    openai_api_key: Optional[str] = None
    embedding_provider: Optional[str] = None

@router.get("")
async def get_current_config():
    """Get active runtime provider and model settings."""
    return {
        "model_provider": settings.MODEL_PROVIDER,
        "chat_model": settings.CHAT_MODEL,
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL,
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_anthropic_key": bool(settings.ANTHROPIC_API_KEY),
        "has_brightdata_key": bool(settings.BRIGHTDATA_API_KEY),
        "ollama_base_url": settings.OLLAMA_BASE_URL,
    }

@router.post("")
async def update_runtime_config(req: ConfigUpdateRequest):
    """Update runtime configurations dynamically."""
    if req.model_provider:
        settings.MODEL_PROVIDER = req.model_provider
    if req.chat_model:
        settings.CHAT_MODEL = req.chat_model
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.embedding_provider:
        settings.EMBEDDING_PROVIDER = req.embedding_provider

    return {
        "status": "success",
        "message": "Configuration updated",
        "config": {
            "model_provider": settings.MODEL_PROVIDER,
            "chat_model": settings.CHAT_MODEL,
            "embedding_provider": settings.EMBEDDING_PROVIDER,
        }
    }
