import { FileText, FileUp, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Lesson, ModuleId } from '../types/curriculum'
import { makeLesson, parseLessonMarkdown } from '../utils/markdownLessonParser'

interface LessonImportProps {
  moduleId: ModuleId
  saved: string | null
  onClose: () => void
  onImport: (markdown: string, lesson: Lesson) => void
}

export function LessonImport({ moduleId, saved, onClose, onImport }: LessonImportProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [markdown, setMarkdown] = useState(saved ?? '')
  const [filename, setFilename] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [])

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const source = event.target.files?.[0]
    event.target.value = ''
    if (!source) return
    try {
      setMarkdown(await source.text())
      setFilename(source.name)
      setError('')
    } catch {
      setError('This file could not be read. You can paste the lesson instead.')
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    try {
      const content = makeLesson(parseLessonMarkdown(markdown), true, true)
      dialog.current?.close()
      onImport(markdown.trim(), content)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'The lesson could not be imported.')
    }
  }

  return (
    <dialog className="lesson-drawer" ref={dialog} aria-labelledby="lesson-import-heading"
      onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <form onSubmit={submit} className="drawer-form">
        <header className="drawer-header">
          <div className="drawer-heading"><span className="drawer-icon tone-violet"><FileUp size={20} /></span>
            <div><p>{moduleId}</p><h2 id="lesson-import-heading">Import lesson Markdown</h2></div></div>
          <button className="icon-button" type="button" aria-label="Close lesson import" onClick={() => dialog.current?.close()}><X size={20} /></button>
        </header>
        <div className="drawer-body">
          <p>Paste the lesson generated from your ChatGPT prompt or upload a Markdown file. Keep all eight numbered section headings.</p>
          <div className="upload-row">
            <button className="button button-neutral" type="button" onClick={() => file.current?.click()}><Upload size={16} /> Upload Markdown</button>
            {filename && <span><FileText size={15} />{filename}</span>}
            <input ref={file} type="file" className="sr-only" tabIndex={-1} accept=".md,.markdown,.txt,text/markdown,text/plain"
              onChange={readFile} aria-label="Upload Markdown file" />
          </div>
          <label className="field-label" htmlFor="lesson-markdown">Lesson Markdown</label>
          <textarea className="field-input drawer-textarea" id="lesson-markdown" value={markdown}
            onChange={(event) => { setMarkdown(event.target.value); setError(''); setFilename('') }}
            spellCheck={false} placeholder={'## 1. The Mental Model\n\nPaste your lesson here…'} />
          {error && <p className="import-error" role="alert">{error}</p>}
          {saved && <p className="field-hint">Importing replaces the current lesson for {moduleId}.</p>}
        </div>
        <footer className="drawer-footer">
          <button className="button button-neutral" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={!markdown.trim()}><FileUp size={16} /> Import lesson</button>
        </footer>
      </form>
    </dialog>
  )
}
