"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronRight, Activity, CheckCircle2, Clock, Globe, Database, Brain, Sparkles } from "lucide-react"
import { ReasoningStep } from "@/lib/types"

interface ReasoningTimelineProps {
  steps?: ReasoningStep[]
  isStreaming?: boolean
}

export function ReasoningTimeline({ steps = [], isStreaming = false }: ReasoningTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!steps || steps.length === 0) return null

  const getStepIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes("analysis")) return <Brain className="h-3.5 w-3.5 text-purple-500" />
    if (lower.includes("chromadb") || lower.includes("retriev")) return <Database className="h-3.5 w-3.5 text-blue-500" />
    if (lower.includes("wikipedia") || lower.includes("search")) return <Globe className="h-3.5 w-3.5 text-emerald-500" />
    if (lower.includes("grade")) return <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
    return <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
  }

  const activeStep = steps.find(s => s.status === "running") || steps[steps.length - 1]

  return (
    <div className="my-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-xs overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className={`h-3.5 w-3.5 ${isStreaming ? "text-indigo-500 animate-spin" : "text-zinc-500"}`} />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            LangGraph Execution ({steps.length} {steps.length === 1 ? "step" : "steps"})
          </span>
          {activeStep && isStreaming && (
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 animate-pulse font-mono truncate max-w-[200px]">
              → {activeStep.step}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <span className="text-[11px] font-mono">{isExpanded ? "Hide trace" : "View trace"}</span>
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expanded timeline details */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2.5 space-y-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[11px]">
              <div className="mt-0.5">{getStepIcon(st.step)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {st.step}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {st.status === "running" ? (
                      <span className="text-indigo-500 animate-pulse">Running...</span>
                    ) : (
                      "Completed"
                    )}
                  </span>
                </div>
                {st.detail && (
                  <p className="mt-0.5 text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {st.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
