import { ChevronRight, Download, FileSpreadsheet, Menu, Upload } from 'lucide-react'
import type { Ref } from 'react'
import type { ModuleId } from '../types/curriculum'

interface TopbarProps {
  moduleId: ModuleId | undefined
  navigationOpen: boolean
  menuRef: Ref<HTMLButtonElement>
  onMenu: () => void
  onImport: () => void
  onExport: () => void
  onCsv: () => void
}

export function Topbar({ moduleId, navigationOpen, menuRef, onMenu, onImport, onExport, onCsv }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button ref={menuRef} className="icon-button menu-toggle" type="button" aria-label="Open navigation"
          aria-controls="curriculum-sidebar" aria-expanded={navigationOpen} onClick={onMenu}><Menu size={21} /></button>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/">Workspace</a>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page">{moduleId ?? 'Overview'}</span>
        </nav>
      </div>
      <div className="topbar-actions">
        <button className="button button-neutral topbar-button" onClick={onImport} aria-label="Import Progress" title="Import Progress">
          <Upload size={15} /><span>Import Progress</span>
        </button>
        <button className="button button-neutral topbar-button" onClick={onExport} aria-label="Export Progress" title="Export Progress">
          <Download size={16} /><span>Export Progress</span>
        </button>
        <button className="button button-tinted topbar-button" onClick={onCsv} aria-label="Export Summary CSV" title="Export Summary CSV">
          <FileSpreadsheet size={16} /><span>Export Summary CSV</span>
        </button>
      </div>
    </header>
  )
}
