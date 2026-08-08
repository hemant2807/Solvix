import React, { useState, useEffect, useRef, useCallback } from "react"
import type { ChatMessage, AIContext } from "../../types/shared"
import { sendAIMessage, cancelActiveAIRequest } from "../../services/aiService"
import { readChromeStorage, writeChromeStorage, removeChromeStorage, CHROME_STORAGE_KEYS } from "../../utils/storage"
import { ContextBar } from "./components/ContextBar"
import { ChatWindow } from "./components/ChatWindow"
import { ChatInput } from "./components/ChatInput"

type AITabProps = {
  description: string
  code: string
  slug?: string
}

export default function AITab({ description: propDescription, code: propCode, slug: propSlug }: AITabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [pageContext, setPageContext] = useState<AIContext>({
    title: "",
    description: "",
    code: "",
    language: ""
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const getChatHistoryKey = (title: string, slug?: string) => {
    if (slug) {
      return `${CHROME_STORAGE_KEYS.AI_CHAT_HISTORY}-slug-${slug}`
    }
    const sanitized = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    return `${CHROME_STORAGE_KEYS.AI_CHAT_HISTORY}-${sanitized}`
  }

  const loadChatHistory = useCallback(async (title: string, slug?: string) => {
    const key = getChatHistoryKey(title, slug)
    const storedHistory = await readChromeStorage<ChatMessage[]>(key, [])

    if (slug && (!Array.isArray(storedHistory) || storedHistory.length === 0) && title) {
      const legacyKey = getChatHistoryKey(title, undefined)
      const legacyHistory = await readChromeStorage<ChatMessage[]>(legacyKey, [])
      if (Array.isArray(legacyHistory) && legacyHistory.length > 0) {
        setMessages(legacyHistory)
        await writeChromeStorage(key, legacyHistory)
        return
      }
    }

    setMessages(Array.isArray(storedHistory) ? storedHistory : [])
  }, [])

  const saveChatHistory = useCallback(async (title: string, nextMessages: ChatMessage[], slug?: string) => {
    const key = getChatHistoryKey(title, slug)
    await writeChromeStorage(key, nextMessages)
  }, [])

  const clearChatHistory = useCallback(async (title: string, slug?: string) => {
    const key = getChatHistoryKey(title, slug)
    await removeChromeStorage(key)
    setMessages([])
  }, [])

  useEffect(() => {
    const initialize = async () => {
      const storedContext = await readChromeStorage<AIContext>(CHROME_STORAGE_KEYS.AI_LAST_CONTEXT, {
        title: "",
        description: "",
        code: "",
        language: ""
      })
      setPageContext(propSlug ? { ...storedContext, slug: propSlug } : storedContext)
      await detectPageContext()
    }
    initialize()
  }, [])

  useEffect(() => {
    if (!propSlug) return
    setPageContext(prev => (prev.slug === propSlug ? prev : { ...prev, slug: propSlug }))
  }, [propSlug])

  useEffect(() => {
    if (pageContext.title || pageContext.slug) {
      loadChatHistory(pageContext.title, pageContext.slug)
    }
  }, [pageContext.title, pageContext.slug, loadChatHistory])

  const syncContextToStorage = useCallback(async (nextContext: AIContext) => {
    await writeChromeStorage(CHROME_STORAGE_KEYS.AI_LAST_CONTEXT, nextContext)
  }, [])

  useEffect(() => {
    if (propDescription || propCode) {
      setPageContext(prev => {
        const nextContext = {
          title: prev.title || "Active Problem",
          description: propDescription || prev.description,
          code: propCode || prev.code,
          language: prev.language || "javascript",
          slug: propSlug || prev.slug
        }
        syncContextToStorage(nextContext)
        return nextContext
      })
    }
  }, [propDescription, propCode, propSlug, syncContextToStorage])

  const detectPageContext = async () => {
    if (typeof chrome === "undefined" || !chrome.tabs) return

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0]?.id
        if (!activeTabId) return

        chrome.tabs.sendMessage(activeTabId, { type: "GET_CONTEXT" }, (response) => {
          if (chrome.runtime.lastError || !response) {
            return
          }
          const title = tabs[0].title?.replace(" - LeetCode", "").replace(" - LeetCode Showcase", "") || "LeetCode Problem"
          const updatedContext: AIContext = {
            title,
            description: response.description || "",
            code: response.code || "",
            language: response.language || "",
            slug: response.slug || undefined
          }
          setPageContext(updatedContext)
          syncContextToStorage(updatedContext)
        })
      })
    } catch (e) {
      console.error("Error detecting page context:", e)
    }
  }

  const handleStop = () => {
    cancelActiveAIRequest()
  }

  const handleClear = async () => {
    if (pageContext.title || pageContext.slug) {
      await clearChatHistory(pageContext.title, pageContext.slug)
    }
  }

  const buildMessageWithHistory = (newMsg: string, history: ChatMessage[]) => {
    if (history.length === 0) return newMsg

    const recentHistory = history.slice(-6)
    const formattedHistory = recentHistory
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n")

    return `Conversation History:\n${formattedHistory}\n\nUser Follow-up:\n${newMsg}`
  }

  const handleSend = async (customMessage?: string) => {
    const textToSend = (customMessage || inputMessage).trim()
    if (!textToSend || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage("")
    setIsLoading(true)
    if (pageContext.title || pageContext.slug) {
      await saveChatHistory(pageContext.title, updatedMessages, pageContext.slug)
    }

    try {
      const compiledMessage = buildMessageWithHistory(textToSend, messages)

      const res = await sendAIMessage({
        message: compiledMessage,
        code: pageContext.code,
        description: pageContext.description,
        language: pageContext.language
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer || "No response received. Please try again.",
        timestamp: new Date().toISOString()
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      if (pageContext.title || pageContext.slug) {
        await saveChatHistory(pageContext.title, finalMessages, pageContext.slug)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        const stopMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Response generation stopped by user.",
          timestamp: new Date().toISOString()
        }
        const finalMessages = [...updatedMessages, stopMessage]
        setMessages(finalMessages)
        if (pageContext.title || pageContext.slug) {
          await saveChatHistory(pageContext.title, finalMessages, pageContext.slug)
        }
      } else {
        console.error("AI Error:", error)
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "❌ Sorry, I encountered an error. Please check your connection and try again.",
          timestamp: new Date().toISOString()
        }
        const finalMessages = [...updatedMessages, errorMessage]
        setMessages(finalMessages)
        if (pageContext.title || pageContext.slug) {
          await saveChatHistory(pageContext.title, finalMessages, pageContext.slug)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  return (
    <div className="flex flex-col h-[74vh] overflow-hidden bg-gray-950/20 rounded-2xl relative">
      <ContextBar
        title={pageContext.title || ""}
        language={pageContext.language}
        onRefresh={detectPageContext}
        onClear={handleClear}
        showClear={messages.length > 0}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          copiedId={copiedId}
          onCopy={handleCopy}
          messagesEndRef={messagesEndRef}
          onSelectPrompt={handleSend}
        />
      </div>

      <ChatInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        showPills={messages.length > 0}
      />
    </div>
  )
}