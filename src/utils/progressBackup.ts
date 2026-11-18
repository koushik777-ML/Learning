import { curriculum } from '../data/curriculum'
import { moduleIds, sections, statuses } from '../types/curriculum'
import type { ModuleProgress, Progress, QuizAnswer, StudySession, TimerState } from '../types/curriculum'
import { parseLessonMarkdown } from './markdownLessonParser'
import { summarize } from './progress'

type UnknownRecord = Record<string, unknown>

function record(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
}

function trackedKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value)
}

function keyList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(trackedKey)
}

function isAnswer(value: unknown): value is QuizAnswer {
  return record(value) &&
    (value.choice === null || (nonnegative(value.choice) && Number.isInteger(value.choice) && value.choice < 8)) &&
    typeof value.response === 'string' &&
    (value.grade === null || typeof value.grade === 'boolean') &&
    typeof value.checked === 'boolean' &&
    (!value.checked || typeof value.grade === 'boolean')
}

function isStudySession(value: unknown): value is StudySession {
  return record(value) && nonnegative(value.durationMs) && value.durationMs > 0 && nonnegative(value.loggedAt)
}

function isModuleProgress(value: unknown): value is ModuleProgress {
  return record(value) &&
    statuses.some((status) => status === value.status) &&
    typeof value.lessonComplete === 'boolean' &&
    record(value.milestones) && Object.entries(value.milestones).every(([id, items]) => trackedKey(id) && keyList(items)) &&
    nonnegative(value.actualHours) && value.actualHours <= Number.MAX_SAFE_INTEGER / moduleIds.length &&
    Array.isArray(value.sessions) && value.sessions.every(isStudySession) &&
    record(value.answers) && Object.entries(value.answers).every(([id, item]) => trackedKey(id) && isAnswer(item)) &&
    keyList(value.flagged) &&
    typeof value.notes === 'string' &&
    typeof value.repositoryUrl === 'string' &&
    (value.lessonMarkdown === null || typeof value.lessonMarkdown === 'string')
}

function isTimer(value: unknown): value is TimerState {
  return record(value) && moduleIds.some((id) => id === value.moduleId) &&
    nonnegative(value.elapsedMs) && (value.startedAt === null || nonnegative(value.startedAt))
}

export function decodeProgress(source: string): Progress {
  let data: unknown
  try {
    data = JSON.parse(source)
  } catch {
    throw new Error('Choose a valid progress.json backup.')
  }
  if (!record(data) || data.schemaVersion !== 1) throw new Error('This file is not a version 1 progress backup.')

  const visited = data.lastVisited
  const validVisit = visited === null || (record(visited) &&
    moduleIds.some((id) => id === visited.moduleId) && sections.some(({ id }) => id === visited.section))
  if (!record(data.modules) || !validVisit || (data.timer !== null && !isTimer(data.timer))) {
    throw new Error('The backup is missing valid progress, timer, or resume data.')
  }
  for (const [id, value] of Object.entries(data.modules)) {
    if (!moduleIds.some((moduleId) => moduleId === id) || !isModuleProgress(value)) {
      throw new Error(`The backup has invalid data for ${id}.`)
    }
    if (value.lessonMarkdown !== null) {
      try {
        parseLessonMarkdown(value.lessonMarkdown)
      } catch {
        throw new Error(`The saved lesson for ${id} is not in the eight-section format.`)
      }
    }
  }
  return data as unknown as Progress
}

function csvCell(value: string | number) {
  const text = typeof value === 'string' && /^(?:\s*[=+\-@]|[\t\r\n])/.test(value) ? `'${value}` : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function summaryCsv(progress: Progress) {
  const { rows } = summarize(progress)
  const header = [
    'Mod #', 'Phase', 'Module Title', 'Core Topics & Python Stack', 'Recommended Model & Effort',
    'Module Status', 'Lesson & Lab', 'Project 1 (Foundational)', 'Project 2 (Intermediate)',
    'Project 3 (Production)', 'Completion %', 'Est. Hours', 'Actual Hours Spent', 'Hours Variance',
    'Quiz Mastery %', 'Notes', 'GitHub Repo Link',
  ]
  const phases = Object.fromEntries(curriculum.phases.map((phase) => [phase.id, `${phase.label}: ${phase.title}`]))
  const data = rows.map(({ module, value, projects, completion, quiz }) => [
    module.id, phases[module.phaseId], module.title, module.topics, module.model, value.status,
    value.lessonComplete ? 'Yes' : 'No',
    ...[0, 1, 2].map((index) => projects[index] ? 'Completed' : 'Not Started'),
    `${completion}%`, module.targetHours, rounded(value.actualHours), rounded(value.actualHours - module.targetHours),
    quiz.graded ? `${quiz.percent}%` : '', value.notes, value.repositoryUrl,
  ])
  return '\uFEFF' + [header, ...data].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

function rounded(value: number) {
  return Number(value.toFixed(6))
}

export function downloadText(filename: string, mimeType: string, source: string) {
  const url = URL.createObjectURL(new Blob([source], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
