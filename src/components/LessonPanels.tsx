import { BookOpen, Check, ChevronDown, ExternalLink, Search, Wrench } from 'lucide-react'
import { useState } from 'react'
import type { DebugCase, ModuleProgress, Project, Reference } from '../types/curriculum'
import { checkpointStatus } from '../utils/progress'
import { InlineMarkdown, MarkdownBody } from './MarkdownBody'
import type { UpdateModule } from './ModuleTracking'
import { ProgressBar } from './ProgressDisplay'

export function DebuggingPanel({ cases }: { cases: DebugCase[] }) {
  const [query, setQuery] = useState('')
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const visible = cases.filter((item) => words.every((word) => `${item.title} ${item.text}`.toLowerCase().includes(word)))
  return (
    <>
      <div className="search-field debugging-search">
        <Search size={16} />
        <input type="search" aria-label="Search the debugging playbook" placeholder="Search symptoms, causes, or fixes…"
          value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="debug-list">
        {!visible.length && <p role="status" className="field-hint">No cases match your search.</p>}
        {visible.map((item, index) => (
          <article className="debug-card" key={item.title || index}>
            <h3><Wrench size={16} />{item.title || 'Troubleshooting notes'}</h3>
            {item.symptom || item.cause || item.diagnostic || item.fix ? (
              <dl>
                {[
                  ['Symptom', item.symptom], ['Root cause', item.cause],
                  ['Diagnostic', item.diagnostic], ['Fix', item.fix],
                ].filter(([, text]) => text).map(([label, text]) => (
                  <div key={label}><dt>{label}</dt><dd><MarkdownBody markdown={text} compact /></dd></div>
                ))}
              </dl>
            ) : <InlineMarkdown markdown={item.text} />}
          </article>
        ))}
      </div>
    </>
  )
}

const projectTiers = ['Foundational', 'Intermediate', 'Production-grade']

export function ProjectsPanel({ projects, value, update }: {
  projects: Project[]; value: ModuleProgress; update: UpdateModule
}) {
  function toggle(project: Project, milestoneId: string) {
    update((current) => {
      const checked = current.milestones[project.id] ?? []
      const next = {
        ...current,
        milestones: {
          ...current.milestones,
          [project.id]: checked.includes(milestoneId) ? checked.filter((id) => id !== milestoneId) : [...checked, milestoneId],
        },
      }
      return { ...next, status: checkpointStatus(next, projects) }
    })
  }

  return (
    <div className="project-list">
      {projects.map((project, index) => {
        const checked = value.milestones[project.id] ?? []
        const count = project.milestones.filter(({ id }) => checked.includes(id)).length
        const total = project.milestones.length
        return (
          <details className="project-card" key={project.id} open={index === 0 ? true : undefined}>
            <summary>
              <span className="project-number">{String(project.number).padStart(2, '0')}</span>
              <span className="project-title"><strong>{project.title}</strong>
                <span>{projectTiers[project.number - 1]}{project.domain && ` · ${project.domain}`}</span></span>
              <span className="project-count">{total > 0 ? `${count}/${total}` : '—'}</span>
              <ChevronDown size={16} className="project-chevron" />
            </summary>
            <div className="project-body">
              {total > 0 && <ProgressBar value={count / total * 100} label={`Project ${project.number} progress`} />}
              {project.overview && <MarkdownBody markdown={project.overview} compact />}
              {project.folderStructure && <>
                <h4>Recommended folder structure</h4>
                <MarkdownBody markdown={project.folderStructure} compact />
              </>}
              <h4>Build milestones</h4>
              {total ? <div className="milestones">
                {project.milestones.map((item) => (
                  <label key={item.id} className={`check-row milestone ${checked.includes(item.id) ? 'milestone-complete' : ''}`}>
                    <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(project, item.id)} />
                    <span className="checkbox-mark"><Check size={12} strokeWidth={3} /></span>
                    <InlineMarkdown markdown={item.text} />
                  </label>
                ))}
              </div> : <p className="field-hint">No milestones were found for this blueprint.</p>}
              {project.acceptance && <>
                <h4>Acceptance checklist</h4>
                <MarkdownBody markdown={project.acceptance} compact />
              </>}
            </div>
          </details>
        )
      })}
    </div>
  )
}

export function ReferencesPanel({ references }: { references: Reference[] }) {
  return (
    <div className="reference-list">
      {references.map(({ title, url, note }, index) => (
        <a className="reference-card" key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer">
          <span className="reference-icon tone-violet"><BookOpen size={18} /></span>
          <span><strong>{title}</strong><small>{new URL(url).hostname}</small>{note && <span>{note}</span>}</span>
          <ExternalLink size={16} className="reference-arrow" />
        </a>
      ))}
    </div>
  )
}
