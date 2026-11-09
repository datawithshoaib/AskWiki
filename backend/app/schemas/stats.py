from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KnowledgeStats(BaseModel):
    collection_name: str
    total_chunks: int
    estimated_articles: int
    articles: List[Dict[str, Any]] = []
    database_path: str
    model_provider: str
    chat_model: str
    embedding_model: str
