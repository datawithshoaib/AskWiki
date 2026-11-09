from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List, Optional
from pathlib import Path
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General API Configuration
    PROJECT_NAME: str = "AskWiki - Enterprise RAG Assistant"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

    # ChromaDB Vector Store
    DATABASE_LOCATION: str = Field(default="chroma_db", description="Path to ChromaDB persistent storage")
    COLLECTION_NAME: str = Field(default="rag_data", description="ChromaDB collection name")
    
    # LLM Configuration
    MODEL_PROVIDER: str = Field(default="ollama", description="Provider: ollama, openai, anthropic, or demo")
    CHAT_MODEL: str = Field(default="llama3.2:3b", description="Model name")
    TEMPERATURE: float = Field(default=0.1, description="Sampling temperature")
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama endpoint")

    # Embeddings Configuration
    EMBEDDING_PROVIDER: str = Field(default="auto", description="Provider: auto, ollama, openai, or local")
    EMBEDDING_MODEL: str = Field(default="mxbai-embed-large", description="Embedding model name")

    # Wikipedia / Data Ingestion
    DATASET_STORAGE_FOLDER: str = Field(default="datasets/", description="Folder for ingested datasets")
    SNAPSHOT_STORAGE_FILE: str = Field(default="snapshot.txt", description="BrightData snapshot tracker")
    BRIGHTDATA_API_KEY: Optional[str] = None
    WIKIPEDIA_USER_AGENT: str = "AskWiki/2.0 (enterprise-agentic-rag; +https://github.com/datawithshoaib/AskWiki)"

    # Text Splitting & RAG Tuning
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    TOP_K_RETRIEVAL: int = 4

    @property
    def resolved_db_path(self) -> str:
        # Resolve path relative to backend if needed
        p = Path(self.DATABASE_LOCATION)
        if not p.is_absolute():
            # Check if root chroma_db exists
            root_p = Path(__file__).resolve().parent.parent.parent.parent / self.DATABASE_LOCATION
            if root_p.exists():
                return str(root_p)
            return str(p.resolve())
        return str(p)

settings = Settings()
