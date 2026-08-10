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
  // The parent (sidepanel) tracks the current problem's slug from the
  // passive QUESTION_INFO broadcast, which arrives as soon as the page loads
  // - well before the user opens this tab. Accepting it as a prop lets us
  // seed pageContext.slug immediately on mount instead of waiting on this
  // component's own async GET_CONTEXT round-trip, closing the race window
  // where a message sent right after opening the AI tab could be saved
  // under a slug-less (title-only) key while a later reload uses the
  // now-known slug key, making the chat appear to "disappear".
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

  // Auto-scroll to the latest message as the conversation grows or streams in.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Generate a storage key for chat history for the current problem. Prefer
  // the LeetCode slug when we have one - it's a stable, collision-free
  // identifier - unlike the title, which can be empty/generic ("Active
  // Problem") for a moment before the content script responds, or which two
  // different problems could theoretically share once sanitized. Falling
  // back to the sanitized title keeps existing stored chats (saved before
  // slug tracking existed) readable.
  const getChatHistoryKey = (title: string, slug?: string) => {
    if (slug) {
      return `${CHROME_STORAGE_KEYS.AI_CHAT_HISTORY}-slug-${slug}`
    }
    const sanitized = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    return `${CHROME_STORAGE_KEYS.AI_CHAT_HISTORY}-${sanitized}`
  }

  // Load chat history for current problem. When we have a slug, also check
  // the legacy title-only key: if the slug key is empty but the title key
  // has messages (e.g. saved before slug tracking existed, or by the
  // now-fixed key-mismatch bug where a reply was saved without the slug),
  // recover them and migrate them onto the slug key so future loads are
  // consistent.
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

  // Save chat history for current problem
  const saveChatHistory = useCallback(async (title: string, nextMessages: ChatMessage[], slug?: string) => {
    const key = getChatHistoryKey(title, slug)
    await writeChromeStorage(key, nextMessages)
  }, [])

  // Clear chat history for current problem
  const clearChatHistory = useCallback(async (title: string, slug?: string) => {
    const key = getChatHistoryKey(title, slug)
    await removeChromeStorage(key)
    setMessages([])
  }, [])

  // Auto-scroll to the latest message as the conversation grows or streams in.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Load chat history & context on mount using storage abstraction
  useEffect(() => {
    const initialize = async () => {
      const storedContext = await readChromeStorage<AIContext>(CHROME_STORAGE_KEYS.AI_LAST_CONTEXT, {
        title: "",
        description: "",
        code: "",
        language: ""
      })
      // Prefer the eagerly-available prop slug (see AITabProps) over
      // whatever was last persisted, in case the user is on a different
      // problem than the last stored context.
      setPageContext(propSlug ? { ...storedContext, slug: propSlug } : storedContext)

      // Refresh current context from open tab
      await detectPageContext()
    }
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep pageContext.slug in sync if the parent's tracked slug changes (e.g.
  // the user navigated LeetCode to a different problem while this tab
  // remains mounted) without waiting for detectPageContext's own round-trip.
  useEffect(() => {
    if (!propSlug) return
    setPageContext(prev => (prev.slug === propSlug ? prev : { ...prev, slug: propSlug }))
  }, [propSlug])

  // Load chat history when page context (problem) changes. Keyed off slug OR
  // title so a slug that arrives (via the eager prop) before the title does
  // (via the async GET_CONTEXT round-trip) still triggers a load instead of
  // waiting on title specifically.
  useEffect(() => {
    if (pageContext.title || pageContext.slug) {
      loadChatHistory(pageContext.title, pageContext.slug)
    }
  }, [pageContext.title, pageContext.slug, loadChatHistory])

  // Sync context to storage
  const syncContextToStorage = useCallback(async (nextContext: AIContext) => {
    await writeChromeStorage(CHROME_STORAGE_KEYS.AI_LAST_CONTEXT, nextContext)
  }, [])

  // Handle incoming props from parent (e.g. from float button clicks)
  useEffect(() => {
    if (propDescription || propCode) {
      setPageContext(prev => {
        const nextContext = {
          title: prev.title || "Active Problem",
          description: propDescription || prev.description,
          code: propCode || prev.code,
          language: prev.language || "javascript",
          // Rebuilding a fresh object here previously dropped whatever slug
          // the initialize/sync effects had already set, since it wasn't
          // carried forward from `prev` - that silently pushed chat saves
          // back onto the less reliable title-only key.
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

  // Abort request is managed inside services/aiService.ts
  const handleStop = () => {
    cancelActiveAIRequest()
  }

  const handleClear = async () => {
    if (pageContext.title || pageContext.slug) {
      await clearChatHistory(pageContext.title, pageContext.slug)
    }
  }

  // Prepend recent messages for context/history memory
  const buildMessageWithHistory = (newMsg: string, history: ChatMessage[]) => {
    if (history.length === 0) return newMsg

    // Format last 6 turns to keep context size reasonable
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
      // Build message payload with conversation memory
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
export { AITab }
