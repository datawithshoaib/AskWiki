"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/layout/Header"
import { ChatContainer } from "@/components/chat/ChatContainer"
import { WikipediaIngestPanel } from "@/components/ingestion/WikipediaIngestPanel"
import { KnowledgeStatsModal } from "@/components/knowledge/KnowledgeStatsModal"
import { SettingsModal } from "@/components/settings/SettingsModal"
import { KnowledgeStats, BackendConfig } from "@/lib/types"
import { fetchHealth, fetchStats, fetchConfig } from "@/lib/api"
import { BookOpen, Layers, Sparkles } from "lucide-react"

export default function Home() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [config, setConfig] = useState<BackendConfig | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      await fetchHealth()
      setIsOnline(true)

      const [s, c] = await Promise.allSettled([fetchStats(), fetchConfig()])
      if (s.status === "fulfilled") setStats(s.value)
      if (c.status === "fulfilled") setConfig(c.value)
    } catch {
      setIsOnline(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 8000)
    return () => clearInterval(interval)
  }, [loadData])

  return (
    <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        stats={stats}
        config={config}
        isOnline={isOnline}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Dual-Pane Workspace */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left/Center: Agentic RAG Chat */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <ChatContainer onArticleIngested={loadData} />
        </div>

        {/* Right: Wikipedia Ingestion & Knowledge Management Sidebar */}
        <aside className="w-80 lg:w-96 hidden md:flex flex-col h-full shrink-0 shadow-xs">
          <WikipediaIngestPanel onIngestSuccess={loadData} />
        </aside>
      </main>

      {/* Modals */}
      <KnowledgeStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onRefresh={loadData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigUpdated={loadData}
      />
    </div>
  )
}
