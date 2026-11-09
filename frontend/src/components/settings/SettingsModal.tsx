"use client"

import React, { useState } from "react"
import { Settings as SettingsIcon, X, Check, Key, Cpu, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BackendConfig } from "@/lib/types"
import { updateConfig } from "@/lib/api"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  config: BackendConfig | null
  onConfigUpdated: () => void
}

export function SettingsModal({ isOpen, onClose, config, onConfigUpdated }: SettingsModalProps) {
  const [provider, setProvider] = useState(config?.model_provider || "ollama")
  const [modelName, setModelName] = useState(config?.chat_model || "llama3.2:3b")
  const [apiKey, setApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    setSavedSuccess(false)
    try {
      await updateConfig({
        model_provider: provider,
        chat_model: modelName,
        openai_api_key: apiKey || undefined,
      })
      setSavedSuccess(true)
      onConfigUpdated()
      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 1200)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Model & Engine Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ollama", label: "Ollama (Local)" },
                { id: "openai", label: "OpenAI" },
                { id: "demo", label: "Auto Fallback" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id)
                    if (p.id === "openai") setModelName("gpt-4o-mini")
                    if (p.id === "ollama") setModelName("llama3.2:3b")
                    if (p.id === "demo") setModelName("local-synthesizer")
                  }}
                  className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                    provider === p.id
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Chat Model Name
            </label>
            <Input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. llama3.2:3b, gpt-4o-mini, mistral"
            />
          </div>

          {provider === "openai" && (
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                OpenAI API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Will be stored in memory for this session or loaded from backend .env
              </span>
            </div>
          )}

          {provider === "ollama" && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 text-[11px] text-zinc-500">
              <span>Endpoint: </span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {config?.ollama_base_url || "http://localhost:11434"}
              </span>
              <p className="mt-1 text-[10px] text-zinc-400">
                Make sure Ollama is running (`ollama serve`). If not running, AskWiki automatically falls back gracefully.
              </p>
            </div>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>Settings applied successfully!</span>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-9 rounded-lg"
            >
              {isSaving ? "Saving..." : "Apply Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
