import { sections } from '../types/curriculum'
import type { Lesson, LessonSections } from '../types/curriculum'
import { readHeadings, splitAtHeadings } from './markdownBlocks'
import { parseDebugCases, parseProjects, parseQuestions, parseReferences } from './lessonContent'

const sectionTitles = [
  /mental model/i,
  /architecture|under the hood/i,
  /syntax|command.*query/i,
  /reference (?:lab|example)|end.to.end.*example/i,
  /debugging|pitfalls/i,
  /projects|blueprints/i,
  /checkpoint|mastery|quiz/i,
  /references|documentation/i,
]

function normalizeMarkdown(markdown: string) {
  const text = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
  const wrapped = /^(`{3,}|~{3,})[ \t]*(?:markdown|md)[ \t]*\n([\s\S]*?)\n\1[ \t]*$/i.exec(text)
  return wrapped ? wrapped[2].trim() : text
}

export function parseLessonMarkdown(markdown: string): LessonSections {
  const text = normalizeMarkdown(markdown)
  if (!text) throw new Error('Paste or upload a Markdown lesson first.')

  const candidates = readHeadings(text).flatMap((heading) => {
    const number = /^(?:section\s+)?([1-8])(?:[.)\s:–—-]+|$)/i.exec(heading.title)
    const explicitTitle = sectionTitles.findIndex((pattern) => pattern.test(heading.title))
    const sectionIndex = number ? Number(number[1]) - 1 : explicitTitle
    return sectionIndex === -1 ? [] : [{ ...heading, sectionIndex }]
  })
  const byLevel = [...new Set(candidates.map((heading) => heading.level))].map((level) =>
    candidates.filter((heading) => heading.level === level))
  const groups = [...byLevel, candidates.filter((heading) => /^section\s/i.test(heading.title))]
  const allSections = groups.find((group) =>
    group.length === sections.length && group.every((heading, index) => heading.sectionIndex === index))
  if (!allSections) {
    throw new Error('Use the eight lesson headings in order, starting with “## 1. The Mental Model” and ending with “## 8. Curated Deep-Dive References”.')
  }

  const blocks = splitAtHeadings(text, allSections)
  const empty = blocks.findIndex((block) => !block.body)
  if (empty !== -1) throw new Error(`Section ${empty + 1} (${sections[empty].title}) is empty.`)
  return Object.fromEntries(sections.map(({ id }, index) => [id, blocks[index].body])) as LessonSections
}

export function makeLesson(content: LessonSections, fullLesson: boolean, imported = false): Lesson {
  return {
    sections: content,
    fullLesson,
    imported,
    projects: parseProjects(content.projects),
    questions: parseQuestions(content.quiz),
    references: parseReferences(content.references),
    debugCases: parseDebugCases(content.debugging),
  }
}
