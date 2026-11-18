import {
  ArrowDown, ArrowRight, BookOpenCheck, BrainCircuit, Clock3, Layers3,
  ListChecks, Server, Target, TrendingUp,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import hero from '../assets/learning-path.webp'
import { curriculum, modulesById } from '../data/curriculum'
import { moduleHref } from '../hooks/useRoute'
import type { ModuleStatus, PhaseId, Progress } from '../types/curriculum'
import { hoursText, summarize } from '../utils/progress'
import { ProgressBar, StatusBadge, statusAppearance } from './ProgressDisplay'

const phasePresentation = {
  'phase-1': { icon: Server, tone: 'violet' },
  'phase-2': { icon: Layers3, tone: 'blue' },
  'phase-3': { icon: BrainCircuit, tone: 'teal' },
}

const statusOrder: ModuleStatus[] = ['Completed', 'In Progress', 'Projects Pending', 'Not Started']

function Metric({ label, value, suffix, detail, icon, tone }: {
  label: string; value: string | number; suffix?: string; detail: string; icon: ReactNode; tone: string
}) {
  return (
    <div className="metric-card surface">
      <div className="metric-heading"><span className={`metric-icon tone-${tone}`}>{icon}</span><h3>{label}</h3></div>
      <div className="metric-value">{value}{suffix && <span>{suffix}</span>}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  )
}

export function Dashboard({ progress }: { progress: Progress }) {
  const summary = summarize(progress)
  const resume = progress.lastVisited
  const next = modulesById[resume?.moduleId ?? 'M01']
  const nextPhase = curriculum.phases.find(({ id }) => id === next.phaseId)!
  const [phaseFilter, setPhaseFilter] = useState<PhaseId | 'all'>('all')
  const tracker = useRef<HTMLElement>(null)
  const distribution = statusOrder.map((status) => ({
    status,
    count: summary.rows.filter(({ value }) => value.status === status).length,
    color: statusAppearance[status].color,
  }))
  let offset = 0
  const gradient = distribution.filter(({ count }) => count > 0).map(({ count, color }) => {
    const start = offset
    offset += count / summary.rows.length * 100
    return `${color} ${start}% ${offset}%`
  }).join(', ')

  function showTracker(phase: PhaseId | 'all') {
    setPhaseFilter(phase)
    tracker.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page-content dashboard">
      <div className="page-heading">
        <h1>Learning Dashboard</h1>
        <p>Track your progress through Python, cloud infrastructure, and agentic AI.</p>
      </div>

      <section className="resume-banner" aria-labelledby="resume-heading">
        <img src={hero} alt="" className="resume-art" fetchPriority="high" />
        <div className="resume-content">
          <div className="resume-label"><span>{next.id}</span>{nextPhase.label} <span className="resume-label-dot" /> {nextPhase.title}</div>
          <h2 id="resume-heading">Continue where you left off</h2>
          <p>{next.title}</p>
          <div className="resume-actions">
            <a href={moduleHref(next.id, resume?.section)} className="button resume-button">
              {resume ? 'Resume module' : 'Start module'}<ArrowRight size={16} />
            </a>
            <span><Clock3 size={15} /> {next.targetHours} hrs estimated</span>
          </div>
        </div>
      </section>

      <section className="metric-section" aria-labelledby="metrics-heading">
        <h2 className="dashboard-section-title" id="metrics-heading">Progress at a glance</h2>
        <div className="metric-grid">
          <Metric label="Modules completed" value={summary.complete} suffix={`/ ${summary.rows.length}`}
            detail="Across three phases" icon={<BookOpenCheck size={18} />} tone="violet" />
          <Metric label="Overall completion" value={`${Math.round(summary.completion)}%`}
            detail="Lessons and projects" icon={<TrendingUp size={18} />} tone="blue" />
          <Metric label="Hours logged" value={hoursText(summary.hours)} suffix="hrs" detail={`of ${curriculum.targetHours.toFixed(1)} hrs target`}
            icon={<Clock3 size={18} />} tone="amber" />
          <Metric label="Projects completed" value={summary.projects} suffix={`/ ${summary.rows.length * 3}`}
            detail="Milestone checklists" icon={<ListChecks size={18} />} tone="teal" />
          <Metric label="Quiz mastery" value={`${summary.mastery}%`}
            detail={summary.graded ? `${summary.graded} question${summary.graded === 1 ? '' : 's'} graded` : 'No questions graded'}
            icon={<Target size={18} />} tone="pink" />
        </div>
      </section>

      <div className="dashboard-panels">
        <section className="surface phase-panel" aria-labelledby="phases-heading">
          <div className="panel-heading">
            <h2 id="phases-heading">Phase progress</h2>
            <button className="text-button" onClick={() => showTracker('all')}>View curriculum <ArrowDown size={14} /></button>
          </div>
          <div className="phase-rows">
            {curriculum.phases.map((phase) => {
              const rows = summary.rows.filter(({ module }) => module.phaseId === phase.id)
              const done = rows.filter(({ value }) => value.status === 'Completed').length
              const completion = Math.round(rows.reduce((total, row) => total + row.completion, 0) / rows.length)
              const { icon: Icon, tone } = phasePresentation[phase.id]
              return (
                <div className="phase-row" key={phase.id}>
                  <span className={`phase-icon tone-${tone}`}><Icon size={19} /></span>
                  <div className="phase-row-main">
                    <div className="phase-row-title">
                      <button onClick={() => showTracker(phase.id)}>{phase.title}</button>
                      <span>{phase.label} <b>·</b> {done}/{rows.length} modules</span>
                    </div>
                    <ProgressBar value={completion} label={`${phase.label} completion`} tone={tone} />
                  </div>
                  <span className="phase-percent">{completion}%</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="surface status-panel" aria-labelledby="status-heading">
          <div className="panel-heading"><h2 id="status-heading">Module status</h2></div>
          <div className="distribution">
            <div className="status-ring" style={{ background: `conic-gradient(${gradient})` }} aria-hidden="true">
              <div><strong>{summary.rows.length}</strong><span>modules</span></div>
            </div>
            <ul className="status-legend">
              {distribution.map(({ status, count, color }) => (
                <li key={status}><i style={{ backgroundColor: color }} /> <span>{status}</span> <strong>{count}</strong></li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section ref={tracker} className="surface tracker-panel" aria-labelledby="tracker-heading">
        <div className="panel-heading">
          <h2 id="tracker-heading">Module tracker</h2>
          <select className="field-select" aria-label="Tracker phase" value={phaseFilter}
            onChange={(event) => setPhaseFilter(event.target.value as PhaseId | 'all')}>
            <option value="all">All phases</option>
            {curriculum.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.label}</option>)}
          </select>
        </div>
        <div className="table-scroll">
          <table className="tracker-table">
            <thead><tr><th scope="col">Module</th><th scope="col">Status</th><th scope="col">Completion</th><th scope="col">Hours</th></tr></thead>
            <tbody>
              {summary.rows.filter(({ module }) => phaseFilter === 'all' || phaseFilter === module.phaseId).map(({ module, value, completion }) => (
                <tr key={module.id}>
                  <td><a href={moduleHref(module.id)}><span>{module.id}</span>{module.title}<ArrowRight size={14} /></a></td>
                  <td><StatusBadge status={value.status} /></td>
                  <td><div className="table-progress"><ProgressBar value={completion} label={`${module.id} completion`} /> <span>{completion}%</span></div></td>
                  <td>{hoursText(value.actualHours)} / {module.targetHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
