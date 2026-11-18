import type { DebugCase, Project, Question, Reference } from '../types/curriculum'
import { groupHeadings, readHeadings, safeWebUrl, splitAtHeadings, stableKey, visibleLines } from './markdownBlocks'

const projectHeading = /^project\s+([1-3])\b\s*(?:\([^)]*\))?\s*(?:[:.\-–—]\s*)?(.*)$/i
const projectPart = /^(recommended folder|folder structure|step.by.step|build (?:plan|milestones)|(?:implementation )?milestones|acceptance|verification)/i
const listItem = /^\s*(?:\d+[.)]|[-*+])\s+(?:\[[ xX]\]\s*)?(.+)/
const tiers = ['Foundational', 'Intermediate', 'Production-grade']

function extractMilestones(markdown: string) {
  // Project work stays a prose checklist, including when a pasted lesson contains fenced examples.
  const lines = visibleLines(markdown).map(({ line }) => line)
  const items = lines.flatMap((line) => {
    const bullet = listItem.exec(line)
    if (bullet) return [bullet[1].trim()]
    const heading = /^#{3,6}\s+(?:Milestone\s+\d+[.: —–-]*\s*)?(.+)$/i.exec(line)
    return heading ? [heading[1].trim()] : []
  })
  return [...new Set(items.length ? items : lines.filter((line) => line.trim()).map((line) => line.trim()))]
}

export function parseProjects(markdown: string): Project[] {
  const headings = groupHeadings(markdown, projectHeading)
  const projects = new Map<number, Project>()
  for (const { title, body } of splitAtHeadings(markdown, headings)) {
    const match = projectHeading.exec(title)
    if (!match) continue
    const number = Number(match[1])
    const name = match[2].trim() || tiers[number - 1]
    const visible = visibleLines(body).map(({ line }) => line).join('\n')
    const subheadings = readHeadings(visible)
    for (const { line, index } of visibleLines(visible)) {
      const bold = /^\s*\*\*(.+?)\*\*\s*:?\s*$/.exec(line)
      if (bold) subheadings.push({ title: bold[1].replace(/:$/, ''), index, level: 4 })
    }
    const parts = subheadings.filter((heading) => projectPart.test(heading.title)).sort((a, b) => a.index - b.index)
    const blocks = splitAtHeadings(visible, parts)
    const folderStructure = blocks.find((block) => /folder/i.test(block.title))?.body ?? ''
    const plan = blocks.find((block) => /step.by.step|build|milestones/i.test(block.title))?.body
    const acceptance = blocks.find((block) => /acceptance|verification/i.test(block.title))?.body ?? ''
    const intro = visible.split('\n').slice(0, parts[0]?.index).join('\n')
    const domainPattern = /^\s*(?:\*\*)?Domain\s*:\s*(?:\*\*)?\s*(.+)$/im
    const domain = domainPattern.exec(intro)?.[1].trim() ?? ''
    const milestones = extractMilestones(plan ?? (parts.length ? '' : visible))
    if (!projects.has(number)) projects.set(number, {
      id: `project-${number}-${stableKey(name)}`,
      number,
      title: name,
      domain,
      overview: intro.replace(domainPattern, '').replace(/^\s*(?:\*\*)?Domain & Problem Statement:\s*(?:\*\*)?/i, '').trim(),
      folderStructure,
      milestones: milestones.map((text, index) => ({ id: `m-${index}-${stableKey(text)}`, text })),
      acceptance,
    })
  }
  return Array.from(projects.values()).sort((a, b) => a.number - b.number)
}

const questionHeading = /^(?:Q(?:uestion)?\s*\d+\s*[.):–—-]?|\d+[.)])(?:\s+|$)(.*)/i
const optionLine = /^\s*(?:[-*+]\s+)?(?:\*\*)?\(?([A-H])[.):]\s*(?:\*\*)?\s+(.+)$/i
const answerLabel = /(?:^|\n)\s*(?:[-*+]\s+)?(?:\*\*)?(?:correct\s+(?:answer|option|choice)|answer)\s*(?:\*\*)?\s*[:–—-]\s*(?:\*\*\s*)?/i
const answerLetter = /^(?:option\s+|choice\s+)?(?:\*\*|\x60)?\(?([A-H])\)?(?:\*\*|\x60)?[.)\-–—:]?(?:\*\*)?(?=\s|$)/i

