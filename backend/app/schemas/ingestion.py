from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class WikiIngestRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Wikipedia article title or topic to search and ingest")
    max_pages: int = Field(default=1, ge=1, le=5, description="Number of articles to scrape")
    auto_chunk: bool = Field(default=True, description="Whether to automatically chunk and embed")

class WikiBatchIngestRequest(BaseModel):
    keywords: List[str] = Field(..., min_length=1, description="List of keywords to search and ingest")
    pages_per_keyword: int = Field(default=1, ge=1, le=5)

class BrightDataTriggerRequest(BaseModel):
    dataset_id: str = "gd_lr9978962kkjr3nx49"
    keywords: Optional[List[str]] = None

class IngestionResult(BaseModel):
    status: str
    message: str
    articles_indexed: List[Dict[str, Any]] = Field(default_factory=list)
    total_chunks: int = 0
    total_characters: int = 0
