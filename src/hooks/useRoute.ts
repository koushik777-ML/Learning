import { useSyncExternalStore } from 'react'
import { moduleIds, sections } from '../types/curriculum'
import type { ModuleId, SectionId, Visit } from '../types/curriculum'

export function moduleHref(id: ModuleId, section: SectionId = 'mental-model') {
  return `#/module/${id}/${section}`
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

function getHash() {
  return window.location.hash
}

export function useRoute(): Visit | null {
  const url = useSyncExternalStore(subscribe, getHash)
  const [, type, moduleId, section] = url.split('/')
  const id = type === 'module' ? moduleIds.find((value) => value === moduleId?.toUpperCase()) : undefined
  if (!id) return null
  return { moduleId: id, section: sections.find((entry) => entry.id === section)?.id ?? 'mental-model' }
}
