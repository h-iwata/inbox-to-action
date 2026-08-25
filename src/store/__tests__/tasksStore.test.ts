import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useTasksStore } from '@/store/tasksStore'
import { taskFactory } from '@/test/factories/task'
import { hoursAgo } from '@/test/helpers'

/**
 * ストアの配線を検証する。
 * 状態遷移そのものは taskMutations のテストで担保しているので、ここでは
 * 「アクションが mutation を呼べているか」「永続化の境界が正しいか」だけを見る。
 */
describe('useTasksStore', () => {
  const { actions } = useTasksStore.getState()

  beforeEach(() => {
    actions.reset()
    localStorage.clear()
  })

  afterEach(() => {
    actions.reset()
  })

  it('default: アクションから状態を変えられる', () => {
    actions.addTask('テストタスク')
    expect(useTasksStore.getState().lists.inbox).toMatchObject([{ title: 'テストタスク' }])
  })

  it('actions の参照は安定している（再レンダリングを誘発しない）', () =>
    expect(useTasksStore.getState().actions).toBe(actions))

  describe('永続化', () => {
    const persisted = () => JSON.parse(localStorage.getItem('inbox-to-action/tasks') ?? '{}')

    it('default: 状態が localStorage に書かれる', () => {
      actions.addTask('保存されるタスク')
      expect(persisted().state.lists.inbox).toHaveLength(1)
    })

    it('アクションは保存されない', () => {
      actions.addTask('x')
      expect(persisted().state).not.toHaveProperty('actions')
    })

    it('保存されるのは lists / completed / dailyStats だけ', () => {
      actions.addTask('x')
      expect(Object.keys(persisted().state).sort()).toEqual(['completed', 'dailyStats', 'lists'])
    })
  })

  describe('すべてのアクションが mutation に届いている', () => {
    /** 1件だけ work にあるタスクを用意する。 */
    const seedWorkTask = () => {
      const task = taskFactory.build({ category: 'work' })
      useTasksStore.setState(state => ({ lists: { ...state.lists, work: [task] } }))
      return task
    }

    it('classifyTask: inbox から移せる', () => {
      actions.addTask('分類するタスク')
      const task = useTasksStore.getState().lists.inbox[0]
      actions.classifyTask(task.id, 'work')
      expect(useTasksStore.getState().lists.work).toHaveLength(1)
    })

    it('completeTask: completed に移る', () => {
      const task = seedWorkTask()
      actions.completeTask(task.id)
      expect(useTasksStore.getState().completed).toHaveLength(1)
    })

    it('deleteTask: 消える', () => {
      const task = seedWorkTask()
      actions.deleteTask(task.id)
      expect(useTasksStore.getState().lists.work).toEqual([])
    })

    it('moveTaskToInbox: inbox に戻る', () => {
      const task = seedWorkTask()
      actions.moveTaskToInbox(task.id)
      expect(useTasksStore.getState().lists.inbox).toHaveLength(1)
    })

    it('moveTaskToTop: 先頭に移る', () => {
      const first = taskFactory.build({ category: 'work' })
      const second = taskFactory.build({ category: 'work' })
      useTasksStore.setState(state => ({ lists: { ...state.lists, work: [first, second] } }))
      actions.moveTaskToTop(second.id, 'work')
      expect(useTasksStore.getState().lists.work[0].id).toBe(second.id)
    })

    it('toggleExecuting: 実行中になる', () => {
      const task = seedWorkTask()
      actions.toggleExecuting(task.id)
      expect(useTasksStore.getState().lists.work[0].isExecuting).toBe(true)
    })

    it('cleanupExpiredTasks: 期限切れが消える', () => {
      useTasksStore.setState(state => ({
        lists: { ...state.lists, work: [taskFactory.build({ category: 'work', created_at: hoursAgo(25) })] },
      }))
      actions.cleanupExpiredTasks()
      expect(useTasksStore.getState().lists.work).toEqual([])
    })

    it('updateStats: 集計を取り直す', () => {
      actions.addTask('今日のタスク')
      actions.updateStats()
      expect(useTasksStore.getState().dailyStats.created).toBe(1)
    })

    it('reset: 初期状態に戻る', () => {
      actions.addTask('消えるタスク')
      actions.reset()
      expect(useTasksStore.getState().lists.inbox).toEqual([])
      expect(useTasksStore.getState().dailyStats).toEqual({ created: 0, classified: 0, completed: 0 })
    })
  })

  describe('復元（merge）', () => {
    it('default: 保存済みの状態を取り込む', async () => {
      const task = taskFactory.build({ category: 'work' })
      localStorage.setItem(
        'inbox-to-action/tasks',
        JSON.stringify({
          state: { lists: { inbox: [], work: [task], life: [], study: [], hobby: [] }, completed: [], dailyStats: {} },
          version: 0,
        })
      )

      await useTasksStore.persist.rehydrate()

      expect(useTasksStore.getState().lists.work).toHaveLength(1)
      // アクションは失われない
      expect(useTasksStore.getState().actions.addTask).toBeTypeOf('function')
    })

    it('壊れた保存データでも起動できる', async () => {
      localStorage.setItem('inbox-to-action/tasks', JSON.stringify({ state: 'broken', version: 0 }))

      await useTasksStore.persist.rehydrate()

      expect(useTasksStore.getState().lists.inbox).toEqual([])
      expect(useTasksStore.getState().dailyStats).toEqual({ created: 0, classified: 0, completed: 0 })
    })
  })

  describe('存在しないタスクを指定したとき', () => {
    it('deleteTask: 例外を投げない', () => expect(() => actions.deleteTask('missing')).not.toThrow())
    it('completeTask: 例外を投げない', () => expect(() => actions.completeTask('missing')).not.toThrow())
  })

  describe('連続操作でも不変条件が保たれる', () => {
    it('実行中タスクはアプリ全体で1つ', () => {
      const workTask = taskFactory.build({ category: 'work' })
      const lifeTask = taskFactory.build({ category: 'life' })
      useTasksStore.setState(state => ({ lists: { ...state.lists, work: [workTask], life: [lifeTask] } }))

      actions.toggleExecuting(workTask.id)
      actions.toggleExecuting(lifeTask.id)

      const executing = Object.values(useTasksStore.getState().lists)
        .flat()
        .filter(task => task.isExecuting)
      expect(executing).toHaveLength(1)
      expect(executing[0].id).toBe(lifeTask.id)
    })
  })
})
