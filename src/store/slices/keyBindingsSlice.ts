import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

// キーバインドで実行できるアクション
export type KeyAction =
  // モード切り替え
  | 'nextMode'
  | 'prevMode'
  // 分類モード
  | 'classifyWork'
  | 'classifyLife'
  | 'classifyStudy'
  | 'classifyHobby'
  // 実行モード
  | 'completeTask'
  | 'switchToWork'
  | 'switchToLife'
  | 'switchToStudy'
  | 'switchToHobby'

interface KeyBindingsState {
  bindings: Record<KeyAction, string[]> // 複数のキーを割り当て可能
}

const initialState: KeyBindingsState = {
  bindings: {
    // モード切り替え
    nextMode: ['Tab'],
    prevMode: ['Shift+Tab'],
    // 分類モード（WASD + 矢印キー）
    classifyWork: ['a', 'ArrowLeft'],
    classifyLife: ['d', 'ArrowRight'],
    classifyStudy: ['w', 'ArrowUp'],
    classifyHobby: ['s', 'ArrowDown'],
    // 実行モード
    completeTask: [' '], // スペースキー
    switchToWork: ['1'],
    switchToLife: ['2'],
    switchToStudy: ['3'],
    switchToHobby: ['4'],
  },
}

const keyBindingsSlice = createSlice({
  name: 'keyBindings',
  initialState,
  reducers: {
    updateBinding: (state, action: PayloadAction<{ action: KeyAction; keys: string[] }>) => {
      state.bindings[action.payload.action] = action.payload.keys
    },
    resetBindings: () => initialState,
  },
})

export const { updateBinding, resetBindings } = keyBindingsSlice.actions

export default keyBindingsSlice.reducer

// セレクター
export const selectKeyBindings = (state: { keyBindings: KeyBindingsState }) => state.keyBindings.bindings

// 押されたキーに対応するアクションか判定する関数を返す
export const isKeyPressed = (bindings: Record<KeyAction, string[]>, key: string) => (action: KeyAction) =>
  bindings[action].includes(key)
