import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import diff from 'highlight.js/lib/languages/diff'
import ini from 'highlight.js/lib/languages/ini'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import { Check, Copy } from 'lucide-react'
import { isValidElement, useState } from 'react'
import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { copyText } from '../utils/clipboard'
import { safeWebUrl } from '../utils/markdownBlocks'

Object.entries({ bash, diff, ini, javascript, json, python, sql, yaml }).forEach(([language, definition]) =>
  hljs.registerLanguage(language, definition))
hljs.registerAliases(['sh', 'shell', 'zsh'], { languageName: 'bash' })
hljs.registerAliases(['toml'], { languageName: 'ini' })

function CodeBlock({ code, language, diagram }: { code: string; language?: string; diagram: boolean }) {
  const [feedback, setFeedback] = useState('Copy')
  const highlight = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : null
  const isDiagram = diagram && (!language || ['text', 'plaintext', 'ascii'].includes(language))

  async function handleCopy() {
    try {
      await copyText(code)
      setFeedback('Copied')
    } catch {
      setFeedback('Copy unavailable')
    }
  }

  return (
    <div className={`code-block ${isDiagram ? 'code-diagram' : ''}`}>
      <div className="code-toolbar">
        <span>{isDiagram ? 'ASCII diagram' : (language ?? 'Plain text')}</span>
        <button type="button" className="code-copy" onClick={handleCopy} aria-label={`Copy ${isDiagram ? 'ASCII diagram' : 'code'}`}>
          {feedback === 'Copied' ? <Check size={14} /> : <Copy size={14} />}<span aria-live="polite">{feedback}</span>
        </button>
      </div>
      <pre tabIndex={0} aria-label={isDiagram ? 'ASCII architecture diagram' : `${language ?? 'Plain text'} code`}>
        {highlight === null ? <code>{code}</code> : <code dangerouslySetInnerHTML={{ __html: highlight }} />}
      </pre>
    </div>
  )
}

export function MarkdownBody({ markdown, diagram, compact }: { markdown: string; diagram?: boolean; compact?: boolean }) {
  return (
    <div className={`lesson-markdown ${compact ? 'markdown-compact' : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
        a({ href, children }) {
          const url = href && safeWebUrl(href)
          return url ? <a href={url.href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>
        },
        img({ alt }) { return alt ? <span>{alt}</span> : null },
        table({ children }) { return <div className="markdown-table"><table>{children}</table></div> },
        pre({ children }) {
          if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return <pre>{children}</pre>
          const language = /\blanguage-([\w+-]+)/.exec(children.props.className ?? '')?.[1].toLowerCase()
          const code = String(children.props.children ?? '').replace(/\n$/, '')
          return <CodeBlock key={code} code={code} language={language} diagram={Boolean(diagram)} />
        },
      }}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

export function InlineMarkdown({ markdown }: { markdown: string }) {
  return (
    <span className="lesson-markdown markdown-compact">
      <ReactMarkdown skipHtml unwrapDisallowed allowedElements={['p', 'strong', 'em', 'code', 'del', 'br']}
        remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>
        {markdown}
      </ReactMarkdown>
    </span>
  )
}
