import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { completeTask, selectTopTasksByCategory, toggleExecuting, selectAllTasks } from '../../store/slices/tasksSlice'
import { useResponsive } from '../../hooks/useResponsive'
import { categoryIcons, actionIcons } from '../../config/icons'
import { FileText, Check, Loader2, Sparkles, Zap } from 'lucide-react'
import type { Category } from '../../types'

const categoryInfo = {
  work: { ...categoryIcons.work, color: 'from-sky-800 to-sky-900' },
  life: { ...categoryIcons.life, color: 'from-teal-800 to-teal-900' },
  study: { ...categoryIcons.study, color: 'from-violet-800 to-violet-900' },
  hobby: { ...categoryIcons.hobby, color: 'from-pink-800 to-pink-900' },
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
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                  {React.createElement(info.icon, {
                    className: "w-6 h-6 text-white"
                  })}
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
                    <Check className="w-16 h-16 text-green-500 animate-ping" />
                  </div>
                )}
                
                {task.isExecuting === false && (
                  <button
                    className="mb-3 w-full p-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg text-center cursor-pointer hover:from-gray-600 hover:to-gray-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md" 
                    onClick={() => handleToggleExecuting(task.id)}
                  >
                    <span className="text-gray-200 text-sm font-medium flex items-center justify-center gap-2">
                      {React.createElement(actionIcons.play, {
                        className: "w-4 h-4 text-green-400"
                      })}
                      実行を開始する
                    </span>
                  </button>
                )}
                {task.isExecuting === true && (
                  <div className="mb-3 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg blur-md animate-pulse" />
                    <div className="relative p-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-500/30">
                      <span className="text-amber-400 text-sm font-semibold flex items-center justify-center gap-2">
                        {React.createElement(actionIcons.executing, {
                          className: "w-4 h-4 animate-pulse"
                        })}
                        実行中
                      </span>
                    </div>
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
                      <div className="relative group">
                        {/* グロウエフェクト */}
                        <div className={`
                          absolute -inset-1 rounded-xl opacity-0 blur-xl transition-all duration-500
                          ${!completingTaskId && !isCompleting ? 'group-hover:opacity-100' : ''}
                          bg-gradient-to-r ${info.gradient}
                        `} />
                        
                        <button
                          onClick={() => handleComplete(task.id)}
                          disabled={!!completingTaskId}
                          className={`
                            relative w-full px-6 py-4 rounded-xl font-bold
                            transition-all duration-300 transform
                            ${completingTaskId 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : `
                                bg-gradient-to-r ${info.gradient} text-white 
                                hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]
                                shadow-lg
                              `
                            }
                          `}
                        >
                          <div className="relative">
                            {isCompleting ? (
                              <span className="flex items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-lg">完了中...</span>
                              </span>
                            ) : (
                              <>
                                {/* メインコンテンツ */}
                                <span className="flex items-center justify-center gap-3">
                                  <div className="relative">
                                    <Check className="w-6 h-6" />
                                    {/* キラキラエフェクト */}
                                    <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                                  </div>
                                  <span className="text-lg font-extrabold tracking-wide">完了</span>
                                  <Zap className="w-5 h-5 text-yellow-300" />
                                </span>
                                
                                {/* ホバー時の追加エフェクト */}
                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </button>
                        
                        {/* パルスリングエフェクト */}
                        {!completingTaskId && !isCompleting && (
                          <div className="absolute -inset-1 rounded-xl pointer-events-none">
                            <div className={`
                              absolute inset-0 rounded-xl opacity-30
                              bg-gradient-to-r ${info.gradient}
                              animate-pulse-slow
                            `} />
                          </div>
                        )}
                      </div>
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
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}