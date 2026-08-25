import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TasksState } from '@/store/taskMutations'
import {
  findTaskCategory,
  taskCountByCategory,
  tasksGroupedByCategory,
  todayCompletedByCategory,
  topTasksByCategory,
} from '@/store/taskSelectors'
import { taskFactory } from '@/test/factories/task'
import { listsWith, tasksStateWith } from '@/test/factories/tasksState'
import type { Task } from '@/types'

describe('findTaskCategory', () => {
  let task: Task
  let state: TasksState
  let taskId: string
  const subject = () => findTaskCategory(state, taskId)

  beforeEach(() => {
    task = taskFactory.build({ category: 'work' })
    state = tasksStateWith({ lists: listsWith({ work: [task] }) })
    taskId = task.id
  })

  it('default: 所属カテゴリを返す', () => expect(subject()).toBe('work'))

  context('with inbox のタスク', () => {
    beforeEach(() => {
      task = taskFactory.build()
      state = tasksStateWith({ lists: listsWith({ inbox: [task] }) })
      taskId = task.id
    })

    it('inbox を返す', () => expect(subject()).toBe('inbox'))
  })

  context('with 完了済みのタスク', () => {
    beforeEach(() => {
      task = taskFactory.build({ category: 'life', status: 'done' })
      state = tasksStateWith({ completed: [task] })
      taskId = task.id
    })

    it('完了済みからも見つける', () => expect(subject()).toBe('life'))
  })

  context('with 存在しないID', () => {
    beforeEach(() => {
      taskId = 'missing'
    })

    it('null', () => expect(subject()).toBeNull())
  })
})

describe('tasksGroupedByCategory', () => {
  it('default: inbox を含まない4カテゴリを返す', () => {
    const work = taskFactory.build({ category: 'work' })
    const state = tasksStateWith({ lists: listsWith({ inbox: [taskFactory.build()], work: [work] }) })
    expect(tasksGroupedByCategory(state)).toEqual({ work: [work], life: [], study: [], hobby: [] })
  })
})

describe('topTasksByCategory', () => {
  let state: TasksState
  const subject = () => topTasksByCategory(state)

  beforeEach(() => {
    state = tasksStateWith({
      lists: listsWith({
        work: [taskFactory.build({ category: 'work' }), taskFactory.build({ category: 'work' })],
        life: [taskFactory.build({ category: 'life' })],
      }),
    })
  })

  it('default: 各カテゴリの先頭だけを返す', () => expect(subject()).toHaveLength(2))

  it('work → study → life → hobby の順に並ぶ', () =>
    expect(subject().map(task => task.category)).toEqual(['work', 'life']))

  context('with 全カテゴリにタスクあり', () => {
    beforeEach(() => {
      state = tasksStateWith({
        lists: listsWith({
          work: [taskFactory.build({ category: 'work' })],
          study: [taskFactory.build({ category: 'study' })],
          life: [taskFactory.build({ category: 'life' })],
          hobby: [taskFactory.build({ category: 'hobby' })],
        }),
      })
    })

    it('実行モードの表示順になる', () =>
      expect(subject().map(task => task.category)).toEqual(['work', 'study', 'life', 'hobby']))
  })

  context('with タスクなし', () => {
    beforeEach(() => {
      state = tasksStateWith()
    })

    it('空配列', () => expect(subject()).toEqual([]))
  })

  context('with inbox にだけタスクあり', () => {
    beforeEach(() => {
      state = tasksStateWith({ lists: listsWith({ inbox: [taskFactory.build()] }) })
    })

    it('inbox は含まれない', () => expect(subject()).toEqual([]))
  })
})

describe('taskCountByCategory', () => {
  it('default: カテゴリごとの件数を返す（inbox は含まない）', () => {
    const state = tasksStateWith({
      lists: listsWith({
        inbox: [taskFactory.build(), taskFactory.build()],
        work: [taskFactory.build({ category: 'work' })],
      }),
    })
    expect(taskCountByCategory(state)).toEqual({ work: 1, life: 0, study: 0, hobby: 0 })
  })
})

describe('todayCompletedByCategory', () => {
  let state: TasksState
  const subject = () => todayCompletedByCategory(state)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T15:00:00'))
    state = tasksStateWith({
      completed: [
        taskFactory.build({
          category: 'work',
          status: 'done',
          updated_at: new Date('2026-08-25T10:00:00').toISOString(),
        }),
        taskFactory.build({
          category: 'work',
          status: 'done',
          updated_at: new Date('2026-08-25T11:00:00').toISOString(),
        }),
        taskFactory.build({
          category: 'life',
          status: 'done',
          updated_at: new Date('2026-08-25T12:00:00').toISOString(),
        }),
      ],
    })
  })

  it('default: 今日完了した数をカテゴリ別に数える', () =>
    expect(subject()).toEqual({ work: 2, life: 1, study: 0, hobby: 0 }))

  context('with 昨日完了したタスク', () => {
    beforeEach(() => {
      state = tasksStateWith({
        completed: [
          taskFactory.build({
            category: 'work',
            status: 'done',
            updated_at: new Date('2026-08-24T23:00:00').toISOString(),
          }),
        ],
      })
    })

    it('数に入らない', () => expect(subject().work).toBe(0))
  })

  context('with inbox で完了したタスク', () => {
    beforeEach(() => {
      state = tasksStateWith({
        completed: [
          taskFactory.build({
            category: 'inbox',
            status: 'done',
            updated_at: new Date('2026-08-25T10:00:00').toISOString(),
          }),
        ],
      })
    })

    it('カテゴリ別の集計には含めない', () => expect(subject()).toEqual({ work: 0, life: 0, study: 0, hobby: 0 }))
  })

  context('with 完了済みなし', () => {
    beforeEach(() => {
      state = tasksStateWith()
    })

    it('すべて 0', () => expect(subject()).toEqual({ work: 0, life: 0, study: 0, hobby: 0 }))
  })
})
