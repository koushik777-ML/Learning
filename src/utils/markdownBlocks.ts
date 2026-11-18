export interface Heading {
  title: string
  index: number
  level: number
}

export interface MarkdownBlock {
  title: string
  body: string
}

export function visibleLines(markdown: string) {
  const lines = markdown.split('\n')
  let fence: string | null = null

  return lines.map((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = null
      }
      return { line: '', index }
    }
    if (marker) {
      fence = marker[1]
      return { line: '', index }
    }
    return { line, index }
  })
}

export function readHeadings(markdown: string): Heading[] {
  return visibleLines(markdown).flatMap(({ line, index }) => {
    const match = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(line)
    return match ? [{ title: match[2].trim().replace(/^\*\*|\*\*$/g, ''), index, level: match[1].length }] : []
  })
}

export function splitAtHeadings(markdown: string, headings: Pick<Heading, 'title' | 'index'>[]): MarkdownBlock[] {
  const lines = markdown.split('\n')
  return headings.map((heading, index) => ({
    title: heading.title,
    body: lines.slice(heading.index + 1, headings[index + 1]?.index).join('\n').trim(),
  }))
}

export function groupHeadings(markdown: string, match: RegExp): Heading[] {
  const entries = readHeadings(markdown).filter(({ title }) => match.test(title))
  const level = Math.min(...entries.map((entry) => entry.level))
  return entries.filter((entry) => entry.level === level)
}

export function stableKey(source: string) {
  let hash = 2166136261
  const normalized = source.replace(/\s+/g, ' ').trim()
  for (let index = 0; index < normalized.length; index += 1) {
    hash = Math.imul(hash ^ normalized.charCodeAt(index), 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function safeWebUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url : null
  } catch {
    return null
  }
}
