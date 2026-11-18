import { describe, expect, it } from 'vitest'
import { getLesson } from '../data/curriculum'
import type { ModuleProgress, Progress } from '../types/curriculum'
import {
  changeModule, checkpointStatus, createProgress, elapsedTime, emptyModule, getModuleProgress,
  hourInMs, logTimer, moduleCompletion, summarize,
} from './progress'
import { decodeProgress, summaryCsv } from './progressBackup'

describe('workbook calculations', () => {
  const { projects, questions } = getLesson('M01')

  it('counts each checked-off project and the lesson/lab as independent 25% checkpoints', () => {
    const module: ModuleProgress = {
      ...emptyModule,
      lessonComplete: true,
      milestones: { [projects[0].id]: projects[0].milestones.map(({ id }) => id) },
    }
    expect(checkpointStatus(module, projects)).toBe('Projects Pending')
    expect(moduleCompletion(module, projects)).toBe(50)
    const completed = { ...module, milestones: Object.fromEntries(projects.map((project) =>
      [project.id, project.milestones.map(({ id }) => id)])) }
    expect(checkpointStatus(completed, projects)).toBe('Completed')
    expect(moduleCompletion({ ...emptyModule, status: 'Completed' }, projects)).toBe(100)
  })

  it('computes dashboard scores and retains the previous grade during a retry', () => {
    const progress = changeModule(createProgress(), 'M01', (module) => ({
      ...module,
      actualHours: 2.5,
      status: 'Completed',
      answers: {
        [questions[0].id]: { choice: 1, response: '', grade: true, checked: true },
        [questions[1].id]: { choice: null, response: '', grade: false, checked: false },
      },
    }))
    expect(summarize(progress)).toMatchObject({ complete: 1, completion: 6.25, hours: 2.5, projects: 0, graded: 2, mastery: 50 })
  })
})

describe('progress portability', () => {
  it('logs only the selected module and never logs a session twice', () => {
    const progress: Progress = {
      ...createProgress(),
      timer: { moduleId: 'M02', elapsedMs: hourInMs / 4, startedAt: 1_000 },
    }
    expect(elapsedTime(progress.timer, 1_000 + hourInMs / 4)).toBe(hourInMs / 2)
    const logged = logTimer(progress, 1_000 + hourInMs / 4)
    expect(logged.timer).toBeNull()
    expect(getModuleProgress(logged, 'M01').actualHours).toBe(0)
    expect(getModuleProgress(logged, 'M02')).toMatchObject({ actualHours: 0.5, status: 'In Progress' })
    expect(logTimer(logged)).toBe(logged)
  })

  it('round-trips a version 1 backup and rejects invalid input', () => {
    const progress: Progress = {
      ...changeModule(createProgress(), 'M07', (module) => ({ ...module, notes: '**Remember** volumes', actualHours: 3 })),
      lastVisited: { moduleId: 'M07', section: 'projects' },
      timer: { moduleId: 'M07', elapsedMs: 500, startedAt: null },
    }
    expect(decodeProgress(JSON.stringify(progress))).toEqual(progress)
    expect(() => decodeProgress(JSON.stringify({ ...progress, schemaVersion: 2 }))).toThrow(/version 1/)
    expect(() => decodeProgress(JSON.stringify({ ...progress, modules: { M07: { status: 'Unknown' } } }))).toThrow(/M07/)
    expect(() => decodeProgress(JSON.stringify({ ...progress, modules: { M07: { ...emptyModule, lessonMarkdown: '# Broken' } } }))).toThrow(/eight-section/)
  })

  it('escapes quotation marks and neutralizes Excel formulas in user content', () => {
    const progress = changeModule(createProgress(), 'M01', (module) => ({
      ...module, notes: '=HYPERLINK("test")', actualHours: 1.25,
    }))
    const csv = summaryCsv(progress)
    expect(csv).toContain('"M01","Phase 1: Infra & Data","Linux Essentials"')
    expect(csv).toContain('"1.25","-6.75"')
    expect(csv).toContain('"' + "'=HYPERLINK(" + '""test"")"')
    expect(csv.match(/\r\n/g)).toHaveLength(17)
  })
})
