"use client"

import React from "react"
import { BookOpen, Database, Settings as SettingsIcon, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KnowledgeStats, BackendConfig } from "@/lib/types"

interface HeaderProps {
  stats: KnowledgeStats | null
  config: BackendConfig | null
  isOnline: boolean
  onOpenStats: () => void
  onOpenSettings: () => void
}

export function Header({ stats, config, isOnline, onOpenStats, onOpenSettings }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                AskWiki
              </span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider py-0 px-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                Agentic RAG
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              LangGraph + ChromaDB Knowledge Engine
            </p>
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900">
            {isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">FastAPI Online</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-rose-600 dark:text-rose-400 font-medium">Connecting...</span>
              </>
            )}
          </div>

          {/* Model info pill */}
          {config && (
            <Badge variant="secondary" className="hidden md:inline-flex items-center gap-1 text-xs font-mono py-1">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>{config.model_provider}: {config.chat_model}</span>
            </Badge>
          )}

          {/* Knowledge Stats Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenStats}
            className="flex items-center gap-1.5 text-xs font-medium"
          >
            <Database className="h-3.5 w-3.5 text-indigo-500" />
            <span>Chunks: </span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {stats?.total_chunks ?? 0}
            </span>
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Model & Provider Settings"
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
