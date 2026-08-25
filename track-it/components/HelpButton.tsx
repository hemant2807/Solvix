import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { ExternalLink } from "lucide-react"

// TEMPORARY MOCK until we build these files:
const MarkdownRenderer = ({ content }: any) => <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{content}</pre>;
const getSimilarQuestions = (slug: string, title?: string) => [];
type AlternativeProblem = { url: string; note: string; isSearch?: boolean; difficulty?: string; title: string; platform: string; };

import { sendAIMessage } from "../services/aiService"
import { PROMPT_TEMPLATES } from "../constants/aiPrompts"
import { writeChromeStorage, CHROME_STORAGE_KEYS } from "../utils/storage"
import { openInNewTab } from "../utils/navigation"
import type { AIContext } from "../types/shared"

const getPromptMessage = (label: string) =>
  PROMPT_TEMPLATES.find((tpl) => tpl.label === label)?.message ?? ""

const QUICK_ACTIONS = [
  { icon: "💡", label: "Explain", promptLabel: "Explain Problem" },
  { icon: "🧠", label: "Hint", promptLabel: "Give me a Hint" },
  { icon: "⚡", label: "Optimize", promptLabel: "Optimize Code" },
  { icon: "🚀", label: "Generate", promptLabel: "Full Solution" },
  { icon: "🐛", label: "Find Bugs", promptLabel: "Find Bugs" },
  { icon: "📺", label: "YouTube", promptLabel: "YouTube Solution", isExternal: true }
]

function getQuestionContext(): AIContext {
  const language =
    document.querySelector("button.rounded.items-center")?.textContent?.trim() || ""
  let description = ""

  const descEl = document.querySelector("div[data-track-load='description_content']")
  if (descEl) {
    description = descEl.textContent?.trim() || ""
  }

  if (!description) {
    const article = document.querySelector("#qd-content article")
    if (article) {
      description = article.textContent?.trim() || ""
    }
  }

  let code = ""
  const codeEditor = document.querySelector(".monaco-editor textarea") as HTMLTextAreaElement
  if (codeEditor) {
    code = codeEditor.value
  }

  return { description, code, language }
}

function checkIfPremium(): boolean {
  const lockIcon = document.querySelector("div.text-title-large svg[data-icon='lock']") ||
                   document.querySelector("div.text-title-large .lock-icon") ||
                   document.querySelector("[data-cy='question-title-lock']")
  
  let premiumBadge = null
  const titleArea = document.querySelector("div.text-title-large")?.parentElement
  if (titleArea) {
    const walker = document.createTreeWalker(titleArea, NodeFilter.SHOW_TEXT, null)
    while (walker.nextNode()) {
      if (walker.currentNode.textContent?.includes("Premium")) {
        premiumBadge = walker.currentNode.parentElement
        break
      }
    }
  }
  premiumBadge = premiumBadge || document.querySelector(".premium-badge") || document.querySelector("[data-cy='premium-badge']")
  
  const descEl = document.querySelector("div[data-track-load='description_content']")
  const isPremiumContent = descEl && (
    descEl.textContent?.includes("Subscribe to unlock") ||
    descEl.textContent?.includes("Upgrade to Premium") ||
    descEl.textContent?.includes("This is a premium problem")
  )
  
  const statsLock = document.querySelector(".css-101rr4k svg[data-icon='lock']") ||
                    document.querySelector(".question-stats svg[data-icon='lock']")
  
  return !!(lockIcon || premiumBadge || isPremiumContent || statsLock)
}

function extractProblemSlug(): string | null {
  const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/)
  if (urlMatch) return urlMatch[1]
  
  const titleEl = document.querySelector("div.text-title-large")
  const slugFromEl = titleEl?.getAttribute("data-cy")?.replace("question-title-", "")
  if (slugFromEl) return slugFromEl
  
  return null
}

function extractProblemTitle(): string | null {
  return document.querySelector("div.text-title-large")?.textContent?.trim() || null
}

function extractProblemNumber(): string | null {
  const titleEl = document.querySelector("div.text-title-large")
  const fullTitle = titleEl?.textContent?.trim() || ""
  
  const numMatch = fullTitle.match(/^(\d+)\.?\s/)
  if (numMatch) return numMatch[1]
  
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || ""
  const metaNumMatch = metaDesc.match(/LeetCode\s+(\d+)/i)
  if (metaNumMatch) return metaNumMatch[1]
  
  return null
}

