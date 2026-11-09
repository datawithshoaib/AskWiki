"use client"

import React, { useState } from "react"
import { Database, Trash2, X, ExternalLink, RefreshCw, AlertTriangle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KnowledgeStats } from "@/lib/types"
import { resetKnowledgeBase } from "@/lib/api"

interface KnowledgeStatsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: KnowledgeStats | null
  onRefresh: () => void
}

export function KnowledgeStatsModal({ isOpen, onClose, stats, onRefresh }: KnowledgeStatsModalProps) {
  const [isResetting, setIsResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  if (!isOpen) return null

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await resetKnowledgeBase()
      setConfirmReset(false)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Knowledge Base Stats
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Chunks</span>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {stats?.total_chunks ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-center">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Articles Indexed</span>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono mt-1">
                {stats?.estimated_articles ?? 0}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
              Indexed Wikipedia Topics:
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2">
              {stats?.articles && stats.articles.length > 0 ? (
                stats.articles.map((art, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-zinc-50 dark:bg-zinc-950 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {art.title}
                      </span>
                      {art.source && (
                        <a
                          href={art.source}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-indigo-500"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {art.chunk_count} chunks
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 text-center py-4">
                  No Wikipedia articles indexed yet. Use the Ingest panel to add articles.
                </p>
              )}
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Collection Name:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {stats?.collection_name || "rag_data"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>DB Location:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]" title={stats?.database_path}>
                {stats?.database_path || "chroma_db"}
              </span>
            </div>
          </div>

          {/* Reset section */}
          {confirmReset ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Confirm Vector Database Reset</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                This will delete all indexed chunks and articles from ChromaDB.
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="h-7 text-xs flex-1"
                >
                  {isResetting ? "Resetting..." : "Yes, Wipe All Data"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(false)}
                  className="h-7 text-xs flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmReset(true)}
              className="w-full text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Knowledge Base</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
