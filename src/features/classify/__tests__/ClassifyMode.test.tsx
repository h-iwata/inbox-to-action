import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ClassifyMode } from '@/features/classify'
import { useTasksStore } from '@/store/tasksStore'
import { resetStores } from '@/test/stores'

/**
 * 分類モードの表示と分類操作を検証する。
 * ドラッグ方向の計算は classify-helpers のテストで担保しているので、ここでは扱わない。
 */
describe('ClassifyMode', () => {
  beforeEach(() => {
    resetStores()
  })

  const lists = () => useTasksStore.getState().lists

  context('with inbox にタスクがある', () => {
    beforeEach(() => {
      useTasksStore.getState().actions.addTask('分類するタスク')
    })

    it('default: 先頭のタスクが表示される', () => {
      render(<ClassifyMode />)
      expect(screen.getByText('分類するタスク')).toBeInTheDocument()
    })

    it('4つのカテゴリが選択肢として出る', () => {
      render(<ClassifyMode />)
      for (const label of ['仕事', '生活', '学習', '趣味']) {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0)
      }
    })
  })

  context('with inbox が空', () => {
    it('完了メッセージが出る', () => {
      render(<ClassifyMode />)
      expect(screen.getByText('すべて分類完了！')).toBeInTheDocument()
    })
  })

  context('with 複数のタスク', () => {
    beforeEach(() => {
      useTasksStore.getState().actions.addTask('1つ目')
      useTasksStore.getState().actions.addTask('2つ目')
    })

    it('次のタスクが予告される', () => {
      render(<ClassifyMode />)
      expect(screen.getByText(/2つ目/)).toBeInTheDocument()
    })

    it('分類すると次のタスクが前に出る', () => {
      const { rerender } = render(<ClassifyMode />)
      const first = lists().inbox[0]

      useTasksStore.getState().actions.classifyTask(first.id, 'work')
      rerender(<ClassifyMode />)

      expect(screen.getByText('2つ目')).toBeInTheDocument()
      expect(lists().work).toHaveLength(1)
    })
  })
})
