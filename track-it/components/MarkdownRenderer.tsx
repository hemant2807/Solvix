import React, { useMemo } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Props {
  content: string
}

function HeadingBlock({ level, children }: { level: number; children: string }) {
  const sizeByLevel: Record<number, string> = {
    1: "1.3rem",
    2: "1.15rem",
    3: "1rem"
  }
  const fontSize = sizeByLevel[level] || "0.9rem"
  const Tag = (`h${Math.min(level, 6)}` as unknown) as keyof JSX.IntrinsicElements
  return (
    <Tag style={{ marginTop: 16, marginBottom: 8, fontSize, fontWeight: 600, color: "#fbbf24" }}>
      {renderInlineMarkdown(children)}
    </Tag>
  )
}

export default function MarkdownRenderer({ content }: Props) {
  const sections = useMemo(() => parseMarkdown(content), [content])

  return (
    <div
      className="markdown-body"
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "white",
        lineHeight: 1.8
      }}
    >
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          {section.type === "heading" && typeof section.content === "string" && (
            <HeadingBlock level={section.level || 1}>{section.content}</HeadingBlock>
          )}
          {section.type === "paragraph" && (
            <p style={{ marginTop: 8, marginBottom: 8 }}>
              {Array.isArray(section.content) && section.content.map((part, i) => (
                <React.Fragment key={i}>
                  {part.type === "text" && <span>{part.content}</span>}
                  {part.type === "bold" && <strong>{part.content}</strong>}
                  {part.type === "italic" && <em>{part.content}</em>}
                  {part.type === "inlineCode" && (
                    <code style={{ 
                      background: "#1f2937", 
                      padding: "2px 6px", 
                      borderRadius: 4, 
                      fontSize: "0.9em",
                      color: "#fbbf24",
                      fontFamily: "monospace"
                    }}>
                      {part.content}
                    </code>
                  )}
                </React.Fragment>
              ))}
            </p>
          )}
          {section.type === "bulletList" && (
            <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24, listStyleType: "disc" }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ marginBottom: 4, lineHeight: 1.7 }}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          )}
          {section.type === "numberedList" && (
            <ol style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24, listStyleType: "decimal" }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ marginBottom: 4, lineHeight: 1.7 }}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          )}
          {section.type === "blockquote" && (
            <blockquote style={{ marginTop: 8, marginBottom: 8, paddingLeft: 16, borderLeft: "3px solid #fbbf24", color: "#9ca3af", fontStyle: "italic" }}>
              {typeof section.content === "string" ? section.content : ""}
            </blockquote>
          )}
          {section.type === "codeBlock" && (
            <div className="code-card">
              <div className="code-header">
                <span>💻 {section.language.toUpperCase()}</span>
                <button
                  className="copy-btn"
                  onClick={async () => {
                    await navigator.clipboard.writeText(section.code)
                    window.dispatchEvent(
                      new CustomEvent("leetbuddy-toast", {
                        detail: { message: "Copied to clipboard", type: "success" }
                      })
                    )
                  }}
                >
                  📋 Copy
                </button>
              </div>
              <SyntaxHighlighter
                language={section.language}
                style={oneDark}
                wrapLongLines
              >
                {section.code}
              </SyntaxHighlighter>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function unwrapHeadingEmphasis(line: string): string {
  const trimmed = line.trim()
  const wrapped = trimmed.match(/^(\*\*|\*)([\s\S]+)\1$/)
  if (wrapped && /^#{1,6}\s+/.test(wrapped[2])) {
    return wrapped[2]
  }
  return line
}

function parseMarkdown(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const sections: Array<{
    type: "heading" | "paragraph" | "bulletList" | "numberedList" | "blockquote" | "codeBlock"
    content?: string | Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }>
    items?: string[]
    language?: string
    code?: string
    level?: number
  }> = []

  let i = 0
  while (i < lines.length) {
    const line = unwrapHeadingEmphasis(lines[i])

    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || "text"
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      sections.push({
        type: "codeBlock",
        language,
        code: codeLines.join("\n")
      })
      i++
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      sections.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2].trim() })
      i++
      continue
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      sections.push({ type: "blockquote", content: quoteLines.join("\n") })
      continue
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2))
        i++
      }
      sections.push({ type: "bulletList", items })
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""))
        i++
      }
      sections.push({ type: "numberedList", items })
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const paragraphLines: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() &&
           !lines[i].startsWith("```") &&
           !/^#{1,6}\s+/.test(unwrapHeadingEmphasis(lines[i])) &&
           !lines[i].startsWith("> ") &&
           !lines[i].startsWith("- ") &&
           !lines[i].startsWith("* ") &&
           !/^\d+\.\s/.test(lines[i])) {
      paragraphLines.push(lines[i])
      i++
    }
    sections.push({ 
      type: "paragraph", 
      content: parseInlineMarkdown(paragraphLines.join(" ")) 
    })
  }

  return sections
}

function parseInlineMarkdown(text: string): Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }> {
  const parts: Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }> = []
  
  const codeRegex = /`([^`]+)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  
  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: "inlineCode", content: match[1] })
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    const boldItalicParts = parseBoldItalic(remaining)
    parts.push(...boldItalicParts)
  }
  
  if (parts.length === 0) {
    return [{ type: "text", content: text }]
  }
  
  return parts
}

function parseBoldItalic(text: string): Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }> {
  const parts: Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }> = []
  
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) })
    }
    const content = match[1]
    if (content.startsWith("**")) {
      parts.push({ type: "bold", content: content.slice(2, -2) })
    } else {
      parts.push({ type: "italic", content: content.slice(1, -1) })
    }
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) })
  }
  
  return parts.length > 0 ? parts : [{ type: "text", content: text }]
}

function renderInlineMarkdown(text: string) {
  const parts = parseInlineMarkdown(text)
  return (
    <span>
      {parts.map((part, i) => (
        <React.Fragment key="{i}">
          {part.type === "text" && <span>{part.content}</span>}
          {part.type === "bold" && <strong>{part.content}</strong>}
          {part.type === "italic" && <em>{part.content}</em>}
          {part.type === "inlineCode" && (
            <code style={{ 
              background: "#1f2937", 
              padding: "2px 6px", 
              borderRadius: 4, 
              fontSize: "0.9em",
              color: "#fbbf24",
              fontFamily: "monospace"
            }}>
              {part.content}
            </code>
          )}
        </React.Fragment>
      ))}
    </span>
  )
}