"use client"

import React from "react"
import { User, Sparkles, Copy, Check } from "lucide-react"
import { ChatMessage } from "@/lib/types"
import { ReasoningTimeline } from "./ReasoningTimeline"
import { SourceCards } from "./SourceCards"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false)
  const isUser = message.role === "user"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format markdown paragraphs cleanly
  const formatContent = (text: string) => {
    return text.split("\n\n").map((block, idx) => {
      // Headings
      if (block.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1">
            {block.replace("### ", "")}
          </h4>
        )
      }
      if (block.startsWith("#### ")) {
        return (
          <h5 key={idx} className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2 mb-1">
            {block.replace("#### ", "")}
          </h5>
        )
      }
      if (block.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-2 border-indigo-500 pl-3 my-2 text-xs italic text-zinc-600 dark:text-zinc-400">
            {block.replace("> ", "")}
          </blockquote>
        )
      }
      // List items
      if (block.includes("\n- ") || block.startsWith("- ")) {
        const items = block.split("\n").filter(l => l.trim().startsWith("- "))
        return (
          <ul key={idx} className="list-disc list-inside space-y-1 text-xs text-zinc-700 dark:text-zinc-300 my-1">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^- /, "")}</li>
            ))}
          </ul>
        )
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 mb-2 last:mb-0">
          {block}
        </p>
      )
    })
  }

  return (
    <div className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"} my-4`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`relative rounded-2xl px-4 py-3 shadow-xs ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-xs"
              : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs"
          }`}
        >
          {/* Agent trace if present */}
          {!isUser && message.reasoningSteps && message.reasoningSteps.length > 0 && (
            <ReasoningTimeline
              steps={message.reasoningSteps}
              isStreaming={message.isStreaming}
            />
          )}

          {/* Main message text */}
          <div className="font-sans whitespace-pre-wrap">
            {isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <div>
                {formatContent(message.content)}
                {message.isStreaming && (
                  <span className="inline-block h-3.5 w-1.5 ml-1 bg-indigo-500 animate-pulse align-middle" />
                )}
              </div>
            )}
          </div>

          {/* Sources if provided */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <SourceCards sources={message.sources} />
          )}

          {/* Copy button */}
          {!isUser && message.content && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="mt-1 px-1 text-[10px] text-zinc-400">
          {message.timestamp}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}
