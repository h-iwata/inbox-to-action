import { createListenerMiddleware } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'
import type { RootState } from './index'
import { setMode, type AppMode } from './slices/uiSlice'
import type { KeyAction } from './slices/keyBindingsSlice'

export const listenerMiddleware = createListenerMiddleware()

// キー入力を正規化（Shift+Tab など）
const normalizeKey = (e: KeyboardEvent): string => {
  const parts: string[] = []
  if (e.shiftKey && e.key !== 'Shift') parts.push('Shift')
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.metaKey) parts.push('Meta')
  parts.push(e.key)
  return parts.join('+')
}

// キーに対応するアクションを検索
const findActionForKey = (
  key: string,
  bindings: Record<KeyAction, string[]>
): KeyAction | null => {
  for (const [action, keys] of Object.entries(bindings)) {
    if (keys.includes(key)) {
      return action as KeyAction
    }
  }
  return null
}

// モード切り替えのヘルパー
const modes: AppMode[] = ['create', 'classify', 'list', 'execute']

const getNextMode = (current: AppMode): AppMode => {
  const index = modes.indexOf(current)
  return modes[(index + 1) % modes.length]
}

const getPrevMode = (current: AppMode): AppMode => {
  const index = modes.indexOf(current)
  return modes[(index - 1 + modes.length) % modes.length]
}

// REHYDRATE後にキーボードリスナーを登録
listenerMiddleware.startListening({
  type: REHYDRATE,
  effect: async (_, listenerApi) => {
    // デスクトップ判定（768px以上）
    const isDesktop = () => window.innerWidth >= 768

    const handleKeyDown = (e: KeyboardEvent) => {
      // モバイルでは無効
      if (!isDesktop()) return

      // 入力フィールドにフォーカス中は無効
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const state = listenerApi.getState() as RootState
      const { bindings } = state.keyBindings
      const { currentMode } = state.ui

      const pressedKey = normalizeKey(e)
      const action = findActionForKey(pressedKey, bindings)

      if (!action) return

      // モード切り替え（どのモードでも有効）
      if (action === 'nextMode') {
        e.preventDefault()
        listenerApi.dispatch(setMode(getNextMode(currentMode)))
        return
      }

      if (action === 'prevMode') {
        e.preventDefault()
        listenerApi.dispatch(setMode(getPrevMode(currentMode)))
        return
      }

      // 分類・実行モードのキーバインドは各コンポーネントで処理
      // （状態依存のロジックがあるため）
    }

    window.addEventListener('keydown', handleKeyDown)

    // このリスナーは永続的に動作
    await listenerApi.condition(() => false)
    window.removeEventListener('keydown', handleKeyDown)
  },
})
