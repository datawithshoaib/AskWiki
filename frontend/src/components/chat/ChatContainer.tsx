"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Trash2, StopCircle, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessage, SourceDocument, ReasoningStep } from "@/lib/types"
import { MessageBubble } from "./MessageBubble"
import { streamChatMessage } from "@/lib/api"

interface ChatContainerProps {
  onArticleIngested?: () => void
}

const SAMPLE_QUERIES = [
  "What is Python and why is it used?",
  "Explain LangChain and agentic workflows",
  "How does ChromaDB work for vector search?",
  "What is Quantum Computing?",
]

export function ChatContainer({ onArticleIngested }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "### Welcome to AskWiki!\n\n" +
        "I am an enterprise Agentic RAG assistant powered by **LangGraph**, **ChromaDB**, and **FastAPI**.\n\n" +
        "I evaluate queries through a multi-stage reasoning graph, retrieve knowledge chunks from the local vector database, evaluate document relevance, and can automatically search and ingest live Wikipedia articles when needed.\n\n" +
        "Try asking a question or search & index any topic using the panel on the right!",
      timestamp: "Just now",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input
    if (!textToSend.trim() || isLoading) return

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `asst-${Date.now()}`

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      sources: [],
      reasoningSteps: [],
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage])
    setInput("")
    setIsLoading(true)

    // Format history
    const historyPayload = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      await streamChatMessage(textToSend.trim(), historyPayload, {
        onStep: (step: ReasoningStep) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantMsgId) return msg
              const existingSteps = msg.reasoningSteps || []
              const existingIdx = existingSteps.findIndex((s) => s.step === step.step)
              let updatedSteps = [...existingSteps]
              if (existingIdx >= 0) {
                updatedSteps[existingIdx] = step
              } else {
                updatedSteps.push(step)
              }
              return { ...msg, reasoningSteps: updatedSteps }
            })
          )
        },
        onSources: (sources: SourceDocument[]) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, sources } : msg
            )
          )
        },
        onToken: (token: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          )
        },
        onDone: (fullAnswer: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: fullAnswer || msg.content,
                    isStreaming: false,
                  }
                : msg
            )
          )
          setIsLoading(false)
          if (onArticleIngested) onArticleIngested()
        },
        onError: (err: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content:
                      msg.content +
                      `\n\n*(Error communicating with agent pipeline: ${err})*`,
                    isStreaming: false,
                  }
                : msg
            )
          )
          setIsLoading(false)
        },
      })
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `An error occurred: ${e.message}`,
                isStreaming: false,
              }
            : msg
        )
      )
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Chat cleared. What Wikipedia knowledge would you like to explore?",
        timestamp: "Just now",
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/50">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {/* Sample query pill chips if chat is short */}
          {messages.length <= 2 && !isLoading && (
            <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Suggested Queries:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {messages.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              title="Clear conversation"
              className="shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about indexed Wikipedia articles or topics..."
              disabled={isLoading}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 pr-10 text-sm shadow-inner placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
            />
          </div>

          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-10 px-4 rounded-xl shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-xs">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Thinking</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Send</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
