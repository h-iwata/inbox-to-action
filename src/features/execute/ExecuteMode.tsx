import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { completeTask, selectTopTasksByCategory, toggleExecuting } from '../../store/slices/tasksSlice'
import { TaskCard } from '../../components/TaskCard/TaskCard'
import { useResponsive } from '../../hooks/useResponsive'

const categoryInfo = {
  work: { label: '仕事', icon: '🏢', color: 'from-sky-800 to-sky-900' },
  life: { label: '生活', icon: '🏠', color: 'from-teal-800 to-teal-900' },
  study: { label: '学習', icon: '📚', color: 'from-violet-800 to-violet-900' },
  hobby: { label: '趣味', icon: '🎮', color: 'from-pink-800 to-pink-900' },
}

export const ExecuteMode: React.FC = () => {
  const dispatch = useDispatch()
  const topTasks = useSelector(selectTopTasksByCategory)
  const { isDesktop } = useResponsive()

  const handleComplete = (taskId: string) => {
    dispatch(completeTask(taskId))
  }

  const handleToggleExecuting = (taskId: string) => {
    dispatch(toggleExecuting(taskId))
  }


  useEffect(() => {
    if (!isDesktop) return

    const handleKeyPress = (e: KeyboardEvent) => {
      const keyNumber = parseInt(e.key)
      if (keyNumber >= 1 && keyNumber <= topTasks.length) {
        const task = topTasks[keyNumber - 1]
        if (task) {
          handleComplete(task.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [topTasks, isDesktop])

  if (topTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">実行するタスクがありません</h2>
          <p className="text-gray-400">タスクを作成して分類してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className={`grid gap-6 ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {topTasks.map((task, index) => {
          const info = categoryInfo[task.category as keyof typeof categoryInfo]
          return (
            <div
              key={task.id}
              className="bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-700 overflow-hidden transform hover:scale-105 transition-all"
            >
              <div className={`bg-gradient-to-r ${info.color} text-white px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <span className="font-bold">{info.label}</span>
                </div>
                {isDesktop && (
                  <div className="bg-white/20 px-2 py-1 rounded text-sm font-medium">
                    {index + 1}キー
                  </div>
                )}
              </div>
              <div className="p-6">
                {task.isExecuting === false && (
                  <div className="mb-3 p-2 bg-gray-700/50 rounded-lg text-center cursor-pointer hover:bg-gray-700/70 transition-colors" onClick={() => handleToggleExecuting(task.id)}>
                    <span className="text-gray-300 text-sm">⏸️ 一時停止中 - クリックで実行開始</span>
                  </div>
                )}
                {task.isExecuting === true && (
                  <div className="mb-3 p-2 bg-amber-900/20 rounded-lg text-center">
                    <span className="text-amber-400 text-sm">🔥 実行中</span>
                  </div>
                )}
                <TaskCard
                  task={task}
                  variant="execute"
                  onComplete={task.isExecuting === true ? handleComplete : undefined}
                />
              </div>
            </div>
          )
        })}
      </div>

      {isDesktop && topTasks.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            キーボードの1-{topTasks.length}キーでタスクを完了できます
          </p>
        </div>
      )}
    </div>
  )
}