import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Category } from '../../types'

export type AppMode = 'create' | 'classify' | 'list' | 'execute'

interface UIState {
  currentMode: AppMode
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
  scrollToCategory: Category | null
}

const initialState: UIState = {
  currentMode: 'create',
  isLoading: false,
  error: null,
  lastUpdated: null,
  scrollToCategory: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<AppMode>) => {
      state.currentMode = action.payload
    },
    setModeWithScroll: (state, action: PayloadAction<{ mode: AppMode; scrollToCategory?: Category }>) => {
      state.currentMode = action.payload.mode
      state.scrollToCategory = action.payload.scrollToCategory || null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    updateLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString()
    },
    clearScrollToCategory: (state) => {
      state.scrollToCategory = null
    },
  },
})

export const { setMode, setModeWithScroll, setLoading, setError, updateLastUpdated, clearScrollToCategory } = uiSlice.actions

export default uiSlice.reducer