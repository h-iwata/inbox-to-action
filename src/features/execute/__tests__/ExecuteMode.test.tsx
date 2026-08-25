import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ExecuteMode } from '@/features/execute'
import { useTasksStore } from '@/store/tasksStore'
import { taskFactory } from '@/test/factories/task'
import { resetStores } from '@/test/stores'

/** 実行モードの表示と完了操作を検証する。 */
describe('ExecuteMode', () => {
  beforeEach(() => {
    resetStores()
  })

  const state = () => useTasksStore.getState()

  /** work カテゴリに実行中のタスクを1件用意する。 */
  const seedExecutingTask = (title = '実行中のタスク') => {
    const task = taskFactory.build({ category: 'work', title, isExecuting: true })
    useTasksStore.setState(store => ({ lists: { ...store.lists, work: [task] } }))
    return task
  }

  context('with タスクがない', () => {
    it('default: 案内が出る', () => {
      render(<ExecuteMode />)
      expect(screen.getByRole('button', { name: /作成/ })).toBeInTheDocument()
    })
  })

  context('with 実行中のタスクがある', () => {
    beforeEach(() => {
      seedExecutingTask()
    })

    it('default: タスク名と完了ボタンが出る', () => {
      render(<ExecuteMode />)
      // メインの見出しとカテゴリ一覧の両方に出る
      expect(screen.getAllByText('実行中のタスク').length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: /タスクを完了/ })).toBeInTheDocument()
    })

    it('完了ボタンを押すと completed に移る', async () => {
      render(<ExecuteMode />)

      await userEvent.click(screen.getByRole('button', { name: /タスクを完了/ }))

      // 完了アニメーション（300ms）の後に反映される
      await waitFor(() => expect(state().completed).toHaveLength(1))
      expect(state().lists.work).toEqual([])
    })
  })

  context('with 複数カテゴリにタスクがある', () => {
    beforeEach(() => {
      const work = taskFactory.build({ category: 'work', title: '仕事のタスク', isExecuting: true })
      const life = taskFactory.build({ category: 'life', title: '生活のタスク' })
      useTasksStore.setState(store => ({ lists: { ...store.lists, work: [work], life: [life] } }))
    })

    it('実行中でないカテゴリのタスクも一覧に出る', () => {
      render(<ExecuteMode />)
      expect(screen.getByText('生活のタスク')).toBeInTheDocument()
    })
  })
})
