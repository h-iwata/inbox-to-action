import { produce } from 'immer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addTask,
  classifyTask,
  cleanupExpiredTasks,
  completeTask,
  deleteTask,
  moveTaskToInbox,
  moveTaskToTop,
  type TasksState,
  toggleExecuting,
  updateStats,
} from '@/store/taskMutations'
import { taskFactory } from '@/test/factories/task'
import { listsWith, tasksStateWith } from '@/test/factories/tasksState'
import { hoursAgo } from '@/test/helpers'
import type { Task } from '@/types'

/** mutation を適用した新しい state を返す。 */
const apply = (state: TasksState, mutate: (draft: TasksState) => void): TasksState =>
  produce(state, draft => {
    mutate(draft)
  })

/** 実行中フラグが立っているタスクを全カテゴリから集める。 */
const executingTasks = (state: TasksState): Task[] =>
  Object.values(state.lists)
    .flat()
    .filter(task => task.isExecuting === true)

describe('addTask', () => {
  let state: TasksState
  const subject = () => apply(state, draft => addTask(draft, '新しいタスク'))

  beforeEach(() => {
    state = tasksStateWith()
  })

  it('default: inbox に active で積まれる', () =>
    expect(subject().lists.inbox).toMatchObject([{ title: '新しいタスク', category: 'inbox', status: 'active' }]))

  it('作成数が増える', () => expect(subject().dailyStats.created).toBe(1))

  it('isExecuting は立たない', () => expect(subject().lists.inbox[0].isExecuting).toBe(false))

  context('with 既存タスクあり', () => {
    beforeEach(() => {
      state = tasksStateWith({ lists: listsWith({ inbox: [taskFactory.build()] }) })
    })

    it('末尾に積まれる', () => expect(subject().lists.inbox[1].title).toBe('新しいタスク'))
  })
})

describe('deleteTask', () => {
  let target: Task
  let other: Task
  let state: TasksState
  const subject = () => apply(state, draft => deleteTask(draft, target.id))

  // 削除対象と非対象を混在させ、1つのテストで「何が残るか」を見せる
  beforeEach(() => {
    target = taskFactory.build({ category: 'work' })
    other = taskFactory.build({ category: 'work' })
    state = tasksStateWith({ lists: listsWith({ work: [target, other] }) })
  })

  it('default: 対象だけ消える', () => expect(subject().lists.work).toEqual([other]))

  context('with 存在しないID', () => {
    beforeEach(() => {
      target = taskFactory.build()
    })

    it('何も変わらない', () => expect(subject().lists.work).toHaveLength(2))
  })

  context('with 完了済みタスク', () => {
    beforeEach(() => {
      state = tasksStateWith({ completed: [target, other] })
    })

    it('completed からも消せる', () => expect(subject().completed).toEqual([other]))
  })

  context('with inbox のタスクに実行中フラグが立っている（壊れたデータから復元された場合）', () => {
    beforeEach(() => {
      // 通常はあり得ないが、localStorage の内容次第では起こりうる
      target = taskFactory.build({ isExecuting: true })
      other = taskFactory.build()
      state = tasksStateWith({ lists: listsWith({ inbox: [target, other] }) })
    })

    it('削除できて、inbox に実行中は生まれない', () => {
      const result = subject()
      expect(result.lists.inbox.map(t => t.id)).toEqual([other.id])
      expect(executingTasks(result)).toEqual([])
    })
  })

  context('with 実行中タスクが最後の1件', () => {
    beforeEach(() => {
      target = taskFactory.build({ category: 'work', isExecuting: true })
      state = tasksStateWith({ lists: listsWith({ work: [target] }) })
    })

    it('引き継ぐ相手がいないので実行中は消える', () => {
      const result = subject()
      expect(result.lists.work).toEqual([])
      expect(executingTasks(result)).toEqual([])
    })
  })

  context('with 実行中タスクを削除', () => {
    beforeEach(() => {
      target = taskFactory.build({ category: 'work', isExecuting: true })
      state = tasksStateWith({ lists: listsWith({ work: [target, other] }) })
    })

    it('次の先頭が実行中を引き継ぐ', () => expect(subject().lists.work[0].isExecuting).toBe(true))
  })
})

