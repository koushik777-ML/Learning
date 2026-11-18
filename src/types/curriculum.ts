export const moduleIds = [
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16',
] as const

export type ModuleId = (typeof moduleIds)[number]
export type PhaseId = 'phase-1' | 'phase-2' | 'phase-3'

export const sections = [
  { id: 'mental-model', label: 'Mental Model', title: 'The Mental Model' },
  { id: 'architecture', label: 'Architecture', title: 'Core Architecture' },
  { id: 'syntax', label: 'Syntax', title: 'Command, Query & Python Syntax' },
  { id: 'lab', label: 'Reference Lab', title: 'End-to-End Reference Lab' },
  { id: 'debugging', label: 'Debugging', title: 'Debugging Playbook' },
  { id: 'projects', label: 'Projects', title: 'Project Blueprints' },
  { id: 'quiz', label: 'Mastery Quiz', title: 'Mastery Checkpoint' },
  { id: 'references', label: 'References', title: 'Deep-Dive References' },
] as const

export type SectionId = (typeof sections)[number]['id']
export type LessonSections = Record<SectionId, string>

export interface ModuleMetadata {
  id: ModuleId
  phaseId: PhaseId
  title: string
  topics: string
  model: string
  targetHours: number
}

export interface Phase {
  id: PhaseId
  label: string
  title: string
}

export interface Curriculum {
  phases: Phase[]
  modules: ModuleMetadata[]
  targetHours: number
}

export interface ModuleSeed {
  metadata: ModuleMetadata
  sections: LessonSections
  fullLesson: boolean
}

export interface Project {
  id: string
  number: number
  title: string
  domain: string
  overview: string
  folderStructure: string
  milestones: { id: string; text: string }[]
  acceptance: string
}

export interface Question {
  id: string
  prompt: string
  options: { letter: string; text: string }[]
  correctChoice: number | null
  explanation: string
}

export interface Reference {
  title: string
  url: string
  note: string
}

export interface DebugCase {
  title: string
  text: string
  symptom: string
  cause: string
  diagnostic: string
  fix: string
}

export interface Lesson {
  sections: LessonSections
  fullLesson: boolean
  imported: boolean
  projects: Project[]
  questions: Question[]
  references: Reference[]
  debugCases: DebugCase[]
}

export const statuses = ['Not Started', 'In Progress', 'Projects Pending', 'Completed'] as const
export type ModuleStatus = (typeof statuses)[number]

export interface QuizAnswer {
  choice: number | null
  response: string
  // Preserve the latest grade while a new attempt is being written.
  grade: boolean | null
  checked: boolean
}

export interface StudySession {
  durationMs: number
  loggedAt: number
}

export interface ModuleProgress {
  status: ModuleStatus
  lessonComplete: boolean
  milestones: Record<string, string[]>
  actualHours: number
  sessions: StudySession[]
  answers: Record<string, QuizAnswer>
  flagged: string[]
  notes: string
  repositoryUrl: string
  lessonMarkdown: string | null
}

export interface Visit {
  moduleId: ModuleId
  section: SectionId
}

export interface TimerState {
  moduleId: ModuleId
  elapsedMs: number
  startedAt: number | null
}

export interface Progress {
  schemaVersion: 1
  modules: Partial<Record<ModuleId, ModuleProgress>>
  lastVisited: Visit | null
  timer: TimerState | null
}
