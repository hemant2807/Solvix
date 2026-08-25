import React, { useRef, useEffect } from "react"
import { Send, StopCircle } from "lucide-react"
import { PROMPT_TEMPLATES } from "../../../constants/aiPrompts"
import {
  HelpCircle,
  Lightbulb,
  FileCode,
  Zap,
  Bug,
  Layers,
  GitBranch,
  AlertTriangle,
  Terminal,
  Code2
} from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (val: string) => void
  onSend: (customMsg?: string) => void
  onStop: () => void
  isLoading: boolean
  showPills: boolean
}

const iconMap: Record<string, React.ReactNode> = {
  HelpCircle: <HelpCircle className="text-cyan-400" size="{12}"/>,
  Lightbulb: <Lightbulb className="text-yellow-400" size="{12}"/>,
  FileCode: <FileCode className="text-green-400" size="{12}"/>,
  Zap: <Zap className="text-orange-400" size="{12}"/>,
  Bug: <Bug className="text-red-400" size="{12}"/>,
  Layers: <Layers className="text-purple-400" size="{12}"/>,
  GitBranch: <GitBranch className="text-pink-400" size="{12}"/>,
  AlertTriangle: <AlertTriangle className="text-yellow-500" size="{12}"/>,
  Terminal: <Terminal className="text-teal-400" size="{12}"/>,
  Code2: <Code2 className="text-blue-400" size="{12}"/>
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  showPills
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="border-t border-gray-800/60 p-3 bg-gray-950/40 backdrop-blur-md">
      {showPills && !isLoading && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none scroll-smooth">
          {PROMPT_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => onSend(tpl.message)}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800/60 rounded-full text-[10px] font-semibold text-gray-300 transition-all hover:scale-105"
            >
              {iconMap[tpl.iconName]}
              <span>{tpl.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything about the problem or solution..."
            className="w-full bg-gray-900/80 border border-gray-800/60 rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30 resize-none font-sans"
            rows={1}
            style={{ minHeight: "36px", maxHeight: "100px" }}
            disabled={isLoading}
          />
        </div>

        {isLoading ? (
          <button
            onClick={onStop}
            title="Stop Generating"
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 p-2 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <StopCircle size="{16}"/>
          </button>
        ) : (
          <button
            onClick={() => onSend()}
            disabled={!value.trim()}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-black p-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-yellow-500/10"
          >
            <Send size="{16}"/>
          </button>
        )}
      </div>
    </div>
  )
}