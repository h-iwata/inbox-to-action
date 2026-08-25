import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useTasksStore } from '@/store/tasksStore'
import { taskFactory } from '@/test/factories/task'

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
