import logging
import hashlib
import urllib.request
import numpy as np
from typing import List
from langchain_core.embeddings import Embeddings
from app.core.config import settings

logger = logging.getLogger(__name__)

def is_ollama_online(base_url: str) -> bool:
    try:
        req = urllib.request.Request(f"{base_url}/api/tags", headers={"User-Agent": "AskWikiHealthCheck"})
        with urllib.request.urlopen(req, timeout=0.8) as resp:
            return resp.status == 200
    except Exception:
        return False

class DeterministicHashEmbeddings(Embeddings):
    """
    High-dimensional deterministic feature hashing embedding provider.
    Serves as an instant, zero-dependency offline fallback when neither
    an Ollama daemon nor an OpenAI API key is active.
    Produces 384-dimensional normalized vectors with cosine similarity
    characteristics suitable for local vector search.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def _embed_text(self, text: str) -> List[float]:
        tokens = text.lower().replace("\n", " ").split()
        if not tokens:
            return [0.0] * self.dim

        vec = np.zeros(self.dim, dtype=np.float32)
        for token in tokens:
            h1 = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16) % self.dim
            h2 = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16) % self.dim
            vec[h1] += 1.0
            vec[h2] += 0.5

        for i in range(len(tokens) - 1):
            bigram = f"{tokens[i]}_{tokens[i+1]}"
            h = int(hashlib.sha1(bigram.encode('utf-8')).hexdigest(), 16) % self.dim
            vec[h] += 1.5

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_text(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_text(text)


def get_embedding_function() -> Embeddings:
    """
    Factory resolving the appropriate embedding model based on environment settings.
    """
    provider = settings.EMBEDDING_PROVIDER.lower()

    if provider == "openai" or (provider == "auto" and settings.OPENAI_API_KEY):
        try:
            from langchain_openai import OpenAIEmbeddings
            logger.info("Initializing OpenAI Embeddings...")
            return OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL or "text-embedding-3-small",
                api_key=settings.OPENAI_API_KEY
            )
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI Embeddings: {e}")

    if provider in ["ollama", "auto"]:
        if is_ollama_online(settings.OLLAMA_BASE_URL):
            try:
                from langchain_ollama import OllamaEmbeddings
                logger.info(f"Initializing Ollama Embeddings ({settings.EMBEDDING_MODEL})...")
                return OllamaEmbeddings(
                    model=settings.EMBEDDING_MODEL,
                    base_url=settings.OLLAMA_BASE_URL
                )
            except Exception as e:
                logger.warning(f"Could not initialize Ollama Embeddings: {e}")
        else:
            logger.info(f"Ollama daemon not detected at {settings.OLLAMA_BASE_URL}. Using deterministic local embeddings.")

    logger.info("Using Deterministic local embeddings")
    return DeterministicHashEmbeddings()
