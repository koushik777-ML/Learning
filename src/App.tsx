import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { modulesById } from './data/curriculum'
import { useProgress } from './hooks/useProgress'
import { useRoute } from './hooks/useRoute'
import { decodeProgress, downloadText, summaryCsv } from './utils/progressBackup'

const ModuleView = lazy(() => import('./components/ModuleView').then((module) => ({ default: module.ModuleView })))

export function App() {
  const { progress, storageProblem, apply, updateModule, rememberVisit } = useProgress()
  const route = useRoute()
  const moduleId = route?.moduleId
  const section = route?.section
  const module = moduleId ? modulesById[moduleId] : null
  const fileInput = useRef<HTMLInputElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null)

  function notify(message: string, error = false) {
    setToast({ message, error })
  }

  useEffect(() => {
    if (moduleId && section) rememberVisit({ moduleId, section })
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = module ? `${module.id} · ${module.title} | Agent Atlas` : 'Agent Atlas · Python & Agentic AI'
  }, [module, moduleId, section, rememberVisit])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!mobileNav) return
    const sidebar = document.getElementById('curriculum-sidebar')
    sidebar?.querySelector<HTMLButtonElement>('.mobile-close')?.focus()
    const media = window.matchMedia('(max-width: 900px)')
    function closeAtDesktop() {
      if (!media.matches) setMobileNav(false)
    }
    function esc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNav(false)
        window.requestAnimationFrame(() => menuButton.current?.focus())
      }
    }
    media.addEventListener('change', closeAtDesktop)
    window.addEventListener('keydown', esc)
    return () => {
      media.removeEventListener('change', closeAtDesktop)
      window.removeEventListener('keydown', esc)
    }
  }, [mobileNav])

  function closeNav() {
    if (!mobileNav) return
    setMobileNav(false)
    window.requestAnimationFrame(() => menuButton.current?.focus())
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    try {
      const backup = decodeProgress((await file.text()).replace(/^\uFEFF/, ''))
      apply(() => backup)
      notify('Progress restored from backup.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'This backup could not be imported.', true)
    }
  }

  function exportProgress() {
    downloadText('progress.json', 'application/json', JSON.stringify(progress, null, 2) + '\n')
    notify('Progress backup downloaded.')
  }

  function exportCsv() {
    downloadText('curriculum-summary.csv', 'text/csv;charset=utf-8', summaryCsv(progress))
    notify('Summary CSV downloaded.')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}>Skip to content</a>
      <Sidebar active={moduleId} progress={progress} open={mobileNav} storageProblem={storageProblem} onClose={closeNav} />
      {mobileNav && <button className="sidebar-backdrop" tabIndex={-1} aria-label="Close navigation" onClick={closeNav} />}
      <div className="workspace" inert={mobileNav}>
        <Topbar moduleId={moduleId} navigationOpen={mobileNav} menuRef={menuButton}
          onMenu={() => setMobileNav(true)} onImport={() => fileInput.current?.click()}
          onExport={exportProgress} onCsv={exportCsv} />
        <input type="file" ref={fileInput} className="sr-only" tabIndex={-1} aria-label="Choose progress backup"
          accept=".json,application/json" onChange={importProgress} />
        {storageProblem && <div className="storage-banner" role="alert"><CircleAlert size={17} />{storageProblem}</div>}
        <main id="main-content" tabIndex={-1}>
          {module && section ? (
            <Suspense fallback={<p className="page-content field-hint" role="status">Loading lesson…</p>}>
              <ModuleView module={module} sectionId={section} key={module.id} progress={progress}
                update={(change) => updateModule(module.id, change)} apply={apply} notify={notify} />
            </Suspense>
          ) : <Dashboard progress={progress} />}
        </main>
      </div>
      {toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`} role={toast.error ? 'alert' : 'status'}>
        {toast.error ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
        <span>{toast.message}</span>
        <button className="icon-button" type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
      </div>}
    </div>
  )
}
