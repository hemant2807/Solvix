import { apiUrl } from "../constants/api"
import { readChromeStorage, CHROME_STORAGE_KEYS } from "../utils/storage"

// ─── Typed error codes ────────────────────────────────────────────────────────
export type AIErrorCode =
  | "groq_key_required"   // user has no key configured
  | "groq_key_invalid"    // key rejected by Groq (401/403)
  | "groq_rate_limited"   // Groq 429
  | "groq_server_error"   // Groq 5xx
  | "request_failed"      // non-AI HTTP error

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string
  ) {
    super(message)
    this.name = "AIError"
  }
}

type AIMessageRequest = {
  message?: string
  code?: string
  description?: string
  language?: string
}

type AIMessageResponse = {
  answer?: string
}

type AlgorithmResponse = {
  topics?: string[]
}

type ComplexityResponse = {
  timeComplexity?: string
  spaceComplexity?: string
}

let activeController: AbortController | null = null

export function cancelActiveAIRequest(): void {
  if (activeController) {
    activeController.abort()
    activeController = null
  }
}

// ─── Core fetch helper ────────────────────────────────────────────────────────
// groqApiKey is added as a header when present; it is never logged.
async function postJSON<T>(
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
  groqApiKey?: string
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (groqApiKey) {
    headers["X-Groq-Api-Key"] = groqApiKey
  }

  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal
  })

  if (!response.ok) {
    let errorCode: string | undefined
    try {
      const json = await response.clone().json()
      errorCode = json?.error
    } catch {
      // ignore parse failure
    }

    switch (errorCode) {
      case "groq_key_required":
        throw new AIError("groq_key_required", "No Groq API key configured.")
      case "groq_key_invalid":
        throw new AIError("groq_key_invalid", "Groq API key is invalid or expired.")
      case "groq_rate_limited":
        throw new AIError("groq_rate_limited", "Groq rate limit reached. Please wait a moment and try again.")
      case "groq_server_error":
        throw new AIError("groq_server_error", "Groq service is temporarily unavailable. Please try again.")
      default:
        throw new AIError("request_failed", `Request failed with status ${response.status}`)
    }
  }

  return response.json()
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendAIMessage(payload: AIMessageRequest): Promise<AIMessageResponse> {
  cancelActiveAIRequest()
  activeController = new AbortController()

  // Read key from chrome.storage.local — never falls back to a shared key.
  const groqApiKey = await readChromeStorage<string>(CHROME_STORAGE_KEYS.GROQ_API_KEY, "")

  try {
    const res = await postJSON<AIMessageResponse>(
      payload.message ? "/api/ai-assistant" : "/api/ask-ai",
      payload,
      activeController.signal,
      groqApiKey || undefined
    )
    return res
  } finally {
    activeController = null
  }
}

export async function analyzeAlgorithm(code: string): Promise<AlgorithmResponse> {
  // Uses Gemini on the backend — no Groq key required.
  return postJSON<AlgorithmResponse>("/api/analyze-algorithm", { code })
}

export async function analyzeComplexity(code: string): Promise<ComplexityResponse> {
  // Uses Gemini on the backend — no Groq key required.
  return postJSON<ComplexityResponse>("/api/analyze-complexity", { code })
}