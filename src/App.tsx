import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from './store'
import { cleanupExpiredTasks, updateStats, selectInboxTasks } from './store/slices/tasksSlice'
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
  const inboxTasks = useSelector(selectInboxTasks)
  const { isMobile } = useResponsive()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

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

  // モバイル版の左右フリックでモード切り替え（分類モード中は無効）
  useEffect(() => {
    if (!isMobile) return
    
    // 分類モードでInboxタスクがある場合はフリック無効
    const isClassifying = currentMode === 'classify' && inboxTasks.length > 0

    const handleTouchStart = (e: TouchEvent) => {
      if (isClassifying) return
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current || isTransitioning || isClassifying) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY

      const diffX = touchStartX.current - touchEndX
      const diffY = touchStartY.current - touchEndY

      // 横方向の移動が縦方向より大きく、最小移動距離を超えている場合
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        const modes: AppMode[] = ['create', 'classify', 'list', 'execute']
        const currentIndex = modes.indexOf(currentMode)
        
        setIsTransitioning(true)
        
        if (diffX > 0) {
          // 左にフリック（次のモードへ）
          const nextIndex = (currentIndex + 1) % modes.length
          dispatch(setMode(modes[nextIndex]))
        } else {
          // 右にフリック（前のモードへ）
          const prevIndex = (currentIndex - 1 + modes.length) % modes.length
          dispatch(setMode(modes[prevIndex]))
        }

        // アニメーション完了後にフラグをリセット
        setTimeout(() => setIsTransitioning(false), 300)
      }

      touchStartX.current = null
      touchStartY.current = null
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [currentMode, dispatch, isMobile, isTransitioning, inboxTasks.length])

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <Header />
      {!isMobile && <ModeNavigator />}
      
      <main className={`container mx-auto px-4 py-8 ${isMobile ? 'pb-20' : ''} transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
        {renderMode()}
      </main>

      {isMobile && (
        <>
          <ModeNavigator />
          {/* フリック操作のヒント表示 */}
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-gray-400 opacity-0 animate-fade-in-out">
              ← スワイプでモード切替 →
            </div>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes fade-in-out {
          0%, 100% { opacity: 0; }
          10%, 90% { opacity: 1; }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default App
