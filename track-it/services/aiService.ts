import { apiUrl } from "../constants/api"

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

async function postJSON<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export async function sendAIMessage(payload: AIMessageRequest): Promise<AIMessageResponse> {
  cancelActiveAIRequest()
  activeController = new AbortController()
  try {
    const res = await postJSON<AIMessageResponse>(
      payload.message ? "/api/ai-assistant" : "/api/ask-ai",
      payload,
      activeController.signal
    )
    return res
  } finally {
    activeController = null
  }
}

export async function analyzeAlgorithm(code: string): Promise<AlgorithmResponse> {
  return postJSON<AlgorithmResponse>("/api/analyze-algorithm", { code })
}

export async function analyzeComplexity(code: string): Promise<ComplexityResponse> {
  return postJSON<ComplexityResponse>("/api/analyze-complexity", { code })
}