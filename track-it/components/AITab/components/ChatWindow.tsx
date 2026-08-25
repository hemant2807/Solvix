import React from "react"
import { Brain, Loader2 } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "../../../types/shared"
import { ChatMessage } from "./ChatMessage"
import { WelcomeScreen } from "./WelcomeScreen"

interface ChatWindowProps {
  messages: ChatMessageType[]
  isLoading: boolean
  copiedId: string | null
  onCopy: (content: string, id: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  onSelectPrompt: (message: string) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  copiedId,
  onCopy,
  messagesEndRef,
  onSelectPrompt
}) => {
  if (messages.length === 0) {
    return <WelcomeScreen onSelectPrompt={onSelectPrompt} />
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <ChatMessage 
          key={msg.id} 
          message={msg} 
          onCopy={onCopy}
          copiedId={copiedId} 
        />
      ))}

      {isLoading && (
        <div className="flex gap-2.5 justify-start">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Brain className="text-black" size={14} />
          </div>
          <div className="bg-gray-900/80 text-gray-100 border border-gray-800/80 rounded-2xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
              <span className="text-xs text-gray-400 font-medium">Formulating explanation...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}