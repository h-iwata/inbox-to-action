import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Category } from '@/types'
import { trackModeChange } from '@/utils/analytics'

export type AppMode = 'create' | 'classify' | 'list' | 'execute' // 作成, 分類, 一覧, 実行

/** モードの並び順。Tab / Shift+Tab はこの順序で循環する。 */
export const MODE_ORDER: readonly AppMode[] = ['create', 'classify', 'list', 'execute']

export const getNextMode = (current: AppMode): AppMode =>
  MODE_ORDER[(MODE_ORDER.indexOf(current) + 1) % MODE_ORDER.length]

export const getPrevMode = (current: AppMode): AppMode =>
  MODE_ORDER[(MODE_ORDER.indexOf(current) - 1 + MODE_ORDER.length) % MODE_ORDER.length]

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
