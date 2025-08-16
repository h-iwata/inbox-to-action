import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AppMode = 'create' | 'classify' | 'list' | 'execute'

interface UIState {
  currentMode: AppMode
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: UIState = {
  currentMode: 'create',
  isLoading: false,
  error: null,
  lastUpdated: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<AppMode>) => {
      state.currentMode = action.payload
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
  },
})

export const { setMode, setLoading, setError, updateLastUpdated } = uiSlice.actions

export default uiSlice.reducer