import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from './store'
import { cleanupExpiredTasks, updateStats, selectInboxTasks } from './store/slices/tasksSlice'
import { Header } from './components/Layout/Header'
import { ModeNavigator } from './components/Layout/ModeNavigator'
import { CreateMode } from './features/create/CreateMode'
import { ClassifyMode } from './features/classify/ClassifyMode'
import { ListMode } from './features/list/ListMode'
import { ExecuteMode } from './features/execute/ExecuteMode'
import { useResponsive } from './hooks/useResponsive'
import { Info } from 'lucide-react'

function App() {
  const dispatch = useDispatch()
  const currentMode = useSelector((state: RootState) => state.ui.currentMode)
  const inboxTasks = useSelector(selectInboxTasks)
  const { isMobile } = useResponsive()

  // 24時間自動削除機能
  useEffect(() => {
    // アプリ起動時に実行
    dispatch(cleanupExpiredTasks())
    dispatch(updateStats())

    // 5分ごとに実行
    const interval = setInterval(
      () => {
        dispatch(cleanupExpiredTasks())
        dispatch(updateStats())
      },
      5 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [dispatch])

  const getOperationHint = (): string => {
    const hasInboxTasks = inboxTasks.length > 0

    const hints = {
      mobile: {
        create: '下部のナビゲーションでモード切替',
        classify: hasInboxTasks ? '画面をタップして分類' : '下部のナビゲーションでモード切替',
        list: 'タップで最優先設定 • 左スワイプでInbox • 右スワイプで削除',
        execute: '実行タスクを完了ボタンで完了',
      },
      desktop: {
        create: 'Tab: 次のモード • Shift+Tab: 前のモード',
        classify: hasInboxTasks
          ? 'W/↑: 学習 • A/←: 仕事 • D/→: 生活 • S/↓: 趣味'
          : 'Tab: 次のモード • Shift+Tab: 前のモード',
        list: 'クリックで最優先設定 • タスクを左右にスワイプで操作',
        execute: 'スペース：タスク完了 • 1〜4キー：カテゴリ切り替え',
      },
    }

    return isMobile ? hints.mobile[currentMode] : hints.desktop[currentMode]
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 text-gray-100">
      <Header />
      {!isMobile && <ModeNavigator />}

      {/* 操作ヒントエリア */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center">
          <div className="bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-gray-400 flex items-center gap-2">
            <Info className="w-3 h-3" />
            {getOperationHint()}
          </div>
        </div>
      </div>

      <main className={`container mx-auto px-4 py-4 ${isMobile ? 'pb-24' : 'pb-8'}`}>
        {currentMode === 'create' && <CreateMode />}
        {currentMode === 'classify' && <ClassifyMode />}
        {currentMode === 'list' && <ListMode />}
        {currentMode === 'execute' && <ExecuteMode />}
      </main>

      {isMobile && <ModeNavigator />}
    </div>
  )
}

export default App
