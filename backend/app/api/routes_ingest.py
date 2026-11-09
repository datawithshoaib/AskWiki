from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.ingestion import WikiIngestRequest, WikiBatchIngestRequest, IngestionResult
from app.services.wiki_service import get_wiki_service

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.get("/search", response_model=List[str])
async def search_wiki_topics(q: str = Query(..., min_length=1, description="Wikipedia search term")):
    """Live search Wikipedia article titles for autocomplete / discovery."""
    wiki_svc = get_wiki_service()
    results = wiki_svc.search_wikipedia_topics(q, limit=6)
    return results

@router.post("/wiki", response_model=IngestionResult)
async def ingest_wiki_topic(request: WikiIngestRequest):
    """
    Scrape, chunk, and embed one or more Wikipedia articles matching a query or topic.
    """
    wiki_svc = get_wiki_service()
    result = wiki_svc.ingest_topic(query=request.query, max_pages=request.max_pages)
    return result

@router.post("/batch", response_model=IngestionResult)
async def ingest_batch_topics(request: WikiBatchIngestRequest):
    """
    Batch scrape and ingest a list of topics (e.g. from an Excel keyword list).
    """
    wiki_svc = get_wiki_service()
    all_indexed = []
    total_chunks = 0
    total_chars = 0

    for kw in request.keywords:
        res = wiki_svc.ingest_topic(query=kw, max_pages=request.pages_per_keyword)
        all_indexed.extend(res.articles_indexed)
        total_chunks += res.total_chunks
        total_chars += res.total_characters

    return IngestionResult(
        status="success",
        message=f"Batch ingestion complete: indexed {len(all_indexed)} articles across {len(request.keywords)} keywords.",
        articles_indexed=all_indexed,
        total_chunks=total_chunks,
        total_characters=total_chars
    )

@router.post("/brightdata", response_model=IngestionResult)
async def ingest_brightdata_dataset():
    """
    Ingest articles from datasets/data.txt (BrightData pipeline output).
    """
    wiki_svc = get_wiki_service()
    result = wiki_svc.ingest_from_brightdata_dataset()
    return result
