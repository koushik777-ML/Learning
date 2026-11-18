import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Clock3, Copy, FileUp, Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { curriculum, getLesson } from '../data/curriculum'
import { moduleHref } from '../hooks/useRoute'
import { sections } from '../types/curriculum'
import type { Lesson, ModuleMetadata, Progress, SectionId } from '../types/curriculum'
import { modulePrompt } from '../utils/chatPrompt'
import { copyText } from '../utils/clipboard'
import { getModuleProgress } from '../utils/progress'
import { LessonImport } from './LessonImport'
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
  const [drawer, setDrawer] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const tabNav = useRef<HTMLElement>(null)
  const value = getModuleProgress(progress, module.id)
  const lesson = getLesson(module.id, value.lessonMarkdown)
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

  async function copyPrompt() {
    try {
      await copyText(modulePrompt(module))
      setPromptCopied(true)
      notify(`ChatGPT prompt for ${module.id} copied.`)
    } catch {
      notify('Clipboard access is unavailable in this browser.', true)
    }
  }

  function importLesson(markdown: string, content: Lesson) {
    update((current) => ({ ...current, lessonMarkdown: markdown }))
    setDrawer(false)
    const count = content.questions.length
    const projects = content.projects.length
    notify(`Lesson imported for ${module.id}. ${projects} project${projects === 1 ? '' : 's'}, ${count} interactive question${count === 1 ? '' : 's'}.`)
  }

  function lessonPanel() {
    const markdown = lesson.sections[sectionId]
    if (!markdown) return (
      <div className="lesson-empty">
        <span className="empty-icon tone-violet"><BookOpen size={24} /></span>
        <h3>Bring in your full lesson</h3>
        <p>Copy this module’s ChatGPT prompt, then import the generated Markdown. Starter practice is available under Projects, Mastery Quiz, and References.</p>
        <button className="button button-primary" onClick={() => setDrawer(true)}><FileUp size={16} /> Import lesson Markdown</button>
      </div>
    )
    if (sectionId === 'debugging') return <DebuggingPanel cases={lesson.debugCases} />
    if (sectionId === 'projects' && lesson.projects.length) return <ProjectsPanel projects={lesson.projects} value={value} update={update} />
    if (sectionId === 'quiz' && lesson.questions.length) return (
      <QuizRunner key={lesson.questions.map(({ id }) => id).join('-')} questions={lesson.questions} value={value} update={update} />
    )
    if (sectionId === 'references' && lesson.references.length) return <ReferencesPanel references={lesson.references} />
    return <MarkdownBody markdown={markdown} diagram={sectionId === 'architecture'} />
  }

  return (
    <div className="page-content module-page">
      <a className="back-link" href="#/"><ArrowLeft size={15} /> Back to overview</a>
      <div className="surface module-heading">
        <div className="module-heading-tags">
          <span className="module-id-tag">{module.id}</span>
          <span>{phase.label} · {phase.title}</span>
          <span className="lesson-source">{lesson.imported ? 'Imported lesson' : lesson.fullLesson ? 'Full lesson' : 'Starter materials'}</span>
        </div>
        <h1>{module.title}</h1>
        <p>{module.topics}</p>
        <div className="module-heading-bottom">
          <div className="module-metadata">
            <span><Clock3 size={16} /> {module.targetHours} hrs target</span>
            <span><Sparkles size={16} /> {module.model}</span>
          </div>
          <div className="module-actions">
            <button className="button button-neutral" onClick={copyPrompt} aria-label="Copy ChatGPT Prompt for This Module">
              {promptCopied ? <Check size={15} /> : <Copy size={15} />}{promptCopied ? 'Prompt copied' : 'Copy ChatGPT prompt'}
            </button>
            <button className="button button-primary" onClick={() => setDrawer(true)}><FileUp size={16} /> Import lesson Markdown</button>
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
      {drawer && <LessonImport moduleId={module.id} saved={value.lessonMarkdown}
        onClose={() => setDrawer(false)} onImport={importLesson} />}
    </div>
  )
}
