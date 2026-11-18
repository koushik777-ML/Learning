import { Clock3, Pause, Play, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { moduleHref } from '../hooks/useRoute'
import type { ModuleId, Progress } from '../types/curriculum'
import { activeStatus, changeModule, clockText, elapsedTime, logTimer } from '../utils/progress'

interface StudyTimerProps {
  moduleId: ModuleId
  progress: Progress
  apply: (change: (value: Progress) => Progress) => void
  onLog: () => void
}

export function StudyTimer({ moduleId, progress, apply, onLog }: StudyTimerProps) {
  const timer = progress.timer?.moduleId === moduleId ? progress.timer : null
  const running = timer?.startedAt != null
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [running])
  const elapsed = elapsedTime(timer, now)

  function toggle() {
    const at = Date.now()
    setNow(at)
    apply((value) => {
      const current = value.timer
      if (current && current.moduleId !== moduleId) return value
      if (current?.startedAt != null) {
        return { ...value, timer: { ...current, elapsedMs: elapsedTime(current, at), startedAt: null } }
      }
      const next = changeModule(value, moduleId, (module) => ({ ...module, status: activeStatus(module.status) }))
      return { ...next, timer: { moduleId, elapsedMs: current?.elapsedMs ?? 0, startedAt: at } }
    })
  }

  function log() {
    if (!timer || !elapsedTime(timer)) return
    apply((value) => value.timer?.moduleId === moduleId ? logTimer(value) : value)
    onLog()
  }

  return (
    <div className="study-timer">
      <div className="timer-heading"><Clock3 size={16} /><h3>Study timer</h3>{running && <span className="timer-live" aria-label="Running" />}</div>
      {progress.timer && !timer ? (
        <p className="timer-other">A session is open in <a href={moduleHref(progress.timer.moduleId)}>{progress.timer.moduleId}</a>.</p>
      ) : (
        <>
          <div className="timer-clock" aria-label={`Elapsed time ${clockText(elapsed)}`}>{clockText(elapsed)}</div>
          <div className="timer-actions">
            <button className="button button-tinted" onClick={toggle}>
              {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : timer ? 'Resume' : 'Start'}
            </button>
            <button className="button button-neutral" disabled={elapsed <= 0} onClick={log}><Plus size={15} />Log session</button>
          </div>
        </>
      )}
    </div>
  )
}
