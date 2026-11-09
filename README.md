# 🌐 AskWiki — Enterprise Agentic RAG Platform

**AskWiki** is a production-grade, agentic Knowledge Retrieval-Augmented Generation (RAG) platform. It pairs a **FastAPI** backend orchestrated with **LangGraph**, **LangChain**, and **ChromaDB** with a modern **Next.js**, **Shadcn UI**, and **Tailwind CSS** frontend.

---

## 🏛️ System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          Next.js + Shadcn UI Frontend        │
                    │   - Real-time SSE Token Streaming            │
                    │   - LangGraph Agent Step Visualizer          │
                    │   - Wikipedia Search & Ingest Sidebar        │
                    │   - Knowledge Base Stats & Settings Modal    │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / SSE Stream
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │               FastAPI Backend                │
                    │        (Managed via uv Package Manager)       │
                    └──────────────────────┬───────────────────────┘
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             ▼                                                           ▼
┌───────────────────────────────┐                       ┌───────────────────────────────┐
│     LangGraph CRAG Graph      │                       │     Wikipedia / BrightData    │
│  1. Query Intent Analysis     │                       │  1. Live MediaWiki Search API │
│  2. ChromaDB Retrieval        │                       │  2. Content & Metadata Fetch  │
│  3. Document Relevance Grade  │ ◄── Dynamic Fallback ─┤  3. Text Splitter Overlap     │
│  4. Wiki Live Fallback Ingest │                       │  4. ChromaDB Ingestion        │
│  5. Citation Synthesis        │                       │  5. BrightData Snapshot Import│
└──────────────┬────────────────┘                       └───────────────┬───────────────┘
               │                                                        │
               ▼                                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                     ChromaDB Persistent Vector Store                          │
│     - Embeddings: Ollama (mxbai-embed) / OpenAI (text-embedding-3) / Local    │
│     - L2 / Cosine Similarity Indexing                                         │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Agentic Corrective RAG (CRAG) with LangGraph**:
  - Automatically assesses whether the vector database has enough context to answer.
  - If information is missing or relevance score is low, dynamically queries Wikipedia live, chunks and embeds the article into ChromaDB on the fly, and enriches the prompt.
- **Server-Sent Events (SSE) Streaming**:
  - Real-time token generation streaming directly into the Next.js UI.
  - Live reasoning steps timeline showing current LangGraph node execution.
- **Wikipedia Ingestion Engine**:
  - Interactive right-side panel with debounced search autocomplete for Wikipedia topics.
  - One-click ingestion with progress indicators, chunk counts, and character statistics.
  - Preserves compatibility with BrightData dataset snapshots and batch Excel keywords (`keywords.xlsx`).
- **Modern Next.js Frontend**:
  - Built with Next.js App Router, Tailwind CSS, and Shadcn UI component design patterns.
  - Inline Wikipedia citation badges with preview drawers and direct Wikipedia links.
  - Knowledge Base Explorer (view chunks, indexed articles, or reset database).
  - Runtime LLM Provider switcher (Ollama, OpenAI, Anthropic, or Local Synthesizer).
- **Fast, Modern Python Tooling (`uv`)**:
  - Instant dependency resolution, isolated virtual environments, and lockfiles powered by `uv`.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI patterns |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, `sse-starlette` |
| **Package Manager** | `uv` (Fastest Python package resolver and runner) |
| **RAG & Agents** | LangGraph (`StateGraph`), LangChain Core, LangChain Community |
| **Vector Database** | ChromaDB (`langchain-chroma`) with persistent local disk storage |
| **LLM Support** | Ollama (`llama3.2`, `mistral`), OpenAI (`gpt-4o-mini`), Anthropic, Local Synthesizer fallback |
| **Ingestion** | Wikipedia MediaWiki REST API, `RecursiveCharacterTextSplitter`, BrightData Datasets |

---

## 🏁 Quickstart

### 1. Prerequisites
- **uv**: Python package manager (`pip install uv` or `winget install astral-sh.uv`)
- **Node.js**: v20+ (`npm`)
- *(Optional)* **Ollama**: running locally (`ollama run llama3.2:3b`) OR an **OpenAI API Key**

---

### 2. Backend Setup (with `uv`)

```bash
cd backend

# Install dependencies into uv virtual environment
uv sync

# Run database tests to verify pipeline
uv run pytest tests/

# Launch the FastAPI backend server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### 3. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Run Next.js in development mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (or inside `backend/`):

```bash
# LLM Provider: "ollama", "openai", "anthropic", or "demo"
MODEL_PROVIDER=ollama
CHAT_MODEL=llama3.2:3b
TEMPERATURE=0.1

# Ollama Endpoint
OLLAMA_BASE_URL=http://localhost:11434

# OpenAI (if using OpenAI models)
OPENAI_API_KEY=sk-...

# Embeddings: "auto", "ollama", "openai", or "local"
EMBEDDING_PROVIDER=auto
EMBEDDING_MODEL=mxbai-embed-large

# ChromaDB
DATABASE_LOCATION=chroma_db
COLLECTION_NAME=rag_data

# Optional: Bright Data Datasets API
BRIGHTDATA_API_KEY=
DATASET_STORAGE_FOLDER=datasets/
SNAPSHOT_STORAGE_FILE=snapshot.txt
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check & vector store chunk count |
| `POST` | `/api/chat` | Synchronous RAG query with citations and reasoning |
| `POST` | `/api/chat/stream` | Server-Sent Events (SSE) streaming endpoint |
| `GET` | `/api/ingest/search` | Live Wikipedia article title autocomplete |
| `POST` | `/api/ingest/wiki` | Scrapes, splits, embeds, and indexes a Wikipedia topic |
| `POST` | `/api/ingest/batch` | Batch ingest list of keywords |
| `POST` | `/api/ingest/brightdata` | Ingest from `datasets/data.txt` (BrightData snapshot) |
| `GET` | `/api/knowledge/stats` | View indexed articles, chunk count, and database path |
| `POST` | `/api/knowledge/reset` | Empties the ChromaDB collection |
| `GET` | `/api/config` | View active models, providers, and key status |
| `POST` | `/api/config` | Dynamically update LLM provider and model runtime |

---

## 🧪 Testing

Run backend tests using `uv`:

```bash
cd backend
uv run pytest tests/ -v
```
