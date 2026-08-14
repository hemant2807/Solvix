import React from "react"
import { Sparkles } from "lucide-react"
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

interface WelcomeScreenProps {
  onSelectPrompt: (message: string) => void
}

const iconMap: Record<string, React.ReactNode> = {
  HelpCircle: <HelpCircle className="text-cyan-400" size={16}/>,
  Lightbulb: <Lightbulb className="text-yellow-400" size={16}/>,
  FileCode: <FileCode className="text-green-400" size={16}/>,
  Zap: <Zap className="text-orange-400" size={16}/>,
  Bug: <Bug className="text-red-400" size={16}/>,
  Layers: <Layers className="text-purple-400" size={16}/>,
  GitBranch: <GitBranch className="text-pink-400" size={16}/>,
  AlertTriangle: <AlertTriangle className="text-yellow-500" size={16}/>,
  Terminal: <Terminal className="text-teal-400" size={16}/>,
  Code2: <Code2 className="text-blue-400" size={16}/>
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  return (
    <div className="h-full flex flex-col justify-between py-4 space-y-4">
      <div className="text-center space-y-2 mt-4 px-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/20">
          <Sparkles className="text-black" size={24}/>
        </div>
        <h3 className="text-base font-bold text-white">Solvix AI Assistant</h3>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Select a quick prompt below or start typing to analyze logic, dry run code, and discover optimal algorithms.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-1">
        {PROMPT_TEMPLATES.map((tpl, i) => (
          <button
            key={i}
            onClick={() => onSelectPrompt(tpl.message)}
            className="flex flex-col items-start gap-1.5 p-2.5 bg-gray-900/50 hover:bg-gray-800/60 border border-gray-800/60 hover:border-gray-700/60 rounded-xl transition-all duration-300 text-left group"
          >
            <div className="p-1 bg-gray-950/40 rounded-lg group-hover:scale-105 transition-transform">
              {iconMap[tpl.iconName] || <HelpCircle size={16}/>}
            </div>
            <span className="text-xs font-semibold text-gray-200">{tpl.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}