import roadmap from './curriculum.json'
import type { Curriculum, Lesson, ModuleId, ModuleSeed } from '../types/curriculum'
import { makeLesson, parseLessonMarkdown } from '../utils/markdownLessonParser'

export const curriculum = roadmap as Curriculum
export const modulesById = Object.fromEntries(curriculum.modules.map((module) => [module.id, module])) as
  Record<ModuleId, Curriculum['modules'][number]>

const seeds = import.meta.glob<ModuleSeed>('./modules/*.json', { eager: true, import: 'default' })
const lessonCache = new Map<ModuleId, { markdown: string | null; lesson: Lesson }>()

export function getLesson(id: ModuleId, markdown: string | null = null): Lesson {
  const cached = lessonCache.get(id)
  if (cached && cached.markdown === markdown) return cached.lesson

  const seed = seeds[`./modules/${id.toLowerCase()}.json`]
  const lesson = markdown
    ? makeLesson(parseLessonMarkdown(markdown), true, true)
    : makeLesson(seed.sections, seed.fullLesson)
  lessonCache.set(id, { markdown, lesson })
  return lesson
}

const sidebarTitles: Partial<Record<ModuleId, string>> = {
  M02: 'Git & Collaboration',
  M03: 'Python Backend Engineering',
  M04: 'PostgreSQL & Vector DBs',
  M05: 'MongoDB & Document DBs',
  M06: 'System Design & APIs',
  M08: 'Kubernetes Fundamentals',
  M09: 'Observability',
  M10: 'ML & Hugging Face',
  M11: 'Context Engineering & RAG',
  M12: 'Tool Calling & MCP',
  M13: 'Harness & Guardrails',
  M14: 'Multi-Agent Protocols',
  M15: 'Agent Evals & Operations',
  M16: 'Production Capstone',
}

export function sidebarTitle(id: ModuleId) {
  return sidebarTitles[id] ?? modulesById[id].title
}