export function parseQuestions(markdown: string): Question[] {
  const headings = groupHeadings(markdown, questionHeading)
  const blocks = headings.length ? headings : visibleLines(markdown).flatMap(({ line, index }) => {
    const title = line.trim().replace(/^\*\*|\*\*$/g, '')
    return questionHeading.test(title) ? [{ title, index }] : []
  })

  return splitAtHeadings(markdown, blocks).flatMap(({ title, body }) => {
    const details = /<details(?:\s[^>]*)?>\s*(?:<summary>[\s\S]*?<\/summary>)?\s*([\s\S]*?)<\/details>/i.exec(body)
    const visible = details ? body.slice(0, details.index).trim() : body.split(answerLabel)[0].trim()
    const lines = visibleLines(visible)
    const optionStart = lines.findIndex(({ line }) => optionLine.test(line))
    const optionsByLetter = new Map<string, { letter: string; text: string }>()
    for (const { line } of lines) {
      const option = optionLine.exec(line)
      if (!option) continue
      const letter = option[1].toUpperCase()
      if (!optionsByLetter.has(letter)) optionsByLetter.set(letter, { letter, text: option[2].trim() })
    }
    const options = Array.from(optionsByLetter.values())
    const context = visible.split('\n').slice(0, optionStart === -1 ? undefined : optionStart).join('\n').trim()
    const prompt = [questionHeading.exec(title)?.[1].trim(), context].filter(Boolean).join('\n\n')
    if (!prompt) return []

    const embeddedLabel = answerLabel.exec(body)
    const embeddedAnswer = embeddedLabel ? body.slice(embeddedLabel.index + embeddedLabel[0].length) : ''
    const answer = (details?.[1] ?? embeddedAnswer).trim()
    const label = answerLabel.exec(answer)
    const keyText = label ? answer.slice(label.index + label[0].length) : answer
    const letter = answerLetter.exec(keyText)
    const matchIndex = options.findIndex((choice) => choice.letter === letter?.[1].toUpperCase())
    const explanation = matchIndex !== -1 && letter ? keyText.slice(letter[0].length).trim() : keyText.trim()
    return [{
      id: `q-${stableKey([title, prompt, ...options.map((option) => option.text), matchIndex, explanation].join('|'))}`,
      prompt,
      options,
      correctChoice: matchIndex === -1 ? null : matchIndex,
      explanation: explanation || (matchIndex !== -1 ? options[matchIndex].text : ''),
    }]
  })
}

export function parseReferences(markdown: string): Reference[] {
  return visibleLines(markdown).flatMap(({ line }) => {
    const link = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)(.*)/i.exec(line)
    const url = link && safeWebUrl(link[2])
    if (!link || !url) return []
    return [{ title: link[1], url: url.href, note: link[3].trim().replace(/^\*\*|^[:—–.-]+\s*/, '').trim() }]
  })
}

export function parseDebugCases(markdown: string): DebugCase[] {
  const headings = readHeadings(markdown)
  const level = Math.min(...headings.map((heading) => heading.level))
  const groups = headings.length ? splitAtHeadings(markdown, headings.filter((heading) => heading.level === level)) : [{ title: '', body: markdown }]
  return groups.filter(({ body }) => body.trim()).map(({ title, body }) => {
    const labelPattern = /^\s*(?:[-*+]\s+)?(?:\*\*)?(Symptom(?: \([^)]*\))?|Root Cause(?: \([^)]*\))?|(?:Exact )?Diagnostic(?: Command\/Check| Command| Check)?|(?:Exact )?Fix)\s*(?:\*\*)?\s*:\s*(?:\*\*)?\s*/i
    const labels = visibleLines(body).flatMap(({ line, index }) => {
      const match = labelPattern.exec(line)
      return match ? [{ index, field: match[1].toLowerCase(), prefix: match[0].length }] : []
    })
    const lines = body.split('\n')
    const values = labels.map(({ index, field, prefix }, i) => ({
      field,
      value: [lines[index].slice(prefix), ...lines.slice(index + 1, labels[i + 1]?.index)].join('\n').trim(),
    }))
    const find = (pattern: RegExp) => values.find(({ field }) => pattern.test(field))?.value ?? ''
    return {
      title: title.replace(/^\d+[.)]\s+/, ''),
      text: body,
      symptom: find(/^symptom/),
      cause: find(/^root cause/),
      diagnostic: find(/diagnostic/),
      fix: find(/fix/),
    }
  })
}
