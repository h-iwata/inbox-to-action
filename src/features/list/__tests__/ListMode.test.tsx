import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ListMode } from '@/features/list'
import { useTasksStore } from '@/store/tasksStore'
import { taskFactory } from '@/test/factories/task'
import { resetStores } from '@/test/stores'

/**
 * 一覧モードの操作を検証する。
 * スワイプ量の判定は swipe-helpers のテストで担保しているので、ここでは扱わない。
 */
describe('ListMode', () => {
  beforeEach(() => {
    resetStores()
  })

  const state = () => useTasksStore.getState()

  const seedWorkTasks = (titles: string[]) => {
    const tasks = titles.map(title => taskFactory.build({ category: 'work', title }))
    useTasksStore.setState(store => ({ lists: { ...store.lists, work: tasks } }))
    return tasks
  }

  context('with タスクがない', () => {
    it('default: 作成モードへの案内が出る', () => {
      render(<ListMode />)
      expect(screen.getAllByRole('button', { name: /作成/ }).length).toBeGreaterThan(0)
    })
  })

  context('with カテゴリにタスクがある', () => {
    beforeEach(() => {
      seedWorkTasks(['最優先のタスク', '2番目のタスク'])
    })

    it('default: 配列順に表示される', () => {
      render(<ListMode />)
      expect(screen.getByText('最優先のタスク')).toBeInTheDocument()
      expect(screen.getByText('2番目のタスク')).toBeInTheDocument()
    })

    it('2番目のタスクをタップすると先頭に移る', async () => {
      render(<ListMode />)

      await userEvent.click(screen.getByText('2番目のタスク'))

      await waitFor(() => expect(state().lists.work[0].title).toBe('2番目のタスク'))
    })
  })

  context('with 先頭タスクをタップする', () => {
    beforeEach(() => {
      seedWorkTasks(['最優先のタスク'])
    })

    it('実行中フラグが立つ', async () => {
      render(<ListMode />)

      await userEvent.click(screen.getByText('最優先のタスク'))

      await waitFor(() => expect(state().lists.work[0].isExecuting).toBe(true))
    })
  })
})
