import { configureStore } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist/es/constants'
import { beforeEach, describe, expect, it } from 'vitest'
import tasksReducer from '@/store/slices/tasksSlice'
import { taskFactory } from '@/test/factories/task'
import type { Task } from '@/types'

/**
 * localStorage から復元したデータの正規化テスト。
 *
 * 「localStorage の内容を信頼しない」という不変条件を守るためのもの。
 * 壊れた値・型の違う値・欠けた値が入ってきても、常に妥当な状態に矯正されることを検証する。
 */
const rehydrate = (tasks: unknown) => {
  const store = configureStore({ reducer: { tasks: tasksReducer } })
  store.dispatch({ type: REHYDRATE, key: 'root', payload: { tasks } })
  return store.getState().tasks
}

describe('REHYDRATE の正規化', () => {
  let task: Task
  let persisted: unknown
  const subject = () => rehydrate(persisted)

  beforeEach(() => {
    task = taskFactory.build({ category: 'work' })
    persisted = {
      lists: { inbox: [], work: [task], life: [], study: [], hobby: [] },
      completed: [],
      dailyStats: { created: 3, classified: 2, completed: 1 },
    }
  })

  it('default: 正常なデータはそのまま復元（isExecuting は明示的に false が入る）', () => {
    const state = subject()
    expect(state.lists.work).toEqual([{ ...task, isExecuting: false }])
    expect(state.dailyStats).toEqual({ created: 3, classified: 2, completed: 1 })
  })

  context('with payload が undefined', () => {
    beforeEach(() => {
      persisted = undefined
    })

    it('空の状態になる', () => {
      const state = subject()
      expect(state.lists.work).toEqual([])
      expect(state.completed).toEqual([])
      expect(state.dailyStats).toEqual({ created: 0, classified: 0, completed: 0 })
    })
  })

  context('with lists が配列でない', () => {
    beforeEach(() => {
      persisted = { lists: { inbox: 'broken', work: null, life: 42, study: {}, hobby: [] } }
    })

    it('全カテゴリが空配列になる', () => {
      const state = subject()
      expect(Object.values(state.lists)).toEqual([[], [], [], [], []])
    })
  })

  describe('タスク単位の矯正', () => {
    const firstTask = (state: ReturnType<typeof rehydrate>) => state.lists.inbox[0]
    const withRawTask = (raw: unknown) => {
      persisted = { lists: { inbox: [raw], work: [], life: [], study: [], hobby: [] } }
    }

    context('with id が UUID でない', () => {
      beforeEach(() => {
        withRawTask({ ...task, id: 'not-a-uuid' })
      })

      it('新しい UUID が振られる', () => {
        const id = firstTask(subject()).id
        expect(id).not.toBe('not-a-uuid')
        expect(id).toMatch(/^[0-9a-f-]{36}$/i)
      })
    })

    context('with title が空白のみ', () => {
      beforeEach(() => {
        withRawTask({ ...task, title: '   ' })
      })

      it('(untitled) になる', () => expect(firstTask(subject()).title).toBe('(untitled)'))
    })

    context('with title が文字列でない', () => {
      beforeEach(() => {
        withRawTask({ ...task, title: 123 })
      })

      it('(untitled) になる', () => expect(firstTask(subject()).title).toBe('(untitled)'))
    })

    context('with category が未知の値', () => {
      beforeEach(() => {
        withRawTask({ ...task, category: 'unknown' })
      })

      it('inbox になる', () => expect(firstTask(subject()).category).toBe('inbox'))
    })

    context('with status が未知の値', () => {
      beforeEach(() => {
        withRawTask({ ...task, status: 'pending' })
      })

      it('active になる', () => expect(firstTask(subject()).status).toBe('active'))
    })

    context('with created_at が欠けている', () => {
      beforeEach(() => {
        const { created_at, ...rest } = task
        withRawTask(rest)
      })

      it('現在時刻が入る', () => expect(Date.parse(firstTask(subject()).created_at)).not.toBeNaN())
    })

    context('with isExecuting が真偽値でない', () => {
      beforeEach(() => {
        withRawTask({ ...task, isExecuting: 'yes' })
      })

      it('false になる', () => expect(firstTask(subject()).isExecuting).toBe(false))
    })

    context('with タスクがオブジェクトでない', () => {
      beforeEach(() => {
        withRawTask('broken')
      })

      it('既定値だけのタスクになる', () => {
        expect(firstTask(subject())).toMatchObject({ title: '(untitled)', category: 'inbox', status: 'active' })
      })
    })

    context('with 未知のフィールドを含む', () => {
      beforeEach(() => {
        withRawTask({ ...task, unknownField: 'x' })
      })

      it('取り除かれる', () => expect(firstTask(subject())).not.toHaveProperty('unknownField'))
    })
  })

  describe('dailyStats の矯正', () => {
    const withStats = (dailyStats: unknown) => {
      persisted = { lists: { inbox: [], work: [], life: [], study: [], hobby: [] }, dailyStats }
    }

    context('with 数値でない値', () => {
      beforeEach(() => {
        withStats({ created: 'x', classified: null, completed: undefined })
      })

      it('全て 0 になる', () => expect(subject().dailyStats).toEqual({ created: 0, classified: 0, completed: 0 }))
    })

    context('with NaN', () => {
      beforeEach(() => {
        withStats({ created: Number.NaN, classified: Number.POSITIVE_INFINITY, completed: 5 })
      })

      it('有限数以外は 0 になる', () =>
        expect(subject().dailyStats).toEqual({ created: 0, classified: 0, completed: 5 }))
    })

    context('with dailyStats 自体が欠けている', () => {
      beforeEach(() => {
        withStats(undefined)
      })

      it('全て 0 になる', () => expect(subject().dailyStats).toEqual({ created: 0, classified: 0, completed: 0 }))
    })
  })
})
