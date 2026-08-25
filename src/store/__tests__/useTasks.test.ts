import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTasksStore } from '@/store/tasksStore'
import {
  useInboxTasks,
  useTaskCountByCategory,
  useTasksByCategory,
  useTasksGroupedByCategory,
  useTodayCompletedByCategory,
  useTopTasksByCategory,
} from '@/store/useTasks'
import { taskFactory } from '@/test/factories/task'

/**
 * 購読フックの検証。
 * 計算そのものは taskSelectors のテストで担保しているので、ここでは
 * 「ストアに繋がっているか」と「参照が安定しているか」を見る。
 */
describe('購読フック', () => {
  beforeEach(() => {
    useTasksStore.getState().actions.reset()
  })

  it('useInboxTasks: inbox を購読する', () => {
    useTasksStore.getState().actions.addTask('タスク')
    const { result } = renderHook(() => useInboxTasks())
    expect(result.current).toHaveLength(1)
  })

  it('useTasksByCategory: 指定カテゴリを購読する', () => {
    useTasksStore.setState(state => ({
      lists: { ...state.lists, work: [taskFactory.build({ category: 'work' })] },
    }))
    const { result } = renderHook(() => useTasksByCategory('work'))
    expect(result.current).toHaveLength(1)
  })

  it('useTasksGroupedByCategory: 4カテゴリを返す', () => {
    const { result } = renderHook(() => useTasksGroupedByCategory())
    expect(Object.keys(result.current).sort()).toEqual(['hobby', 'life', 'study', 'work'])
  })

  it('useTopTasksByCategory: 各カテゴリの先頭を返す', () => {
    useTasksStore.setState(state => ({
      lists: { ...state.lists, work: [taskFactory.build({ category: 'work' })] },
    }))
    const { result } = renderHook(() => useTopTasksByCategory())
    expect(result.current).toHaveLength(1)
  })

  it('useTaskCountByCategory: 件数を返す', () => {
    const { result } = renderHook(() => useTaskCountByCategory())
    expect(result.current).toEqual({ work: 0, life: 0, study: 0, hobby: 0 })
  })

  it('useTodayCompletedByCategory: 完了数を返す', () => {
    const { result } = renderHook(() => useTodayCompletedByCategory())
    expect(result.current).toEqual({ work: 0, life: 0, study: 0, hobby: 0 })
  })

  describe('useShallow による参照の安定', () => {
    it('無関係な更新では同じ参照が返る', () => {
      const { result, rerender } = renderHook(() => useTopTasksByCategory())
      const before = result.current

      // 派生値に影響しない更新（dailyStats のみ変える）
      useTasksStore.setState({ dailyStats: { created: 99, classified: 0, completed: 0 } })
      rerender()

      expect(result.current).toBe(before)
    })
  })
})
