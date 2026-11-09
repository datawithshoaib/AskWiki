from fastapi import APIRouter
from app.api.routes_chat import router as chat_router
from app.api.routes_ingest import router as ingest_router
from app.api.routes_knowledge import router as knowledge_router
from app.api.routes_config import router as config_router

api_router = APIRouter()

api_router.include_router(chat_router)
api_router.include_router(ingest_router)
api_router.include_router(knowledge_router)
api_router.include_router(config_router)
