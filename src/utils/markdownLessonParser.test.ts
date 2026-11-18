import { describe, expect, it } from 'vitest'
import { curriculum, getLesson } from '../data/curriculum'
import { sections } from '../types/curriculum'
import { makeLesson, parseLessonMarkdown } from './markdownLessonParser'

const fence = '```'

function lessonMarkdown(bodies: Partial<Record<(typeof sections)[number]['id'], string>> = {}) {
  return sections.map(({ id, title }, index) => `## ${index + 1}. ${title}\n\n${bodies[id] ?? 'Example content.'}`).join('\n\n')
}

describe('generated curriculum', () => {
  it('provides 16 ordered modules with the full 193-hour target across three phases', () => {
    expect(curriculum.modules.map(({ id }) => id)).toEqual(
      Array.from({ length: 16 }, (_, index) => `M${String(index + 1).padStart(2, '0')}`),
    )
    expect(curriculum.targetHours).toBe(193)
    expect(curriculum.phases.map((phase) => curriculum.modules.filter(({ phaseId }) => phaseId === phase.id).length))
      .toEqual([6, 3, 7])
  })

  it.each(curriculum.modules)('$id has three checklists, gradeable questions, and references', ({ id }) => {
    const lesson = getLesson(id)
    const rich = ['M01', 'M02', 'M03'].includes(id)
    expect(lesson.fullLesson).toBe(rich)
    expect(lesson.projects.map(({ number }) => number)).toEqual([1, 2, 3])
    expect(lesson.projects.every(({ milestones }) => milestones.length > 0)).toBe(true)
    expect(lesson.questions).toHaveLength(rich ? 6 : 2)
    expect(new Set(lesson.questions.map(({ id: key }) => key)).size).toBe(lesson.questions.length)
    expect(lesson.questions.filter(({ correctChoice }) => correctChoice !== null)).toHaveLength(rich ? 5 : 2)
    expect(lesson.questions.every(({ explanation }) => Boolean(explanation))).toBe(true)
    if (rich) expect(lesson.questions.at(-1)?.options).toEqual([])
    expect(lesson.references).toHaveLength(rich ? 5 : 3)
    if (rich) {
      expect(lesson.debugCases.length).toBeGreaterThanOrEqual(4)
      expect(lesson.debugCases.every(({ symptom, cause, diagnostic, fix }) => symptom && cause && diagnostic && fix)).toBe(true)
    }
  })
})

describe('lesson import', () => {
  it('accepts a Markdown fence and CRLF and ignores section-shaped headings in embedded code', () => {
    const architecture = `${fence}text\n## 8. This belongs in the diagram\n${fence}`
    const markdown = `${fence}markdown\n${lessonMarkdown({ architecture })}\n${fence}`.replace(/\n/g, '\r\n')
    expect(parseLessonMarkdown(markdown).architecture).toBe(architecture)
  })

  it('rejects incomplete or empty sections instead of replacing saved material', () => {
    expect(() => parseLessonMarkdown('## 1. The Mental Model\nHere is the first section.')).toThrow(/eight lesson headings/)
    expect(() => parseLessonMarkdown(lessonMarkdown({ lab: '' }))).toThrow(/Section 4.*empty/)
  })

  it('creates interactive projects, grades keyed options, preserves a short answer, and extracts safe links', () => {
    const projects = [
      '### Project 1: Project title', '', '**Domain:** Test domain', '', 'A clear problem.',
      '#### Recommended Folder Structure', 'Create a tests directory.', '#### Build Milestones',
      '1. Design the boundary.', '2. Verify the result.', `${fence}python`, 'print("starter code")', fence,
      '#### Acceptance Checklist', '- Exercise one failure.',
    ].join('\n')
    const quiz = [
      '### Q1. Which boundary should be verified?', '- **A.** The request edge.', '- B. The terminal color.', '',
      '<details>', '<summary>Answer & Explanation</summary>', '', '**Answer: A.** Check the edge.', '</details>', '',
      '### Question 2: Explain the result.', '<details>', '<summary>Answer & Explanation</summary>',
      'The edge should reject invalid inputs.', '</details>',
    ].join('\n')
    const references = '- [Python docs](https://docs.python.org/3/) — Start with the library reference.\n- [Invalid](javascript:alert(1))'
    const imported = makeLesson(parseLessonMarkdown(lessonMarkdown({ projects, quiz, references })), true, true)
    expect(imported.projects[0]).toMatchObject({ title: 'Project title', domain: 'Test domain', overview: 'A clear problem.' })
    expect(imported.projects[0].milestones.map(({ text }) => text)).toEqual(['Design the boundary.', 'Verify the result.'])
    expect(imported.questions[0]).toMatchObject({
      correctChoice: 0,
      options: [{ letter: 'A', text: 'The request edge.' }, { letter: 'B', text: 'The terminal color.' }],
      explanation: 'Check the edge.',
    })
    expect(imported.questions[1]).toMatchObject({ correctChoice: null, options: [], explanation: 'The edge should reject invalid inputs.' })
    expect(imported.references).toEqual([{ title: 'Python docs', url: 'https://docs.python.org/3/', note: 'Start with the library reference.' }])
  })
})
