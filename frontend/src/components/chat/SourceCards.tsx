"use client"

import React, { useState } from "react"
import { ExternalLink, BookOpen, Layers, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SourceDocument } from "@/lib/types"

interface SourceCardsProps {
  sources?: SourceDocument[]
}

export function SourceCards({ sources = [] }: SourceCardsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
        <span>Grounded Wikipedia Sources ({sources.length}):</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((src, idx) => {
          const isExp = expandedIndex === idx

          return (
            <div
              key={idx}
              className="group flex flex-col justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-2.5 text-xs shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {src.title || "Wikipedia Article"}
                  </span>
                </div>

                <a
                  href={src.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="View on Wikipedia"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Snippet */}
              <div className="mt-2 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                <p className={isExp ? "" : "line-clamp-2"}>
                  {src.content}
                </p>
                {src.content && src.content.length > 120 && (
                  <button
                    onClick={() => setExpandedIndex(isExp ? null : idx)}
                    className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                  >
                    {isExp ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Show snippet</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
