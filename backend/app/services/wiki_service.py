import os
import glob
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.core.config import settings
from app.services.vector_store import get_chroma_manager
from app.schemas.ingestion import IngestionResult

logger = logging.getLogger(__name__)

class WikipediaService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            is_separator_regex=False,
        )
        self.headers = {
            "User-Agent": settings.WIKIPEDIA_USER_AGENT
        }

    def search_wikipedia_topics(self, query: str, limit: int = 5) -> List[str]:
        """Search Wikipedia for title suggestions matching the query."""
        try:
            import wikipedia
            wikipedia.set_lang("en")
            wikipedia.set_user_agent(settings.WIKIPEDIA_USER_AGENT)
            results = wikipedia.search(query, results=limit)
            return results
        except Exception as e:
            logger.warning(f"wikipedia package search failed ({e}), using Wikipedia REST API")
            try:
                url = "https://en.wikipedia.org/w/api.php"
                params = {
                    "action": "opensearch",
                    "search": query,
                    "limit": limit,
                    "namespace": 0,
                    "format": "json"
                }
                with httpx.Client(headers=self.headers, timeout=10) as client:
                    resp = client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        if len(data) > 1 and isinstance(data[1], list):
                            return data[1]
            except Exception as ex:
                logger.error(f"Fallback search also failed: {ex}")
            return [query]

    def fetch_wikipedia_article(self, title: str) -> Optional[Dict[str, Any]]:
        """Fetch article content, summary, and URL from Wikipedia."""
        try:
            import wikipedia
            wikipedia.set_lang("en")
            wikipedia.set_user_agent(settings.WIKIPEDIA_USER_AGENT)
            page = wikipedia.page(title, auto_suggest=False)
            return {
                "title": page.title,
                "url": page.url,
                "summary": page.summary,
                "content": page.content
            }
        except Exception as e:
            logger.info(f"Direct wikipedia.page lookup failed ({e}), attempting REST fetch")
            # Try MediaWiki API
            try:
                url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
                with httpx.Client(headers=self.headers, timeout=15) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        extract = data.get("extract", "")
                        page_url = data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{title}")
                        return {
                            "title": data.get("title", title),
                            "url": page_url,
                            "summary": extract,
                            "content": extract
                        }
            except Exception as ex:
                logger.error(f"MediaWiki API fetch failed: {ex}")
            return None

    def ingest_topic(self, query: str, max_pages: int = 1) -> IngestionResult:
        """Search, fetch, split, and embed Wikipedia articles for a topic."""
        candidates = self.search_wikipedia_topics(query, limit=max_pages)
        if not candidates:
            candidates = [query]

        chroma_mgr = get_chroma_manager()
        indexed_articles = []
        all_docs: List[Document] = []
        total_chars = 0

        for title in candidates[:max_pages]:
            article = self.fetch_wikipedia_article(title)
            if not article or not article.get("content"):
                continue

            text = article["content"]
            total_chars += len(text)
            chunks = self.text_splitter.create_documents(
                texts=[text],
                metadatas=[{
                    "source": article["url"],
                    "title": article["title"]
                }]
            )
            all_docs.extend(chunks)
            indexed_articles.append({
                "title": article["title"],
                "url": article["url"],
                "chunks": len(chunks),
                "characters": len(text)
            })

        if all_docs:
            chroma_mgr.add_documents(all_docs)
            return IngestionResult(
                status="success",
                message=f"Successfully indexed {len(indexed_articles)} articles ({len(all_docs)} chunks)",
                articles_indexed=indexed_articles,
                total_chunks=len(all_docs),
                total_characters=total_chars
            )
        else:
            return IngestionResult(
                status="warning",
                message=f"No content found on Wikipedia matching '{query}'",
                articles_indexed=[],
                total_chunks=0,
                total_characters=0
            )

    def ingest_from_brightdata_dataset(self) -> IngestionResult:
        """
        Preserves compatibility with the legacy pipeline: reads
        datasets/data.txt (BrightData output), chunks, and embeds.
        """
        data_path = os.path.join(settings.DATASET_STORAGE_FOLDER, "data.txt")
        if not os.path.exists(data_path):
            return IngestionResult(
                status="error",
                message=f"No dataset file found at {data_path}. Trigger BrightData snapshot first.",
                articles_indexed=[]
            )

        extracted = []
        with open(data_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    extracted.append(obj)
                except Exception:
                    pass

        chroma_mgr = get_chroma_manager()
        all_docs = []
        indexed_articles = []
        total_chars = 0

        for item in extracted:
            raw_text = item.get("raw_text") or item.get("content", "")
            title = item.get("title", "BrightData Wikipedia Article")
            url = item.get("url", "https://wikipedia.org")

            if not raw_text:
                continue

            total_chars += len(raw_text)
            chunks = self.text_splitter.create_documents(
                texts=[raw_text],
                metadatas=[{"source": url, "title": title}]
            )
            all_docs.extend(chunks)
            indexed_articles.append({
                "title": title,
                "url": url,
                "chunks": len(chunks)
            })

        if all_docs:
            chroma_mgr.add_documents(all_docs)

        return IngestionResult(
            status="success",
            message=f"Processed BrightData dataset: {len(indexed_articles)} articles, {len(all_docs)} chunks.",
            articles_indexed=indexed_articles,
            total_chunks=len(all_docs),
            total_characters=total_chars
        )

def get_wiki_service() -> WikipediaService:
    return WikipediaService()
