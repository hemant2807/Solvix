import React from "react"
import { Brain, MessageSquare, Copy, Check } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "../../../types/shared"
import MarkdownRenderer from "../../MarkdownRenderer"

interface ChatMessageProps {
  message: ChatMessageType
  onCopy: (content: string, id: string) => void
  copiedId: string | null
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onCopy,
  copiedId
}) => {
  const isAssistant = message.role === "assistant"
  const entireBlockId = `${message.id}-entire`
  const isEntireCopied = copiedId === entireBlockId
  const isErrorMessage = isAssistant && (message.content.startsWith("❌") || message.content.startsWith("⚠️"))

  const renderMessageContent = () => (
    <div className="text-sm leading-relaxed text-gray-200">
      <MarkdownRenderer content="{message.content}"/>
    </div>
  )

  return (
    <div className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow">
          <Brain className="text-black" size={14}/>
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2.5 shadow-md relative group ${
          isErrorMessage
            ? "bg-red-950/30 text-red-200 border border-red-800/50"
            : isAssistant
            ? "bg-gray-900/80 text-gray-100 border border-gray-800/80"
            : "bg-gradient-to-br from-yellow-500 to-orange-600 text-black font-medium"
        }`}
      >
        {!isAssistant ? (
          <div className="text-sm font-semibold whitespace-pre-wrap">{message.content}</div>
        ) : (
          <>
            {renderMessageContent()}
            <div className="mt-2 pt-1.5 border-t border-gray-800/40 flex justify-end">
              <button
                onClick={() => onCopy(message.content, entireBlockId)}
                className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors flex items-center gap-1 select-none font-medium"
                title="Copy entire response"
              >
                {isEntireCopied ? (
                  <>
                    <Check className="text-green-400" size={10}/>
                    <span className="text-green-400">Response Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={10}/>
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
          <MessageSquare className="text-gray-300" size={14}/>
        </div>
      )}
    </div>
  )
}