"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Sparkles, CheckCircle2, AlertCircle, Loader2, BookOpen, Layers, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { searchWikiSuggestions, ingestWikipediaTopic, ingestBatchKeywords } from "@/lib/api"
import { IngestionResult } from "@/lib/types"

interface WikipediaIngestPanelProps {
  onIngestSuccess?: () => void
}

const PRESET_TOPICS = [
  "Python (programming language)",
  "LangChain",
  "Vector database",
  "Artificial intelligence",
  "FastAPI",
  "Quantum computing",
]

export function WikipediaIngestPanel({ onIngestSuccess }: WikipediaIngestPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [lastResult, setLastResult] = useState<IngestionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Debounced search for Wikipedia suggestions
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchWikiSuggestions(searchTerm)
        setSuggestions(results)
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleIngest = async (topic: string) => {
    if (!topic.trim() || isIngesting) return
    setIsIngesting(true)
    setError(null)
    setLastResult(null)

    try {
      const result = await ingestWikipediaTopic(topic, 1)
      setLastResult(result)
      setSearchTerm("")
      setSuggestions([])
      if (onIngestSuccess) onIngestSuccess()
    } catch (err: any) {
      setError(err.message || "Ingestion failed")
    } finally {
      setIsIngesting(false)
    }
  }

  const handleBatchPresets = async () => {
    if (isIngesting) return
    setIsIngesting(true)
    setError(null)
    setLastResult(null)

    try {
      const result = await ingestBatchKeywords(["Python (programming language)", "LangChain"])
      setLastResult(result)
      if (onIngestSuccess) onIngestSuccess()
    } catch (err: any) {
      setError(err.message || "Batch ingestion failed")
    } finally {
      setIsIngesting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Ingest Wikipedia
          </h2>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          ChromaDB Live Sync
        </Badge>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
        Search any Wikipedia topic or article title. AskWiki scrapes the article, chunks it with recursive character overlap, embeds it, and indexes it into ChromaDB.
      </p>

      {/* Search & Ingest Input */}
      <div className="relative mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleIngest(searchTerm)
            }}
            placeholder="Search Wikipedia topic..."
            disabled={isIngesting}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Live Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1 max-h-48 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleIngest(s)}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:text-indigo-600 flex items-center justify-between"
              >
                <span className="truncate">{s}</span>
                <Plus className="h-3 w-3 shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ingest Action Button */}
      <Button
        onClick={() => handleIngest(searchTerm)}
        disabled={!searchTerm.trim() || isIngesting}
        className="w-full h-8 text-xs font-medium rounded-lg mb-4"
      >
        {isIngesting ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Ingesting & Embedding...</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Index Topic into ChromaDB</span>
          </span>
        )}
      </Button>

      {/* Presets */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            Quick Topics:
          </span>
          <button
            onClick={handleBatchPresets}
            disabled={isIngesting}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            <span>Index Starter Pack</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_TOPICS.map((topic, i) => (
            <button
              key={i}
              onClick={() => handleIngest(topic)}
              disabled={isIngesting}
              className="text-[11px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
            >
              + {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Ingestion Results Feedback */}
      {lastResult && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-zinc-800 dark:text-zinc-200 mb-4 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ingestion Success</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-2">
            {lastResult.message}
          </p>
          {lastResult.articles_indexed.map((art, idx) => (
            <div key={idx} className="mt-1 pt-1 border-t border-emerald-500/20 text-[10px] flex justify-between">
              <span className="font-medium truncate max-w-[160px]">{art.title}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">+{art.chunks} chunks</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 mb-4 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>Chunk Size:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200">800 chars</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Chunk Overlap:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200">150 chars</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Storage Engine:</span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200">Chroma Persistent</span>
        </div>
      </div>
    </div>
  )
}
