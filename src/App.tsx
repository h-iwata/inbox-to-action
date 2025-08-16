import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from './store'
import { cleanupExpiredTasks, updateStats } from './store/slices/tasksSlice'
import { setMode, type AppMode } from './store/slices/uiSlice'
import { Header } from './components/Layout/Header'
import { ModeNavigator } from './components/Layout/ModeNavigator'
import { CreateMode } from './features/create/CreateMode'
import { ClassifyMode } from './features/classify/ClassifyMode'
import { ListMode } from './features/list/ListMode'
import { ExecuteMode } from './features/execute/ExecuteMode'
import { useResponsive } from './hooks/useResponsive'

function App() {
  const dispatch = useDispatch()
  const currentMode = useSelector((state: RootState) => state.ui.currentMode)
  const { isMobile } = useResponsive()

  // 24時間自動削除機能
  useEffect(() => {
    // アプリ起動時に実行
    dispatch(cleanupExpiredTasks())
    dispatch(updateStats())

    // 5分ごとに実行
    const interval = setInterval(() => {
      dispatch(cleanupExpiredTasks())
      dispatch(updateStats())
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [dispatch])

  // Tabキーでモード切り替え（PC版のみ）
  useEffect(() => {
    if (isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const modes: AppMode[] = ['create', 'classify', 'list', 'execute']
        const currentIndex = modes.indexOf(currentMode)
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + modes.length) % modes.length
          : (currentIndex + 1) % modes.length
        dispatch(setMode(modes[nextIndex]))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentMode, dispatch, isMobile])

  const renderMode = () => {
    switch (currentMode) {
      case 'create':
        return <CreateMode />
      case 'classify':
        return <ClassifyMode />
      case 'list':
        return <ListMode />
      case 'execute':
        return <ExecuteMode />
      default:
        return <CreateMode />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      {!isMobile && <ModeNavigator />}
      
      <main className={`container mx-auto px-4 py-8 ${isMobile ? 'pb-20' : ''}`}>
        {renderMode()}
      </main>

      {isMobile && <ModeNavigator />}
    </div>
  )
}

export default App
