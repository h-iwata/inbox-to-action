import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it } from 'vitest'
import tasksReducer, { addTask, classifyTask, completeTask, deleteTask } from '@/store/slices/tasksSlice'
import { taskFactory } from '@/test/factories/task'
import type { Category, Task } from '@/types'

type TasksState = ReturnType<typeof tasksReducer>

const emptyLists = (): TasksState['lists'] => ({ inbox: [], work: [], life: [], study: [], hobby: [] })

const createStore = (tasks: Partial<TasksState> = {}) => {
  const initial = tasksReducer(undefined, { type: '@@INIT' })
  return configureStore({
    reducer: { tasks: tasksReducer },
    preloadedState: { tasks: { ...initial, ...tasks } },
  })
}

describe('tasksSlice', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  describe('addTask', () => {
    let title: string
    const subject = () => {
      store.dispatch(addTask(title))
      return store.getState().tasks
    }

    beforeEach(() => {
      title = 'テストタスク'
    })

    it('default: inbox に active で追加', () => {
      expect(subject().lists.inbox).toMatchObject([{ title: 'テストタスク', category: 'inbox', status: 'active' }])
    })

    it('id と created_at が採番される', () => {
      const [task] = subject().lists.inbox
      expect(task.id).toBeTruthy()
      expect(Date.parse(task.created_at)).not.toBeNaN()
    })

    context('with inbox に既存タスク', () => {
      let existing: Task

      beforeEach(() => {
        existing = taskFactory.build()
        store = createStore({ lists: { ...emptyLists(), inbox: [existing] } })
      })

      it('末尾に追加', () => expect(subject().lists.inbox.map(t => t.title)).toEqual([existing.title, 'テストタスク']))
    })
  })

  describe('deleteTask', () => {
    let target: Task
    let other: Task
    let targetId: string
    const subject = () => {
      store.dispatch(deleteTask(targetId))
      return store.getState().tasks
    }

    // default に削除対象と非対象を混在させ、1つのテストで「何が残るか」を見せる
    beforeEach(() => {
      target = taskFactory.build()
      other = taskFactory.build()
      store = createStore({ lists: { ...emptyLists(), inbox: [target, other] } })
      targetId = target.id
    })

    it('default: 指定した1件のみ削除', () => expect(subject().lists.inbox).toEqual([other]))

    context('with 存在しない id', () => {
      beforeEach(() => {
        targetId = 'non-existent-id'
      })

      it('そのまま', () => expect(subject().lists.inbox).toEqual([target, other]))
    })

    context('with inbox 以外のカテゴリのタスク', () => {
      beforeEach(() => {
        target = taskFactory.build({ category: 'work' })
        store = createStore({ lists: { ...emptyLists(), work: [target, other] } })
        targetId = target.id
      })

      it('カテゴリを問わず削除', () => expect(subject().lists.work).toEqual([other]))
    })
  })

  describe('completeTask', () => {
    let task: Task
    const subject = () => {
      store.dispatch(completeTask(task.id))
      return store.getState().tasks
    }

    beforeEach(() => {
      task = taskFactory.build({ category: 'work' })
      store = createStore({ lists: { ...emptyLists(), work: [task] } })
    })

    it('default: completed へ移り status=done', () => {
      const state = subject()
      expect(state.lists.work).toEqual([])
      expect(state.completed).toMatchObject([{ id: task.id, status: 'done' }])
    })

    it('dailyStats.completed が増える', () => expect(subject().dailyStats.completed).toBe(1))
  })

  describe('classifyTask', () => {
    let task: Task
    let category: Category
    const subject = () => {
      store.dispatch(classifyTask({ id: task.id, category }))
      return store.getState().tasks
    }

    beforeEach(() => {
      task = taskFactory.build()
      store = createStore({ lists: { ...emptyLists(), inbox: [task] } })
      category = 'work'
    })

    it('default: inbox から指定カテゴリへ移動', () => {
      const state = subject()
      expect(state.lists.inbox).toEqual([])
      expect(state.lists.work).toMatchObject([{ id: task.id, category: 'work' }])
    })

    context('with 移動先に既存タスク', () => {
      let existing: Task

      beforeEach(() => {
        existing = taskFactory.build({ category: 'work' })
        store = createStore({ lists: { ...emptyLists(), inbox: [task], work: [existing] } })
      })

      it('末尾に追加', () => expect(subject().lists.work.map(t => t.id)).toEqual([existing.id, task.id]))
    })
  })
})