describe('completeTask', () => {
  let task: Task
  let next: Task
  let state: TasksState
  const subject = () => apply(state, draft => completeTask(draft, task.id))

  beforeEach(() => {
    task = taskFactory.build({ category: 'work', isExecuting: true })
    next = taskFactory.build({ category: 'work' })
    state = tasksStateWith({ lists: listsWith({ work: [task, next] }) })
  })

  it('default: completed に移り status=done になる', () => {
    const result = subject()
    expect(result.lists.work.map(t => t.id)).toEqual([next.id])
    expect(result.completed).toMatchObject([{ id: task.id, status: 'done' }])
  })

  it('完了数が増える', () => expect(subject().dailyStats.completed).toBe(1))

  it('完了したタスクの実行中フラグは降りる', () => expect(subject().completed[0].isExecuting).toBe(false))

  it('次の先頭が実行中を引き継ぐ', () => expect(subject().lists.work[0].isExecuting).toBe(true))

  context('with inbox のタスク', () => {
    beforeEach(() => {
      task = taskFactory.build()
      state = tasksStateWith({ lists: listsWith({ inbox: [task] }) })
    })

    it('実行中は引き継がれない（inbox は対象外）', () => expect(executingTasks(subject())).toEqual([]))
  })
})

describe('存在しないタスクを指定したとき', () => {
  let state: TasksState

  beforeEach(() => {
    state = tasksStateWith({ lists: listsWith({ work: [taskFactory.build({ category: 'work' })] }) })
  })

  it('completeTask: 何も起きない', () => expect(apply(state, draft => completeTask(draft, 'missing'))).toEqual(state))

  it('classifyTask: 何も起きない', () =>
    expect(apply(state, draft => classifyTask(draft, 'missing', 'life'))).toEqual(state))

  it('moveTaskToInbox: 何も起きない', () =>
    expect(apply(state, draft => moveTaskToInbox(draft, 'missing'))).toEqual(state))
})

describe('classifyTask', () => {
  let task: Task
  let state: TasksState
  let category: 'work' | 'life'
  const subject = () => apply(state, draft => classifyTask(draft, task.id, category))

  beforeEach(() => {
    task = taskFactory.build()
    state = tasksStateWith({ lists: listsWith({ inbox: [task] }) })
    category = 'work'
  })

  it('default: 指定カテゴリへ移る', () => {
    const result = subject()
    expect(result.lists.inbox).toEqual([])
    expect(result.lists.work).toMatchObject([{ id: task.id, category: 'work' }])
  })

  it('分類数が増える', () => expect(subject().dailyStats.classified).toBe(1))

  it('移動先が空だったので実行中になる', () => expect(subject().lists.work[0].isExecuting).toBe(true))

  context('with 移動先に既存タスク', () => {
    let existing: Task

    beforeEach(() => {
      existing = taskFactory.build({ category: 'work' })
      state = tasksStateWith({ lists: listsWith({ inbox: [task], work: [existing] }) })
    })

    it('末尾に積まれる', () => expect(subject().lists.work.map(t => t.id)).toEqual([existing.id, task.id]))

    it('実行中にはならない（先頭ではない）', () => expect(subject().lists.work[1].isExecuting).toBe(false))
  })

  context('with 他カテゴリに実行中タスクがある', () => {
    beforeEach(() => {
      state = tasksStateWith({
        lists: listsWith({ inbox: [task], life: [taskFactory.build({ category: 'life', isExecuting: true })] }),
      })
    })

    it('実行中は奪わない（全体で1つを維持）', () => {
      const result = subject()
      expect(executingTasks(result)).toHaveLength(1)
      expect(result.lists.life[0].isExecuting).toBe(true)
    })
  })

  context('with 実行中タスクを別カテゴリへ移す', () => {
    let remaining: Task

    beforeEach(() => {
      task = taskFactory.build({ category: 'work', isExecuting: true })
      remaining = taskFactory.build({ category: 'work' })
      state = tasksStateWith({ lists: listsWith({ work: [task, remaining] }) })
      category = 'life'
    })

    it('元カテゴリの新しい先頭が実行中になる', () => {
      const result = subject()
      expect(result.lists.work[0].isExecuting).toBe(true)
      expect(executingTasks(result)).toHaveLength(1)
    })
  })
})

