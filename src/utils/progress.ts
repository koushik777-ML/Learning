import { curriculum, getLesson } from '../data/curriculum'
import type { ModuleId, ModuleProgress, ModuleStatus, Progress, Project, Question, TimerState } from '../types/curriculum'

export const storageKey = 'ai_curriculum_progress_v1'
export const hourInMs = 3_600_000

export const emptyModule: ModuleProgress = {
  status: 'Not Started',
  lessonComplete: false,
  milestones: {},
  actualHours: 0,
  sessions: [],
  answers: {},
  flagged: [],
  notes: '',
  repositoryUrl: '',
  lessonMarkdown: null,
}

export function createProgress(): Progress {
  return { schemaVersion: 1, modules: {}, lastVisited: null, timer: null }
}

export function getModuleProgress(progress: Progress, id: ModuleId) {
  return progress.modules[id] ?? emptyModule
}

export function changeModule(progress: Progress, id: ModuleId, change: (value: ModuleProgress) => ModuleProgress): Progress {
  return { ...progress, modules: { ...progress.modules, [id]: change(getModuleProgress(progress, id)) } }
}

export function isProjectComplete(project: Project, value: ModuleProgress) {
  const checked = value.milestones[project.id] ?? []
  return project.milestones.length > 0 && project.milestones.every(({ id }) => checked.includes(id))
}

export function activeStatus(status: ModuleStatus): ModuleStatus {
  return status === 'Not Started' ? 'In Progress' : status
}

export function checkpointStatus(value: ModuleProgress, projects: Project[]): ModuleStatus {
  if (!value.lessonComplete) return 'In Progress'
  return projects.length === 3 && projects.every((project) => isProjectComplete(project, value))
    ? 'Completed'
    : 'Projects Pending'
}

export function moduleCompletion(value: ModuleProgress, projects: Project[]) {
  if (value.status === 'Completed') return 100
  const completeProjects = projects.filter((project) => isProjectComplete(project, value)).length
  return (Number(value.lessonComplete) + completeProjects) * 25
}

export function quizSummary(questions: Question[], value: ModuleProgress) {
  let correct = 0
  let graded = 0
  const missed: string[] = []
  for (const question of questions) {
    const grade = value.answers[question.id]?.grade
    if (typeof grade !== 'boolean') continue
    graded += 1
    if (grade) correct += 1
    else missed.push(question.id)
  }
  return { graded, correct, missed, percent: graded ? Math.round(correct / graded * 100) : 0 }
}

export function summarize(progress: Progress) {
  const rows = curriculum.modules.map((module) => {
    const value = getModuleProgress(progress, module.id)
    const lesson = getLesson(module.id, value.lessonMarkdown)
    return {
      module,
      value,
      projects: [1, 2, 3].map((number) => lesson.projects.some((project) => project.number === number && isProjectComplete(project, value))),
      completion: moduleCompletion(value, lesson.projects),
      quiz: quizSummary(lesson.questions, value),
    }
  })
  const complete = rows.filter(({ value }) => value.status === 'Completed').length
  const projects = rows.flatMap((row) => row.projects).filter(Boolean).length
  const completion = rows.reduce((sum, row) => sum + row.completion, 0) / rows.length
  const hours = rows.reduce((sum, row) => sum + row.value.actualHours, 0)
  const graded = rows.reduce((sum, row) => sum + row.quiz.graded, 0)
  const correct = rows.reduce((sum, row) => sum + row.quiz.correct, 0)
  return { rows, complete, projects, completion, hours, graded, mastery: graded ? Math.round(correct / graded * 100) : 0 }
}

export function elapsedTime(timer: TimerState | null, now = Date.now()) {
  if (!timer) return 0
  return timer.elapsedMs + (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt))
}

export function logTimer(progress: Progress, now = Date.now()): Progress {
  const timer = progress.timer
  const durationMs = elapsedTime(timer, now)
  if (!timer || durationMs <= 0) return progress
  const next = changeModule(progress, timer.moduleId, (value) => ({
    ...value,
    status: activeStatus(value.status),
    actualHours: value.actualHours + durationMs / hourInMs,
    sessions: [...value.sessions, { durationMs, loggedAt: now }],
  }))
  return { ...next, timer: null }
}

export function clockText(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0')).join(':')
}

export function hoursText(hours: number) {
  const small = hours > 0 && hours < 0.1
  return hours.toLocaleString('en-US', { minimumFractionDigits: small ? 2 : 1, maximumFractionDigits: small ? 2 : 1 })
}
