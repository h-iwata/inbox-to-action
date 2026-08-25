import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { useTasksStore } from '@/store/tasksStore'
import { useUIStore } from '@/store/uiStore'
import { resetStores } from '@/test/stores'

/**
 * アプリ全体の縦串テスト。
 *
 * 「作成 → 分類 → 実行 → 完了」というプロダクトの中心的な流れが、
 * 実際の画面操作で通ることを確認する。個々の計算やロジックは unit test 側で担保済み。
 */
describe('App', () => {
  beforeEach(() => {
    resetStores()
    // デスクトップ幅にしてキーバインドを有効にする
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true, writable: true })
  })

  const state = () => useTasksStore.getState()
  const mode = () => useUIStore.getState().currentMode

  it('default: 作成モードで始まる', () => {
    render(<App />)
    expect(mode()).toBe('create')
    expect(screen.getByPlaceholderText('今日やりたいことは？')).toBeInTheDocument()
  })

  describe('作成 → 分類 → 完了の流れ', () => {
    it('タスクが inbox → カテゴリ → completed と移動する', async () => {
      render(<App />)

      // 1. 作成モードでタスクを追加する
      await userEvent.type(screen.getByPlaceholderText('今日やりたいことは？'), '資料をまとめる{Enter}')
      expect(state().lists.inbox).toHaveLength(1)

      // 2. 分類モードへ移り、キーボードで仕事に分類する
      useUIStore.getState().actions.setMode('classify')
      await userEvent.keyboard('a')
      await waitFor(() => expect(state().lists.work).toHaveLength(1))
      expect(state().lists.inbox).toEqual([])

      // 分類先が空だったので実行中になっている
      expect(state().lists.work[0].isExecuting).toBe(true)

      // 3. 実行モードへ移り、スペースキーで完了する
      useUIStore.getState().actions.setMode('execute')
      await userEvent.keyboard(' ')
      await waitFor(() => expect(state().completed).toHaveLength(1))

      expect(state().completed[0]).toMatchObject({ title: '資料をまとめる', status: 'done' })
      expect(state().lists.work).toEqual([])
    })
  })

  describe('キーボードでのモード遷移', () => {
    it('Tab で次のモードへ進む', async () => {
      render(<App />)
      // 入力欄からフォーカスを外してからキーを送る（入力中は無効なため）
      await userEvent.click(document.body)
      await userEvent.keyboard('{Tab}')
      await waitFor(() => expect(mode()).toBe('classify'))
    })

    it('Shift+Tab で前のモードへ戻る', async () => {
      render(<App />)
      await userEvent.click(document.body)
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
      await waitFor(() => expect(mode()).toBe('execute'))
    })
  })

  describe('入力中はショートカットが無効', () => {
    it('入力欄にフォーカスがあるとき Tab を打ってもモードが変わらない', async () => {
      render(<App />)

      await userEvent.click(screen.getByPlaceholderText('今日やりたいことは？'))
      await userEvent.keyboard('{Tab}')

      // tinykeys が input からのイベントを無視するので、モード切替は発火しない
      expect(mode()).toBe('create')
    })

    it('入力した文字はタスクの分類に使われない', async () => {
      render(<App />)

      await userEvent.type(screen.getByPlaceholderText('今日やりたいことは？'), 'awsd')

      expect(state().lists.work).toEqual([])
      expect(state().lists.study).toEqual([])
    })
  })

  describe('モバイル幅', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true, writable: true })
    })

    it('キーボードショートカットが効かない', async () => {
      render(<App />)
      await userEvent.click(document.body)
      await userEvent.keyboard('{Tab}')
      expect(mode()).toBe('create')
    })
  })
})