describe('cleanupExpiredTasks', () => {
  let fresh: Task
  let expired: Task
  let state: TasksState
  const subject = () => apply(state, cleanupExpiredTasks)

  // 期限内と期限切れを混ぜて、1つのテストで「何が残るか」を見せる
  beforeEach(() => {
    fresh = taskFactory.build({ category: 'work', created_at: hoursAgo(1) })
    expired = taskFactory.build({ category: 'work', created_at: hoursAgo(25) })
    state = tasksStateWith({ lists: listsWith({ work: [fresh, expired] }) })
  })

  it('default: 24時間を過ぎたものだけ消える', () => expect(subject().lists.work).toEqual([fresh]))

  context('with 完了済みが期限切れ', () => {
    beforeEach(() => {
      state = tasksStateWith({ completed: [expired, fresh] })
    })

    it('完了済みも例外にしない', () => expect(subject().completed).toEqual([fresh]))
  })

  context('with inbox のタスクが期限切れ', () => {
    beforeEach(() => {
      state = tasksStateWith({ lists: listsWith({ inbox: [expired] }) })
    })

    it('inbox も対象', () => expect(subject().lists.inbox).toEqual([]))
  })

  describe('境界', () => {
    const survivesAfter = (hours: number) => {
      const task = taskFactory.build({ category: 'work', created_at: hoursAgo(hours) })
      const result = apply(tasksStateWith({ lists: listsWith({ work: [task] }) }), cleanupExpiredTasks)
      return result.lists.work.length === 1
    }

    it('23時間59分は残る', () => expect(survivesAfter(23.98)).toBe(true))
    it('24時間1分は消える', () => expect(survivesAfter(24.02)).toBe(false))
  })

  context('with created_at が不正な文字列', () => {
    beforeEach(() => {
      state = tasksStateWith({ lists: listsWith({ work: [taskFactory.build({ created_at: 'broken' })] }) })
    })

    it('日付として解釈できないものは消す', () => expect(subject().lists.work).toEqual([]))
  })
})

describe('toggleExecuting', () => {
  let first: Task
  let second: Task
  let state: TasksState
  let targetId: string
  const subject = () => apply(state, draft => toggleExecuting(draft, targetId))

  beforeEach(() => {
    first = taskFactory.build({ category: 'work' })
    second = taskFactory.build({ category: 'work' })
    state = tasksStateWith({ lists: listsWith({ work: [first, second] }) })
    targetId = first.id
  })

  it('default: 先頭タスクを実行中にできる', () => expect(subject().lists.work[0].isExecuting).toBe(true))

  context('when もう一度呼ぶ', () => {
    beforeEach(() => {
      first = taskFactory.build({ category: 'work', isExecuting: true })
      state = tasksStateWith({ lists: listsWith({ work: [first, second] }) })
      targetId = first.id
    })

    it('降ろせる', () => expect(subject().lists.work[0].isExecuting).toBe(false))
  })

  context('with 先頭以外のタスク', () => {
    beforeEach(() => {
      targetId = second.id
    })

    it('立たない', () => expect(executingTasks(subject())).toEqual([]))
  })

  context('with inbox のタスク', () => {
    beforeEach(() => {
      const inboxTask = taskFactory.build()
      state = tasksStateWith({ lists: listsWith({ inbox: [inboxTask] }) })
      targetId = inboxTask.id
    })

    it('立たない', () => expect(executingTasks(subject())).toEqual([]))
  })

  context('with 他カテゴリで実行中のタスクがある', () => {
    beforeEach(() => {
      state = tasksStateWith({
        lists: listsWith({
          work: [first, second],
          life: [taskFactory.build({ category: 'life', isExecuting: true })],
        }),
      })
    })

    it('アプリ全体で1つだけになる', () => {
      const result = subject()
      expect(executingTasks(result)).toHaveLength(1)
      expect(result.lists.work[0].isExecuting).toBe(true)
      expect(result.lists.life[0].isExecuting).toBe(false)
    })
  })

  context('with 存在しないID', () => {
    beforeEach(() => {
      targetId = 'missing'
    })

    it('何も起きない', () => expect(executingTasks(subject())).toEqual([]))
  })
})

