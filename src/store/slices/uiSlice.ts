import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Category } from '../../types'
import { trackModeChange } from '../../utils/analytics'

export type AppMode = 'create' | 'classify' | 'list' | 'execute' // 作成, 分類, 一覧, 実行

interface UIState {
  currentMode: AppMode
  scrollToCategory: Category | null
}

const initialState: UIState = {
  currentMode: 'create',
  scrollToCategory: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<AppMode>) => {
      state.currentMode = action.payload
      trackModeChange(action.payload)
    },
    setModeWithScroll: (state, action: PayloadAction<{ mode: AppMode; scrollToCategory?: Category }>) => {
      state.currentMode = action.payload.mode
      state.scrollToCategory = action.payload.scrollToCategory || null
      trackModeChange(action.payload.mode)
    },
    clearScrollToCategory: state => {
      state.scrollToCategory = null
    },
  },
})

export const { setMode, setModeWithScroll, clearScrollToCategory } = uiSlice.actions

export default uiSlice.reducer