function getYouTubeSearchUrl(): string {
  const problemNumber = extractProblemNumber()
  let problemTitle = extractProblemTitle() || "LeetCode Problem"
  
  if (problemNumber) {
    const titleNumMatch = problemTitle.match(/^\d+\.?\s+/)
    if (titleNumMatch) {
      problemTitle = problemTitle.slice(titleNumMatch[0].length).trim()
    }
  }
  
  let query: string
  if (problemNumber) {
    query = `LeetCode ${problemNumber} ${problemTitle} solution`
  } else {
    query = `${problemTitle} LeetCode solution`
  }
  
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

function getAlternatives(): AlternativeProblem[] {
  const slug = extractProblemSlug()
  const title = extractProblemTitle()

  if (!slug && !title) return []

  return getSimilarQuestions(slug || "", title || undefined)
}

export default function HelpButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [alternatives, setAlternatives] = useState<AlternativeProblem[]>([])

  useEffect(() => {
    if (open) {
      setIsPremium(checkIfPremium())
      setAlternatives(getAlternatives())
    }
  }, [open])

  const runQuickAction = async (promptLabel: string) => {
    try {
      setLoading(true)
      setErrorMessage(null)

      const { description, code, language } = getQuestionContext()
      const res = await sendAIMessage({
        message: getPromptMessage(promptLabel),
        description,
        code,
        language
      })

      setResponse(res.answer || "No response received.")
    } catch (err) {
      console.error("AI Error:", err)
      setErrorMessage("Something went wrong. Please try again.")
      setResponse(null)
    } finally {
      setLoading(false)
    }
  }

  const openFullWorkspace = async () => {
    const { description, code, language } = getQuestionContext()

    await writeChromeStorage(CHROME_STORAGE_KEYS.AI_LAST_CONTEXT, {
      title: document.title.replace(" - LeetCode", "") || "Active Problem",
      description,
      code,
      language
    })

    chrome.runtime.sendMessage({ type: "OPEN_AI_TAB", description, code })
    setOpen(false)
  }

  const renderAlternatives = () => {
    if (!isPremium || alternatives.length === 0) return null

    return (
      <div className="leetbuddy-premium-alternatives" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #333" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#fbbf24", fontWeight: 600, fontSize: "14px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>LeetCode Premium Problem</span>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "12px" }}>
          Practice a similar problem on other platforms:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {alternatives.map((alt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openInNewTab(alt.url)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#e5e7eb",
                fontSize: "13px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#374151"
                e.currentTarget.style.borderColor = "#fbbf24"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1f2937"
                e.currentTarget.style.borderColor = "#374151"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {alt.isSearch ? (
                  <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: "#3730a3", color: "#c7d2fe" }}>
                    Search
                  </span>
                ) : (
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 600,
                    background: alt.difficulty === "Easy" ? "#166534" : alt.difficulty === "Medium" ? "#92400e" : "#991b1b",
                    color: alt.difficulty === "Easy" ? "#bbf7d0" : alt.difficulty === "Medium" ? "#fde68a" : "#fecaca"
                  }}>
                    {alt.difficulty}
                  </span>
                )}
                <span style={{ fontWeight: 500 }}>{alt.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px" }}>
                <span>{alt.platform}</span>
                <ExternalLink size={12} />
              </div>
            </button>
          ))}
        </div>
        {alternatives.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "12px", textAlign: "center", padding: "8px" }}>
            No alternative problems mapped yet. Check back soon!
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <button className="leetbuddy-help-btn" onClick={() => setOpen((prev) => !prev)}>
        🤖 AI Help
      </button>

      {open &&
        createPortal(
          <div
            className="leetbuddy-popup"
            style={{ position: "fixed", top: "120px", right: "40px", zIndex: 999999999 }}
          >
            <div className="leetbuddy-header">
              <span>🤖 LeetBuddy AI</span>
              <button className="close-btn" onClick={() => setOpen(false)} title="Close">
                ✕
              </button>
            </div>

            <div className="leetbuddy-body">
              <div className="ai-actions">
                {QUICK_ACTIONS.map((action) => (
                  action.isExternal ? (
                    <button
                      key={action.label}
                      type="button"
                      className={action.label === "Generate" ? "generate-btn" : undefined}
                      onClick={() => {
                        openInNewTab(getYouTubeSearchUrl())
                      }}
                    >
                      {action.icon} {action.label}
                    </button>
                  ) : (
                    <button
                      key={action.label}
                      className={
                        action.label === "Generate" || action.label === "Optimize"
                          ? "full-row-btn"
                          : undefined
                      }
                      disabled={loading}
                      onClick={() => runQuickAction(action.promptLabel)}
                    >
                      {action.icon} {action.label}
                    </button>
                  )
                ))}
              </div>

              <div className="ai-response">
                {loading ? (
                  <p style={{ color: "#a5a5a5" }}>🤖 Thinking...</p>
                ) : errorMessage ? (
                  <p style={{ color: "#f87171" }}>{errorMessage}</p>
                ) : response ? (
                  <MarkdownRenderer content={response} />
                ) : (
                  <p style={{ color: "#7a7a7a" }}>
                    Pick a quick action above for an instant answer about this problem.
                  </p>
                )}
              </div>

              {renderAlternatives()}

              <button onClick={openFullWorkspace} title="Open the full AI Workspace in the side panel">
                🧩 Open Full AI Workspace
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}