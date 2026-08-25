import { Info } from 'lucide-react'
import { useEffect } from 'react'
import { Header } from '@/components/Layout/Header'
import { ModeNavigator } from '@/components/Layout/ModeNavigator'
import { ClassifyMode } from '@/features/classify'
import { CreateMode } from '@/features/create'
import { ExecuteMode } from '@/features/execute'
import { ListMode } from '@/features/list'
import { useResponsive } from '@/hooks/useResponsive'
import { useCommandHandler, useKeybindings } from '@/lib/keybindings'
import { useTaskActions } from '@/store/tasksStore'
import { getNextMode, getPrevMode, useCurrentMode, useUIActions } from '@/store/uiStore'
import { useInboxTasks } from '@/store/useTasks'
import { operationHint } from './app-helpers'

function App() {
  const currentMode = useCurrentMode()
  const inboxTasks = useInboxTasks()
  const { setMode } = useUIActions()
  const { cleanupExpiredTasks, updateStats } = useTaskActions()
  const { isMobile } = useResponsive()

  // キーバインドの接続（アプリ全体で1回だけ）とモード切り替えコマンドの登録
  useKeybindings()
  useCommandHandler('mode.next', () => setMode(getNextMode(currentMode)))
  useCommandHandler('mode.prev', () => setMode(getPrevMode(currentMode)))

  // 24時間自動削除機能
  useEffect(() => {
    // アプリ起動時に実行
    cleanupExpiredTasks()
    updateStats()

    // 5分ごとに実行
    const interval = setInterval(
      () => {
        cleanupExpiredTasks()
        updateStats()
      },
      5 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [cleanupExpiredTasks, updateStats])

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 text-gray-100">
      <Header />
      {!isMobile && <ModeNavigator />}

      {/* 操作ヒントエリア */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center">
          <div className="bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-gray-400 flex items-center gap-2">
            <Info className="w-3 h-3" />
            {operationHint(currentMode, isMobile, inboxTasks.length > 0)}
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
