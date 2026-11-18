import roadmap from './curriculum.json'
import practiceMarkdown from './practice.json'
import type { Curriculum, Lesson, ModuleId, ModuleData } from '../types/curriculum'
import { parseProjects, parseQuestions } from '../utils/lessonContent'
import { makeLesson } from '../utils/markdownLessonParser'

export const curriculum = roadmap as Curriculum
export const modulesById = Object.fromEntries(curriculum.modules.map((module) => [module.id, module])) as
  Record<ModuleId, Curriculum['modules'][number]>

type Practice = Pick<Lesson, 'projects' | 'questions'>
const practiceCache = new Map<ModuleId, Practice>()

export function getPractice(id: ModuleId): Practice {
  const cached = practiceCache.get(id)
  if (cached) return cached
  const { projects, quiz } = practiceMarkdown[id]
  const practice = { projects: parseProjects(projects), questions: parseQuestions(quiz) }
  practiceCache.set(id, practice)
  return practice
}

const loadModules = import.meta.glob<ModuleData>('./modules/*.json', { import: 'default' })
const lessonCache = new Map<ModuleId, Promise<Lesson>>()

export function loadLesson(id: ModuleId): Promise<Lesson> {
  const cached = lessonCache.get(id)
  if (cached) return cached
  const lesson = loadModules[`./modules/${id.toLowerCase()}.json`]().then(({ sections }) => makeLesson(sections))
  lessonCache.set(id, lesson)
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
