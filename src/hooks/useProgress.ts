import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModuleId, ModuleProgress, Progress, Visit } from '../types/curriculum'
import { changeModule, createProgress, storageKey } from '../utils/progress'
import { decodeProgress } from '../utils/progressBackup'

function readProgress() {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return { progress: stored ? decodeProgress(stored) : createProgress(), problem: '' }
  } catch {
    return { progress: createProgress(), problem: 'Saved progress could not be read. You can restore a JSON backup.' }
  }
}

export function useProgress() {
  const [initial] = useState(readProgress)
  const [progress, setProgress] = useState(initial.progress)
  const current = useRef(initial.progress)
  const [storageProblem, setStorageProblem] = useState(initial.problem)

  const apply = useCallback((change: (value: Progress) => Progress) => {
    const next = change(current.current)
    if (next === current.current) return
    current.current = next
    setProgress(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
      setStorageProblem('')
    } catch {
      setStorageProblem('Changes could not be saved on this device. Export a backup to keep your progress.')
    }
  }, [])

  const updateModule = useCallback((id: ModuleId, change: (value: ModuleProgress) => ModuleProgress) => {
    apply((previous) => changeModule(previous, id, change))
  }, [apply])

  const rememberVisit = useCallback((visit: Visit) => {
    apply((previous) => previous.lastVisited?.moduleId === visit.moduleId && previous.lastVisited.section === visit.section
      ? previous
      : { ...previous, lastVisited: visit })
  }, [apply])

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== storageKey && event.key !== null) return
      const next = readProgress()
      if (next.problem) {
        setStorageProblem(next.problem)
        return
      }
      current.current = next.progress
      setProgress(next.progress)
      setStorageProblem('')
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  return { progress, storageProblem, apply, updateModule, rememberVisit }
}
