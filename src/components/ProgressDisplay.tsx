import type { ModuleStatus } from '../types/curriculum'

export const statusAppearance: Record<ModuleStatus, { className: string; color: string }> = {
  'Not Started': { className: 'status-new', color: '#e3e2ef' },
  'In Progress': { className: 'status-active', color: '#7657ed' },
  'Projects Pending': { className: 'status-pending', color: '#e7a046' },
  Completed: { className: 'status-done', color: '#2ca58c' },
}

export function ProgressBar({ value, label, tone = 'violet' }: { value: number; label: string; tone?: string }) {
  const amount = Math.min(100, Math.max(0, value))
  return (
    <div className={`progress-track tone-${tone}`} role="progressbar" aria-label={label}
      aria-valuenow={Math.round(amount)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${amount}%` }} />
    </div>
  )
}

export function StatusDot({ status }: { status: ModuleStatus }) {
  return <span className={`status-dot ${statusAppearance[status].className}`} aria-hidden="true" />
}

export function StatusBadge({ status }: { status: ModuleStatus }) {
  return <span className={`status-badge ${statusAppearance[status].className}`}><StatusDot status={status} />{status}</span>
}
