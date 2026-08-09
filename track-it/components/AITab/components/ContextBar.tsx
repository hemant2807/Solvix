import React from "react"
import { Brain, RefreshCw, Trash2 } from "lucide-react"

interface ContextBarProps {
  title: string
  language?: string
  onRefresh: () => void
  onClear: () => void
  showClear: boolean
}

export const ContextBar: React.FC<ContextBarProps> = ({
  title,
  language,
  onRefresh,
  onClear,
  showClear
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-900/40 backdrop-blur-md border-b border-gray-800/60 z-20">
      <div className="flex items-center gap-2 overflow-hidden">
        <Brain className="text-yellow-400 shrink-0" size="{18}"/>
        {title ? (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-xs font-semibold text-gray-200 truncate">{title}</span>
            {language && (
              <span className="text-[10px] bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                {language}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No problem selected</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRefresh}
          title="Refresh active tab context"
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size="{14}"/>
        </button>
        {showClear && (
          <button
            onClick={onClear}
            title="Clear Conversation"
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size="{14}"/>
          </button>
        )}
      </div>
    </div>
  )
}