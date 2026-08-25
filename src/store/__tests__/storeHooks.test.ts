import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTaskActions, useTasksStore } from '@/store/tasksStore'
import { useCurrentMode, useUIActions, useUIStore } from '@/store/uiStore'

/** アクション・状態を購読するフックの検証。 */
describe('useTaskActions', () => {
  beforeEach(() => {
    useTasksStore.getState().actions.reset()
  })

  it('default: アクションを取得して呼べる', () => {
    const { result } = renderHook(() => useTaskActions())
    act(() => result.current.addTask('フックから追加'))
    expect(useTasksStore.getState().lists.inbox).toHaveLength(1)
  })

  it('再レンダリングしても同じ参照', () => {
    const { result, rerender } = renderHook(() => useTaskActions())
    const before = result.current
    rerender()
    expect(result.current).toBe(before)
  })
})

describe('useUIActions', () => {
  beforeEach(() => {
    useUIStore.setState({ currentMode: 'create', scrollToCategory: null })
  })

  it('default: アクションを取得して呼べる', () => {
    const { result } = renderHook(() => useUIActions())
    act(() => result.current.setMode('list'))
    expect(useUIStore.getState().currentMode).toBe('list')
  })

  it('再レンダリングしても同じ参照', () => {
    const { result, rerender } = renderHook(() => useUIActions())
    const before = result.current
    rerender()
    expect(result.current).toBe(before)
  })
})

describe('useCurrentMode', () => {
  beforeEach(() => {
    useUIStore.setState({ currentMode: 'create', scrollToCategory: null })
  })

  it('default: 現在のモードを返す', () => {
    const { result } = renderHook(() => useCurrentMode())
    expect(result.current).toBe('create')
  })

  it('モード変更に追随する', () => {
    const { result } = renderHook(() => useCurrentMode())
    act(() => {
      useUIStore.getState().actions.setMode('execute')
    })
    expect(result.current).toBe('execute')
  })
})
