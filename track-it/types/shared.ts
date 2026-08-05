export interface LeetCodeUser {
  username: string
  avatar: string
  ranking: number
  contestRating?: number
}

export interface AIContext {
  description: string
  code: string
  language?: string
  title?: string
  slug?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  messages: ChatMessage[]
  context?: AIContext
}

export interface PromptTemplate {
  label: string
  iconName: string
  message: string
}