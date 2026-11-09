import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.services.vector_store import get_chroma_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("askwiki")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    try:
        # Pre-initialize ChromaDB
        mgr = get_chroma_manager()
        logger.info(f"Connected to ChromaDB storage at: {mgr.persist_dir}")
    except Exception as e:
        logger.warning(f"Could not warm up vector store on startup: {e}")
    yield
    logger.info("Shutting down AskWiki application.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-Ready Agentic RAG Platform with LangGraph, LangChain, ChromaDB, and FastAPI",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }

@app.get("/health", tags=["Health"])
async def health_check():
    mgr = get_chroma_manager()
    stats = mgr.get_stats()
    return {
        "status": "healthy",
        "vector_store": {
            "collection": settings.COLLECTION_NAME,
            "total_chunks": stats.get("total_chunks", 0),
        },
        "model_provider": settings.MODEL_PROVIDER,
        "chat_model": settings.CHAT_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
