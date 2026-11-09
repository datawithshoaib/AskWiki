from fastapi import APIRouter, HTTPException
from app.schemas.stats import KnowledgeStats
from app.services.vector_store import get_chroma_manager
from app.core.config import settings

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

@router.get("/stats", response_model=KnowledgeStats)
async def get_knowledge_stats():
    """Retrieve statistics about the ChromaDB vector database and indexed content."""
    chroma_mgr = get_chroma_manager()
    stats = chroma_mgr.get_stats()
    
    return KnowledgeStats(
        collection_name=stats.get("collection_name", settings.COLLECTION_NAME),
        total_chunks=stats.get("total_chunks", 0),
        estimated_articles=stats.get("estimated_articles", 0),
        articles=stats.get("articles", []),
        database_path=stats.get("database_path", settings.resolved_db_path),
        model_provider=settings.MODEL_PROVIDER,
        chat_model=settings.CHAT_MODEL,
        embedding_model=settings.EMBEDDING_MODEL,
    )

@router.post("/reset")
async def reset_knowledge_base():
    """Clear all documents and chunks from the ChromaDB collection."""
    chroma_mgr = get_chroma_manager()
    success = chroma_mgr.reset()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reset ChromaDB collection.")
    return {"status": "success", "message": "Knowledge base collection reset successfully."}
