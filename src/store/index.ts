import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/es/storage'
import tasksReducer from '@/store/slices/tasksSlice'
import uiReducer from '@/store/slices/uiSlice'

const rootReducer = combineReducers({
  tasks: tasksReducer,
  ui: uiReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['tasks'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
