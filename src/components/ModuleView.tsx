import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Clock3, Sparkles,
} from 'lucide-react'
import { use, useEffect, useRef } from 'react'
import { curriculum, loadLesson } from '../data/curriculum'
import { moduleHref } from '../hooks/useRoute'
import { sections } from '../types/curriculum'
import type { ModuleMetadata, Progress, SectionId } from '../types/curriculum'
import { getModuleProgress } from '../utils/progress'
import { DebuggingPanel, ProjectsPanel, ReferencesPanel } from './LessonPanels'
import { MarkdownBody } from './MarkdownBody'
import { ModuleTracking } from './ModuleTracking'
import type { UpdateModule } from './ModuleTracking'
import { QuizRunner } from './QuizRunner'

interface ModuleViewProps {
  module: ModuleMetadata
  sectionId: SectionId
  progress: Progress
  update: UpdateModule
  apply: (change: (value: Progress) => Progress) => void
  notify: (message: string, error?: boolean) => void
}

export function ModuleView({ module, sectionId, progress, update, apply, notify }: ModuleViewProps) {
  const tabNav = useRef<HTMLElement>(null)
  const value = getModuleProgress(progress, module.id)
  const lesson = use(loadLesson(module.id))
  const phase = curriculum.phases.find(({ id }) => id === module.phaseId)!
  const sectionIndex = sections.findIndex(({ id }) => id === sectionId)
  const section = sections[sectionIndex]
  const previous = sections[sectionIndex - 1]
  const next = sections[sectionIndex + 1]

  useEffect(() => {
    const nav = tabNav.current
    const tab = nav?.querySelector<HTMLAnchorElement>('[aria-current="page"]')
    if (!nav || !tab) return
    const parent = nav.getBoundingClientRect()
    const active = tab.getBoundingClientRect()
    if (active.left < parent.left || active.right > parent.right) {
      nav.scrollLeft += active.left - parent.left - 16
    }
  }, [sectionId])

  function lessonPanel() {
    const markdown = lesson.sections[sectionId]
    if (sectionId === 'debugging') return <DebuggingPanel cases={lesson.debugCases} />
    if (sectionId === 'projects' && lesson.projects.length) return <ProjectsPanel projects={lesson.projects} value={value} update={update} />
    if (sectionId === 'quiz' && lesson.questions.length) return (
      <QuizRunner key={lesson.questions.map(({ id }) => id).join('-')} questions={lesson.questions} value={value} update={update} />
    )
    if (sectionId === 'references' && lesson.references.length) return (
      <>
        {lesson.referenceNotes && <div className="references-notes"><MarkdownBody markdown={lesson.referenceNotes} /></div>}
        <ReferencesPanel references={lesson.references} />
      </>
    )
    return <MarkdownBody markdown={markdown} diagram={sectionId === 'architecture'} />
  }

  return (
    <div className="page-content module-page">
      <a className="back-link" href="#/"><ArrowLeft size={15} /> Back to overview</a>
      <div className="surface module-heading">
        <div className="module-heading-tags">
          <span className="module-id-tag">{module.id}</span>
          <span>{phase.label} · {phase.title}</span>
        </div>
        <h1>{module.title}</h1>
        <p>{module.topics}</p>
        <div className="module-heading-bottom">
          <div className="module-metadata">
            <span><Clock3 size={16} /> {module.targetHours} hrs target</span>
            <span><Sparkles size={16} /> {module.model}</span>
          </div>
        </div>
      </div>
      <div className="module-layout">
        <article className="surface lesson-card" aria-labelledby="lesson-section-heading">
          <nav className="lesson-tabs" aria-label="Lesson sections" ref={tabNav}>
            {sections.map(({ id, label }) => <a key={id} href={moduleHref(module.id, id)} aria-current={sectionId === id ? 'page' : undefined}>{label}</a>)}
          </nav>
          <div className="lesson-section" key={sectionId}>
            <h2 id="lesson-section-heading">{section.title}</h2>
            {lessonPanel()}
          </div>
          <div className="section-pagination">
            {previous ? <a className="button button-neutral" href={moduleHref(module.id, previous.id)}>
              <ChevronLeft size={16} />{previous.label}
            </a> : <span />}
            {next && <a className="button button-tinted" href={moduleHref(module.id, next.id)}>
              {next.label}<ChevronRight size={16} />
            </a>}
            {!next && module.id !== 'M16' && <a className="button button-tinted"
              href={moduleHref(curriculum.modules[curriculum.modules.indexOf(module) + 1].id)}>
              Next module<ArrowRight size={15} />
            </a>}
          </div>
        </article>
        <ModuleTracking module={module} value={value} progress={progress} projects={lesson.projects}
          update={update} apply={apply} onLog={() => notify(`Study session logged for ${module.id}.`)} />
      </div>
    </div>
  )
}
