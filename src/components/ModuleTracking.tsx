import { Check, ChevronDown, ExternalLink, Github, NotebookPen } from 'lucide-react'
import { useState } from 'react'
import { statuses } from '../types/curriculum'
import type { ModuleMetadata, ModuleProgress, ModuleStatus, Progress, Project } from '../types/curriculum'
import { safeWebUrl } from '../utils/markdownBlocks'
import { activeStatus, checkpointStatus, isProjectComplete, moduleCompletion } from '../utils/progress'
import { MarkdownBody } from './MarkdownBody'
import { ProgressBar, StatusDot } from './ProgressDisplay'
import { StudyTimer } from './StudyTimer'

export type UpdateModule = (change: (value: ModuleProgress) => ModuleProgress) => void

interface ModuleTrackingProps {
  module: ModuleMetadata
  value: ModuleProgress
  progress: Progress
  projects: Project[]
  update: UpdateModule
  apply: (change: (value: Progress) => Progress) => void
  onLog: () => void
}

function RepositoryField({ value, update }: { value: string; update: UpdateModule }) {
  const parsed = safeWebUrl(value.trim())
  const repo = parsed && parsed.protocol === 'https:' && ['github.com', 'www.github.com'].includes(parsed.hostname) &&
    !parsed.port && /^\/[\w.-]+\/[\w.-]+\/?$/.test(parsed.pathname) ? parsed.href : null
  const invalid = Boolean(value.trim() && !repo)
  return (
    <div className="repository-field">
      <label className="field-label" htmlFor="repository-url"><Github size={15} /> GitHub repository</label>
      <div className="repo-entry">
        <input className="field-input" id="repository-url" type="url" placeholder="https://github.com/you/repo"
          value={value} onChange={(event) => update((module) => ({ ...module, repositoryUrl: event.target.value }))}
          aria-invalid={invalid} aria-describedby={invalid ? 'invalid-repo' : undefined} />
        {repo && <a className="icon-button" href={repo} target="_blank" rel="noopener noreferrer"
          aria-label="Open GitHub repository"><ExternalLink size={15} /></a>}
      </div>
      {invalid && <div className="field-hint field-error" id="invalid-repo">Enter a GitHub repository URL.</div>}
    </div>
  )
}

function Scratchpad({ value, update }: { value: ModuleProgress; update: UpdateModule }) {
  const [preview, setPreview] = useState(false)
  return (
    <section className="surface scratchpad" aria-labelledby="scratchpad-heading">
      <div className="scratchpad-heading"><NotebookPen size={17} /><h2 id="scratchpad-heading">Scratchpad</h2></div>
      <div className="segmented note-tabs" aria-label="Scratchpad mode">
        <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
        <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
      </div>
      {preview
        ? <div className="notes-preview">{value.notes.trim()
          ? <MarkdownBody markdown={value.notes} compact />
          : <p>Your Markdown notes will appear here.</p>}</div>
        : <textarea className="field-input notes-input" value={value.notes} placeholder="Keep Markdown notes here…"
          aria-label="Markdown notes" onChange={(event) => update((module) => ({ ...module, notes: event.target.value }))} />}
      <RepositoryField value={value.repositoryUrl} update={update} />
    </section>
  )
}

export function ModuleTracking({ module, value, progress, projects, update, apply, onLog }: ModuleTrackingProps) {
  const [draftHours, setDraftHours] = useState<string | null>(null)
  const completedProjects = projects.filter((project) => isProjectComplete(project, value)).length
  const completion = moduleCompletion(value, projects)
  const actual = String(Number(value.actualHours.toFixed(5)))
  const lastSession = value.sessions.at(-1)

  function saveHours(raw: string) {
    const hours = Number(raw)
    if (!Number.isFinite(hours) || hours < 0 || hours > Number.MAX_SAFE_INTEGER / 16) return
    update((current) => ({
      ...current,
      actualHours: hours,
      status: hours > 0 ? activeStatus(current.status) : current.status,
    }))
  }

  return (
    <aside className="module-tracking" aria-label="Module progress and notes">
      <section className="surface tracking-card" aria-labelledby="tracking-heading">
        <div className="tracking-heading"><h2 id="tracking-heading">Module progress</h2><strong>{completion}%</strong></div>
        <ProgressBar value={completion} label="Module completion" />
        <label className="field-label" htmlFor="module-status">Status</label>
        <div className="status-select">
          <StatusDot status={value.status} />
          <select className="field-select" id="module-status" value={value.status}
            onChange={(event) => update((current) => ({ ...current, status: event.target.value as ModuleStatus }))}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <ChevronDown size={15} />
        </div>
        <label className="check-row lesson-check">
          <input type="checkbox" checked={value.lessonComplete} onChange={(event) => {
            const lessonComplete = event.target.checked
            update((current) => {
              const next = { ...current, lessonComplete }
              return { ...next, status: checkpointStatus(next, projects) }
            })
          }} />
          <span className="checkbox-mark"><Check size={12} strokeWidth={3} /></span>
          <span>Lesson &amp; lab complete</span>
        </label>
        <div className="tracking-caption">{completedProjects} / 3 projects completed</div>

        <StudyTimer moduleId={module.id} progress={progress} apply={apply} onLog={onLog} />
        <label className="field-label" htmlFor="actual-hours">Actual hours spent</label>
        <div className="hours-entry">
          <input className="field-input" id="actual-hours" type="number" inputMode="decimal" min="0" step="any"
            value={draftHours ?? actual} onFocus={() => setDraftHours(actual)}
            onChange={(event) => {
              const raw = event.target.value
              setDraftHours(raw)
              if (raw !== '') saveHours(raw)
            }}
            onBlur={(event) => {
              if (!event.target.value && !event.target.validity.badInput) saveHours('0')
              setDraftHours(null)
            }} />
          <span>of {module.targetHours} hrs target</span>
        </div>
        {lastSession && <p className="field-hint">{value.sessions.length} timed {value.sessions.length === 1 ? 'session' : 'sessions'} logged</p>}
      </section>
      <Scratchpad value={value} update={update} />
    </aside>
  )
}
