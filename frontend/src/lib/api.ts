import { BackendConfig, IngestionResult, KnowledgeStats, SourceDocument, ReasoningStep } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export async function fetchHealth() {
  const res = await fetch("http://localhost:8000/health", { cache: "no-store" })
  if (!res.ok) throw new Error("Backend offline")
  return res.json()
}

export async function fetchStats(): Promise<KnowledgeStats> {
  const res = await fetch(`${API_BASE}/knowledge/stats`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch knowledge base stats")
  return res.json()
}

export async function fetchConfig(): Promise<BackendConfig> {
  const res = await fetch(`${API_BASE}/config`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch config")
  return res.json()
}

export async function updateConfig(payload: {
  model_provider?: string
  chat_model?: string
  openai_api_key?: string
}): Promise<any> {
  const res = await fetch(`${API_BASE}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to update config")
  return res.json()
}

export async function resetKnowledgeBase(): Promise<any> {
  const res = await fetch(`${API_BASE}/knowledge/reset`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to reset knowledge base")
  return res.json()
}

export async function searchWikiSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return []
  const res = await fetch(`${API_BASE}/ingest/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return res.json()
}

export async function ingestWikipediaTopic(query: string, maxPages: number = 1): Promise<IngestionResult> {
  const res = await fetch(`${API_BASE}/ingest/wiki`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, max_pages: maxPages }),
  })
  if (!res.ok) throw new Error("Failed to ingest Wikipedia topic")
  return res.json()
}

export async function ingestBatchKeywords(keywords: string[]): Promise<IngestionResult> {
  const res = await fetch(`${API_BASE}/ingest/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords, pages_per_keyword: 1 }),
  })
  if (!res.ok) throw new Error("Failed to ingest batch keywords")
  return res.json()
}

export interface StreamCallbacks {
  onStep?: (step: ReasoningStep) => void
  onSources?: (sources: SourceDocument[]) => void
  onToken?: (token: string) => void
  onDone?: (fullAnswer: string) => void
  onError?: (err: string) => void
}

export async function streamChatMessage(
  query: string,
  history: Array<{ role: string; content: string }>,
  callbacks: StreamCallbacks
) {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        query,
        history,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`)
    }

    if (!response.body) {
      throw new Error("No readable stream response")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        
        try {
          const rawData = trimmed.slice(6)
          const parsed = JSON.parse(rawData)

          if (parsed.event === "step" && callbacks.onStep) {
            callbacks.onStep(parsed.data)
          } else if (parsed.event === "sources" && callbacks.onSources) {
            callbacks.onSources(parsed.data)
          } else if (parsed.event === "token" && callbacks.onToken) {
            callbacks.onToken(parsed.data)
          } else if (parsed.event === "done" && callbacks.onDone) {
            callbacks.onDone(parsed.data.full_answer)
          } else if (parsed.event === "error" && callbacks.onError) {
            callbacks.onError(parsed.data)
          }
        } catch (e) {
          console.error("Error parsing SSE frame", e, line)
        }
      }
    }
  } catch (err: any) {
    if (callbacks.onError) {
      callbacks.onError(err.message || "Failed to communicate with RAG agent")
    }
  }
}
