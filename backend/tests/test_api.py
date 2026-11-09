import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "vector_store" in data

def test_stats():
    response = client.get("/api/knowledge/stats")
    assert response.status_code == 200
    data = response.json()
    assert "collection_name" in data
    assert "total_chunks" in data

def test_search_wiki():
    response = client.get("/api/ingest/search?q=Python")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_chat():
    response = client.post(
        "/api/chat",
        json={"query": "What is Python?", "history": [], "stream": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0
    assert "reasoning_steps" in data
    assert len(data["reasoning_steps"]) > 0
