import React, { useMemo } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Props {
  content: string
}

// Headings previously all rendered at the same size/weight regardless of
// level (#, ##, ### all looked identical). Scale size down as level
// increases so nested headings are visually distinguishable, same idea as
// the sizing already used for the AI popup's inline chat formatter.
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
      {/* Heading text previously rendered as a raw string, so a heading like
          "# **Bugs Found**" (hash correctly detected, but bold markers
          around the text itself) would show literal "**" inside an
          otherwise-correct <h1>. Run it through the same inline parser used
          for paragraphs/list items so bold/italic/inline-code inside a
          heading are handled too. */}
      {renderInlineMarkdown(children)}
    </Tag>
  )
}

export default function MarkdownRenderer({ content }: Props) {
  // Parse markdown into sections
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
                      new CustomEvent("Solvix-toast", {
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

// If a line is entirely wrapped in ** or * (e.g. "**# Bugs Found**") AND
// what's inside that wrapper itself starts with a heading marker, strip the
// wrapper so heading detection sees the "#" at the start of the line like it
// expects. Deliberately narrow (requires the unwrapped content to look like
// a heading) so a genuine standalone bold/italic line - e.g. "**bold
// text**" - is left completely alone.
function unwrapHeadingEmphasis(line: string): string {
  const trimmed = line.trim()
  const wrapped = trimmed.match(/^(\*\*|\*)([\s\S]+)\1$/)
  if (wrapped && /^#{1,6}\s+/.test(wrapped[2])) {
    return wrapped[2]
  }
  return line
}

function parseMarkdown(content: string) {
  // Normalize CRLF (some AI providers / streaming paths emit \r\n) so line-start
  // checks like startsWith("# ") and startsWith("```") behave consistently and
  // no stray \r ends up rendered inside text or code blocks.
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
    // Some AI responses "extra emphasize" a heading by wrapping the whole
    // marker in bold/italic, e.g. "**# Bugs Found**" instead of "# Bugs
    // Found". Since that line then starts with `*`, not `#`, heading
    // detection below never fired - it fell through to the paragraph's
    // bold/italic parser, which matched the *entire* "**# Bugs Found**" as
    // one bold span and rendered <strong># Bugs Found</strong>: visibly
    // bold text with the "#" still showing, exactly like the observed bug.
    // Unwrap that outer emphasis first so the heading marker underneath is
    // detected normally. Only strips it when what's inside genuinely looks
    // like a heading, so real standalone bold/italic lines are untouched.
    const line = unwrapHeadingEmphasis(lines[i])

    // Code block
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

    // Heading (any level - handles beyond the common #/##/### too)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      sections.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2].trim() })
      i++
      continue
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      sections.push({ type: "blockquote", content: quoteLines.join("\n") })
      continue
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2))
        i++
      }
      sections.push({ type: "bulletList", items })
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""))
        i++
      }
      sections.push({ type: "numberedList", items })
      continue
    }

    // Empty line - skip
    if (!line.trim()) {
      i++
      continue
    }

    // Paragraph with inline formatting
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
  
  // Split by inline code first
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
    // Now process bold and italic in the remaining text
    const boldItalicParts = parseBoldItalic(remaining)
    parts.push(...boldItalicParts)
  }
  
  // If no special formatting found, return as text
  if (parts.length === 0) {
    return [{ type: "text", content: text }]
  }
  
  return parts
}

function parseBoldItalic(text: string): Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }> {
  const parts: Array<{ type: "text" | "bold" | "italic" | "inlineCode"; content: string }> = []
  
  // Handle **bold** and *italic* (but not inline code which is already handled)
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
    </span>
  )
}