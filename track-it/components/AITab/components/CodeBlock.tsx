import React from "react"
import { Check, Copy } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface CodeBlockProps {
  language: string
  code: string
  blockId: string
  onCopy: (content: string, id: string) => void
  copiedId: string | null
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  blockId,
  onCopy,
  copiedId
}) => {
  const isCopied = copiedId === blockId

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-700/60 bg-gray-900 shadow-xl">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/80 border-b border-gray-700/60 text-xs text-gray-400">
        <span className="font-semibold">{language.toUpperCase()}</span>
        <button
          onClick={() => onCopy(code, blockId)}
          className="hover:text-yellow-400 transition-colors flex items-center gap-1 font-medium select-none"
        >
          {isCopied ? (
            <>
              <Check size={12} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="text-xs">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{ margin: 0, padding: "12px", background: "#0a0c10" }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
