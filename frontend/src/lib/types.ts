export interface SourceDocument {
  title: string
  source: string
  content: string
  score?: number
  page?: number
}

export interface ReasoningStep {
  step: string
  status: "running" | "complete" | "skipped" | "error"
  detail?: string
  timestamp?: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  sources?: SourceDocument[]
  reasoningSteps?: ReasoningStep[]
  isStreaming?: boolean
  timestamp: string
}

export interface KnowledgeStats {
  collection_name: string
  total_chunks: number
  estimated_articles: number
  articles: Array<{
    title: string
    source: string
    chunk_count: number
  }>
  database_path: string
  model_provider: string
  chat_model: string
  embedding_model: string
}

export interface IngestionResult {
  status: "success" | "warning" | "error"
  message: string
  articles_indexed: Array<{
    title: string
    url: string
    chunks: number
    characters?: number
  }>
  total_chunks: number
  total_characters: number
}

export interface BackendConfig {
  model_provider: string
  chat_model: string
  embedding_provider: string
  embedding_model: string
  has_openai_key: boolean
  has_anthropic_key: boolean
  has_brightdata_key: boolean
  ollama_base_url: string
}