describe('moveTaskToInbox', () => {
  let task: Task
  let remaining: Task
  let state: TasksState
  const subject = () => apply(state, draft => moveTaskToInbox(draft, task.id))

  beforeEach(() => {
    task = taskFactory.build({ category: 'work', isExecuting: true })
    remaining = taskFactory.build({ category: 'work' })
    state = tasksStateWith({ lists: listsWith({ work: [task, remaining] }) })
  })

  it('default: inbox に戻る', () => {
    const result = subject()
    expect(result.lists.work.map(t => t.id)).toEqual([remaining.id])
    expect(result.lists.inbox).toMatchObject([{ id: task.id, category: 'inbox' }])
  })

  it('実行中フラグは降りる', () => expect(subject().lists.inbox[0].isExecuting).toBe(false))

  it('元カテゴリの新しい先頭が実行中になる', () => {
    const result = subject()
    expect(result.lists.work[0].isExecuting).toBe(true)
    expect(executingTasks(result)).toHaveLength(1)
  })

  context('with すでに inbox にある', () => {
    beforeEach(() => {
      task = taskFactory.build()
      state = tasksStateWith({ lists: listsWith({ inbox: [task] }) })
    })

    it('inbox に留まる', () => expect(subject().lists.inbox).toHaveLength(1))
  })
})

describe('moveTaskToTop', () => {
  let first: Task
  let second: Task
  let third: Task
  let state: TasksState
  let targetId: string
  const subject = () => apply(state, draft => moveTaskToTop(draft, targetId, 'work'))

  beforeEach(() => {
    first = taskFactory.build({ category: 'work', isExecuting: true })
    second = taskFactory.build({ category: 'work' })
    third = taskFactory.build({ category: 'work' })
    state = tasksStateWith({ lists: listsWith({ work: [first, second, third] }) })
    targetId = third.id
  })

  it('default: 先頭へ移り、他の順序は保たれる', () =>
    expect(subject().lists.work.map(t => t.id)).toEqual([third.id, first.id, second.id]))

  it('先頭が変わるので実行中フラグは降りる', () => expect(executingTasks(subject())).toEqual([]))

  context('with すでに先頭のタスク', () => {
    beforeEach(() => {
      targetId = first.id
    })

    it('何も変わらない（実行中も維持）', () => {
      const result = subject()
      expect(result.lists.work.map(t => t.id)).toEqual([first.id, second.id, third.id])
      expect(result.lists.work[0].isExecuting).toBe(true)
    })
  })

  context('with 存在しないID', () => {
    beforeEach(() => {
      targetId = 'missing'
    })

    it('何も変わらない', () => expect(subject().lists.work).toHaveLength(3))
  })
})

describe('moveTaskToTop（inbox）', () => {
  it('inbox では実行中フラグを触らない', () => {
    const first = taskFactory.build()
    const second = taskFactory.build()
    const state = tasksStateWith({ lists: listsWith({ inbox: [first, second] }) })

    const result = apply(state, draft => moveTaskToTop(draft, second.id, 'inbox'))
    expect(result.lists.inbox.map(t => t.id)).toEqual([second.id, first.id])
  })
})

describe('updateStats', () => {
  let state: TasksState
  const subject = () => apply(state, updateStats)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T12:00:00'))
    state = tasksStateWith({
      lists: listsWith({
        inbox: [taskFactory.build({ created_at: new Date('2026-08-25T09:00:00').toISOString() })],
        work: [taskFactory.build({ category: 'work', created_at: new Date('2026-08-25T10:00:00').toISOString() })],
      }),
      completed: [
        taskFactory.build({
          category: 'life',
          status: 'done',
          created_at: new Date('2026-08-25T11:00:00').toISOString(),
        }),
      ],
    })
  })

  it('default: 今日ぶんを数え直す', () =>
    expect(subject().dailyStats).toEqual({ created: 3, classified: 2, completed: 1 }))

  context('with 昨日のタスク', () => {
    beforeEach(() => {
      state = tasksStateWith({
        lists: listsWith({ inbox: [taskFactory.build({ created_at: new Date('2026-08-24T23:00:00').toISOString() })] }),
      })
    })

    it('数に入らない', () => expect(subject().dailyStats.created).toBe(0))
  })
})
