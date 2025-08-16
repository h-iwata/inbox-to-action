import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { setMode, type AppMode } from '../../store/slices/uiSlice'
import { useResponsive } from '../../hooks/useResponsive'

interface ModeItem {
  id: AppMode
  label: string
  icon: string
}

const modes: ModeItem[] = [
  { id: 'create', label: '作成', icon: '✏️' },
  { id: 'classify', label: '分類', icon: '📋' },
  { id: 'list', label: '一覧', icon: '📄' },
  { id: 'execute', label: '実行', icon: '🎯' },
]

export const ModeNavigator: React.FC = () => {
  const dispatch = useDispatch()
  const currentMode = useSelector((state: RootState) => state.ui.currentMode)
  const { isMobile } = useResponsive()

  const handleModeChange = (mode: AppMode) => {
    dispatch(setMode(mode))
  }

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="grid grid-cols-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`py-3 text-center transition-all ${
                currentMode === mode.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="text-xs font-medium">{mode.label}</div>
            </button>
          ))}
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`px-6 py-3 font-medium transition-all border-b-2 ${
                  currentMode === mode.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 px-4">
            Tab: 次へ | Shift+Tab: 前へ
          </div>
        </div>
      </div>
    </nav>
  )
}