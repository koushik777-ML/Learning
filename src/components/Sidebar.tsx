import { ChevronDown, CircleAlert, CircleCheck, LayoutGrid, Route, Search, X } from 'lucide-react'
import { useState } from 'react'
import { curriculum, sidebarTitle } from '../data/curriculum'
import { moduleHref } from '../hooks/useRoute'
import type { ModuleId, ModuleStatus, PhaseId, Progress } from '../types/curriculum'
import { getModuleProgress } from '../utils/progress'
import { StatusDot } from './ProgressDisplay'

const filters: { value: ModuleStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'In Progress', label: 'Active' },
  { value: 'Projects Pending', label: 'Projects' },
  { value: 'Completed', label: 'Done' },
  { value: 'Not Started', label: 'New' },
]

interface SidebarProps {
  active: ModuleId | undefined
  progress: Progress
  open: boolean
  storageProblem: string
  onClose: () => void
}

export function Sidebar({ active, progress, open, storageProblem, onClose }: SidebarProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ModuleStatus | 'All'>('All')
  const [collapsed, setCollapsed] = useState<Partial<Record<PhaseId, boolean>>>({})
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const visible = curriculum.modules.filter((module) => {
    const haystack = [module.id, module.title, sidebarTitle(module.id), module.topics].join(' ').toLowerCase()
    return words.every((word) => haystack.includes(word)) &&
      (filter === 'All' || getModuleProgress(progress, module.id).status === filter)
  })

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} id="curriculum-sidebar">
      <div className="sidebar-brand">
        <a className="brand" href="#/" onClick={onClose}>
          <span className="brand-icon"><Route size={22} strokeWidth={2.15} /></span>
          <span><strong>Agent Atlas</strong><small>Python & Agentic AI</small></span>
        </a>
        <button className="icon-button mobile-close" aria-label="Close navigation" onClick={onClose}><X size={19} /></button>
      </div>

      <div className="sidebar-controls">
        <div className="sidebar-label">Workspace</div>
        <a className={`overview-link ${active ? '' : 'nav-selected'}`} href="#/" onClick={onClose}
          aria-current={active ? undefined : 'page'}>
          <LayoutGrid size={17} strokeWidth={1.9} /><span>Overview</span>
        </a>
        <div className="sidebar-label curriculum-label">Curriculum</div>
        <div className="search-field sidebar-search">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setCollapsed({}) }} type="search"
            placeholder="Find a module…" aria-label="Find a module" />
        </div>
        <div className="status-filters" aria-label="Filter modules by status">
          {filters.map(({ value, label }) => (
            <button key={value} type="button" className={`filter-pill ${filter === value ? 'pill-selected' : ''}`}
              title={value === 'All' ? 'All modules' : value}
              aria-label={value === 'All' ? 'All modules' : value} aria-pressed={filter === value}
              onClick={() => { setFilter(value); setCollapsed({}) }}>{label}</button>
          ))}
        </div>
      </div>

      <nav className="module-nav" aria-label="Curriculum modules">
        {visible.length === 0 && <p className="nav-empty">No modules match your filters.</p>}
        {curriculum.phases.map((phase) => {
          const modules = visible.filter((module) => module.phaseId === phase.id)
          if (!modules.length) return null
          const expanded = !collapsed[phase.id]
          return (
            <div className="nav-phase" key={phase.id}>
              <button className="nav-phase-toggle" type="button" aria-expanded={expanded} aria-controls={`nav-${phase.id}`}
                onClick={() => setCollapsed((current) => ({ ...current, [phase.id]: !expanded }))}>
                <span><span className="phase-name-prefix">{phase.label}</span><span className="phase-nav-divider">·</span>{phase.title}</span>
                <ChevronDown size={14} className={expanded ? '' : 'chevron-closed'} />
              </button>
              <div id={`nav-${phase.id}`} hidden={!expanded}>
                {modules.map((module) => {
                  const { status } = getModuleProgress(progress, module.id)
                  return (
                    <a key={module.id} href={moduleHref(module.id)} onClick={onClose} title={`${module.title} · ${status}`}
                      className={`module-link ${active === module.id ? 'nav-selected' : ''}`}
                      aria-current={active === module.id ? 'page' : undefined}>
                      <span className="module-nav-code">{module.id}</span>
                      <span className="module-nav-title">{sidebarTitle(module.id)}</span>
                      <StatusDot status={status} />
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className={`sidebar-footer ${storageProblem ? 'save-warning' : ''}`}>
        {storageProblem ? <CircleAlert size={16} /> : <CircleCheck size={16} />}
        <span>{storageProblem ? 'Local storage unavailable' : 'Progress saved on this device'}</span>
      </div>
    </aside>
  )
}
