import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { completeTask, selectTopTasksByCategory, toggleExecuting, selectAllTasks } from '../../store/slices/tasksSlice'
import { useResponsive } from '../../hooks/useResponsive'
import type { Category } from '../../types'

const categoryInfo = {
  work: { label: '仕事', icon: '🏢', color: 'from-sky-800 to-sky-900' },
  life: { label: '生活', icon: '🏠', color: 'from-teal-800 to-teal-900' },
  study: { label: '学習', icon: '📚', color: 'from-violet-800 to-violet-900' },
  hobby: { label: '趣味', icon: '🎮', color: 'from-pink-800 to-pink-900' },
}

export const ExecuteMode: React.FC = () => {
  const dispatch = useDispatch()
  const topTasks = useSelector(selectTopTasksByCategory)
  const allTasks = useSelector(selectAllTasks)
  const { isDesktop } = useResponsive()
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [nextTaskId, setNextTaskId] = useState<string | null>(null)

  // カテゴリごとのタスク数を計算
  const getTaskCountByCategory = (category: Category) => {
    return allTasks.filter(task => 
      task.category === category && task.status === 'active'
    ).length
  }

  const handleComplete = (taskId: string) => {
    // 完了アニメーション開始
    setCompletingTaskId(taskId)
    
    // 次のタスクを特定
    const completingTask = topTasks.find(t => t.id === taskId)
    if (completingTask) {
      const nextTask = allTasks.find(t => 
        t.category === completingTask.category && 
        t.order === 2 && 
        t.status === 'active'
      )
      if (nextTask) {
        setNextTaskId(nextTask.id)
      }
    }
    
    // アニメーション後にタスク完了
    setTimeout(() => {
      dispatch(completeTask(taskId))
      setCompletingTaskId(null)
      
      // 次のタスクアニメーション終了
      setTimeout(() => {
        setNextTaskId(null)
      }, 500)
    }, 600)
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
        if (task && task.isExecuting === true && !completingTaskId) {
          handleComplete(task.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [topTasks, isDesktop, completingTaskId])

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
          const taskCount = getTaskCountByCategory(task.category as Category)
          const isCompleting = completingTaskId === task.id
          const isNext = nextTaskId === task.id
          
          return (
            <div
              key={task.id}
              className={`
                bg-gray-800 rounded-2xl shadow-xl border-2 border-gray-700 overflow-hidden
                transform transition-all duration-500
                ${isCompleting ? 'scale-110 rotate-2 opacity-0' : ''}
                ${isNext ? 'animate-slide-in-bottom' : ''}
                ${!isCompleting && !isNext ? 'hover:scale-105' : ''}
              `}
            >
              <div className={`bg-gradient-to-r ${info.color} text-white px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <span className="font-bold">{info.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* 残りタスク数 */}
                  <div className="bg-white/20 px-2 py-1 rounded text-sm">
                    残り {taskCount} 件
                  </div>
                  {isDesktop && (
                    <div className="bg-white/30 px-2 py-1 rounded text-sm font-medium">
                      {index + 1}キー
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {/* 完了時の祝福アニメーション */}
                {isCompleting && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-6xl animate-ping">✅</div>
                  </div>
                )}
                
                {task.isExecuting === false && (
                  <div 
                    className="mb-3 p-2 bg-gray-700/50 rounded-lg text-center cursor-pointer hover:bg-gray-700/70 transition-colors" 
                    onClick={() => handleToggleExecuting(task.id)}
                  >
                    <span className="text-gray-300 text-sm">⏸️ 一時停止中 - クリックで実行開始</span>
                  </div>
                )}
                {task.isExecuting === true && (
                  <div className="mb-3 p-2 bg-amber-900/20 rounded-lg text-center">
                    <span className="text-amber-400 text-sm animate-pulse">🔥 実行中</span>
                  </div>
                )}
                
                {/* タスクカード */}
                <div className="relative">
                  <div className={`transition-opacity duration-300 ${isCompleting ? 'opacity-0' : 'opacity-100'}`}>
                    <h3 className="text-lg font-bold text-gray-100 mb-3 break-words">
                      {task.title}
                    </h3>
                    
                    {/* 完了ボタン */}
                    {task.isExecuting === true && (
                      <button
                        onClick={() => handleComplete(task.id)}
                        disabled={!!completingTaskId}
                        className={`
                          w-full px-4 py-3 rounded-lg font-bold transition-all
                          ${completingTaskId 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 active:scale-95'
                          }
                        `}
                      >
                        {isCompleting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            完了中...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            ✓ 完了
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isDesktop && topTasks.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            キーボードの1-{topTasks.length}キーで実行中のタスクを完了できます
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes slide-in-bottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}