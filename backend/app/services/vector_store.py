import os
import shutil
import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import uuid4
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.core.config import settings
from app.services.embeddings import get_embedding_function

logger = logging.getLogger(__name__)

class ChromaManager:
    _instance: Optional["ChromaManager"] = None
    _vector_store: Optional[Chroma] = None

    def __init__(self):
        self.persist_dir = settings.resolved_db_path
        self.collection_name = settings.COLLECTION_NAME
        self._init_store()

    def _init_store(self):
        os.makedirs(self.persist_dir, exist_ok=True)
        embeddings = get_embedding_function()
        self._vector_store = Chroma(
            collection_name=self.collection_name,
            embedding_function=embeddings,
            persist_directory=self.persist_dir,
        )
        logger.info(f"ChromaDB initialized at {self.persist_dir} (Collection: {self.collection_name})")

    @classmethod
    def get_instance(cls) -> "ChromaManager":
        if cls._instance is None:
            cls._instance = ChromaManager()
        return cls._instance

    @property
    def vector_store(self) -> Chroma:
        if self._vector_store is None:
            self._init_store()
        return self._vector_store

    def add_documents(self, documents: List[Document]) -> List[str]:
        if not documents:
            return []
        ids = [str(uuid4()) for _ in range(len(documents))]
        self.vector_store.add_documents(documents=documents, ids=ids)
        logger.info(f"Added {len(documents)} documents to Chroma collection {self.collection_name}")
        return ids

    def similarity_search_with_scores(self, query: str, k: int = 4) -> List[Tuple[Document, float]]:
        try:
            results = self.vector_store.similarity_search_with_relevance_scores(query, k=k)
            cleaned = []
            for doc, score in results:
                norm_score = max(0.0, min(1.0, float(score)))
                cleaned.append((doc, norm_score))
            return cleaned
        except Exception as e:
            logger.warning(f"similarity_search_with_relevance_scores failed ({e}), falling back to standard search")
            docs = self.vector_store.similarity_search(query, k=k)
            return [(d, 0.85) for d in docs]

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        return self.vector_store.similarity_search(query, k=k)

    def get_stats(self) -> Dict[str, Any]:
        try:
            col = self.vector_store._collection
            count = col.count()
            # Sample metadata to find indexed articles
            data = col.get(limit=200, include=["metadatas"])
            metas = data.get("metadatas", []) or []
            
            articles_map = {}
            for m in metas:
                if not m:
                    continue
                title = m.get("title", "Unknown")
                source = m.get("source", "")
                if title not in articles_map:
                    articles_map[title] = {
                        "title": title,
                        "source": source,
                        "chunk_count": 0
                    }
                articles_map[title]["chunk_count"] += 1

            return {
                "collection_name": self.collection_name,
                "total_chunks": count,
                "estimated_articles": len(articles_map),
                "articles": list(articles_map.values()),
                "database_path": self.persist_dir,
            }
        except Exception as e:
            logger.error(f"Error getting Chroma stats: {e}")
            return {
                "collection_name": self.collection_name,
                "total_chunks": 0,
                "estimated_articles": 0,
                "articles": [],
                "database_path": self.persist_dir,
                "error": str(e)
            }

    def reset(self) -> bool:
        try:
            self.vector_store.delete_collection()
            self._init_store()
            return True
        except Exception as e:
            logger.error(f"Error resetting collection: {e}")
            if os.path.exists(self.persist_dir):
                shutil.rmtree(self.persist_dir, ignore_errors=True)
            self._init_store()
            return True

def get_chroma_manager() -> ChromaManager:
    return ChromaManager.get_instance()
