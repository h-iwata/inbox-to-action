import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { completeTask, selectTopTasksByCategory, toggleExecuting, selectAllTasks } from '../../store/slices/tasksSlice'
import { setModeWithScroll } from '../../store/slices/uiSlice'
import { useResponsive } from '../../hooks/useResponsive'
import { categoryIcons } from '../../config/icons'
import { FileText, Check, Sparkles, Zap, PlayCircle, Flame, BarChart3 } from 'lucide-react'
import type { Category } from '../../types'

const categoryInfo = {
  work: { ...categoryIcons.work, gradient: 'from-sky-600 to-sky-700', bgLight: 'bg-sky-900/20', borderColor: 'border-sky-500/30' },
  life: { ...categoryIcons.life, gradient: 'from-teal-600 to-teal-700', bgLight: 'bg-teal-900/20', borderColor: 'border-teal-500/30' },
  study: { ...categoryIcons.study, gradient: 'from-violet-600 to-violet-700', bgLight: 'bg-violet-900/20', borderColor: 'border-violet-500/30' },
  hobby: { ...categoryIcons.hobby, gradient: 'from-pink-600 to-pink-700', bgLight: 'bg-pink-900/20', borderColor: 'border-pink-500/30' },
}

export const ExecuteMode: React.FC = () => {
  const dispatch = useDispatch()
  const topTasks = useSelector(selectTopTasksByCategory)
  const allTasks = useSelector(selectAllTasks)
  const { isMobile, isDesktop } = useResponsive()
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [switchingToTaskId, setSwitchingToTaskId] = useState<string | null>(null)

  // 実行中のタスクを取得
  const executingTask = topTasks.find(task => task.isExecuting === true)
  
  // 全カテゴリのタスクを準備（存在しないカテゴリも含む）
  const categories: Category[] = ['work', 'life', 'study', 'hobby']
  const categoryTasks = categories.map(cat => {
    const task = topTasks.find(t => t.category === cat)
    return { category: cat, task }
  })

  // カテゴリごとのタスク数を計算
  const getTaskCountByCategory = (category: Category) => {
    return allTasks.filter(task => 
      task.category === category && task.status === 'active'
    ).length
  }

  const handleComplete = (taskId: string) => {
    setCompletingTaskId(taskId)
    
    // 完了アニメーション後にタスク完了
    setTimeout(() => {
      dispatch(completeTask(taskId))
      setCompletingTaskId(null)
    }, 600)
  }

  const handleSwitchExecution = (taskId: string) => {
    setSwitchingToTaskId(taskId)
    
    // 切り替えアニメーション
    setTimeout(() => {
      dispatch(toggleExecuting(taskId))
      setSwitchingToTaskId(null)
    }, 300)
  }

  // キーボードショートカット（PC版のみ）
  useEffect(() => {
    if (!isDesktop) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // 実行中タスクの完了（スペースキー）
      if (e.key === ' ' && executingTask && !completingTaskId) {
        e.preventDefault()
        handleComplete(executingTask.id)
      }
      
      // カテゴリ切り替え（1-4キー）
      const keyNumber = parseInt(e.key)
      if (keyNumber >= 1 && keyNumber <= 4) {
        const categories: Category[] = ['work', 'life', 'study', 'hobby']
        const targetCategory = categories[keyNumber - 1]
        const targetTask = topTasks.find(t => t.category === targetCategory)
        if (targetTask && !targetTask.isExecuting && !switchingToTaskId) {
          handleSwitchExecution(targetTask.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [executingTask, topTasks, isDesktop, completingTaskId, switchingToTaskId])

  // タスクがない場合
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

  // 実行中タスクがない場合
  if (!executingTask) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-300 mb-2">実行するカテゴリを選択してください</h2>
          <p className="text-sm text-gray-500">タップして実行を開始</p>
        </div>
        
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {topTasks.map((task) => {
            const info = categoryInfo[task.category as keyof typeof categoryInfo]
            const taskCount = getTaskCountByCategory(task.category as Category)
            
            return (
              <button
                key={task.id}
                onClick={() => handleSwitchExecution(task.id)}
                className={`
                  p-6 rounded-2xl border-2 ${info.borderColor} ${info.bgLight}
                  hover:scale-105 transition-all duration-300 text-left
                  ${switchingToTaskId === task.id ? 'animate-pulse' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {React.createElement(info.icon, {
                      className: `w-8 h-8 ${info.color}`
                    })}
                    <div>
                      <span className="font-bold text-gray-200">{info.label}</span>
                      <span className="ml-2 text-xs text-gray-400">残り{taskCount}件</span>
                    </div>
                  </div>
                  <PlayCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-gray-100 font-medium">{task.title}</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const executingInfo = categoryInfo[executingTask.category as keyof typeof categoryInfo]
  const executingTaskCount = getTaskCountByCategory(executingTask.category as Category)
  const isCompleting = completingTaskId === executingTask.id

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-240px)] overflow-y-auto">
      {/* 実行中タスクエリア（メインフォーカス） */}
      <div className="flex items-center justify-center px-4 mb-6 mt-8">
        <div className={`
          w-full max-w-2xl p-8 rounded-3xl
          bg-gradient-to-br ${executingInfo.gradient}
          shadow-2xl transform transition-all duration-500
          ${isCompleting ? 'scale-110 rotate-2 opacity-0' : 'scale-100'}
          relative overflow-hidden
        `}>
          {/* 背景アニメーション */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse" />
          </div>
          
          {/* コンテンツ */}
          <div className="relative">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {React.createElement(executingInfo.icon, {
                  className: "w-10 h-10 text-white"
                })}
                <div>
                  <h3 className="text-xl font-bold text-white">{executingInfo.label}</h3>
                  <button
                    onClick={() => dispatch(setModeWithScroll({ 
                      mode: 'list', 
                      scrollToCategory: executingTask.category as Category 
                    }))}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white/90 hover:text-white transition-all group"
                  >
                    <span>残り {executingTaskCount} 件</span>
                    <BarChart3 className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-sm text-white font-medium">実行中</span>
              </div>
            </div>
            
            {/* タスクタイトル */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center break-words">
                {executingTask.title}
              </h2>
            </div>
            
            {/* 完了ボタン */}
            <button
              onClick={() => handleComplete(executingTask.id)}
              disabled={!!completingTaskId}
              className={`
                w-full py-5 rounded-2xl font-bold text-lg
                transition-all duration-300 transform
                ${completingTaskId 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-900 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
                }
                relative overflow-hidden group
              `}
            >
              {isCompleting ? (
                <span className="flex items-center justify-center gap-3">
                  <Check className="w-6 h-6 animate-ping" />
                  <span>完了中...</span>
                </span>
              ) : (
                <>
                  <span className="flex items-center justify-center gap-3">
                    <Check className="w-6 h-6" />
                    <span>タスクを完了</span>
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </span>
                  {/* ホバーエフェクト */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </>
              )}
            </button>
            
            {/* PC版ヒント */}
            {isDesktop && (
              <p className="text-center text-white/60 text-sm mt-3">
                スペースキーで完了
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* カテゴリスイッチエリア */}
      <div className="px-4">
        <div className="mb-3 text-center">
          <p className="text-sm text-gray-400">カテゴリを切り替え</p>
        </div>
        
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {categoryTasks.map(({ category, task }, index) => {
            const info = categoryInfo[category as keyof typeof categoryInfo]
            const taskCount = getTaskCountByCategory(category)
            const isExecuting = task?.isExecuting === true
            const isSwitching = task && switchingToTaskId === task.id
            const hasTask = !!task
            
            return (
              <button
                key={category}
                onClick={() => task && !isExecuting && handleSwitchExecution(task.id)}
                disabled={!hasTask || isExecuting}
                className={`
                  p-3 rounded-xl border transition-all duration-300
                  ${isExecuting 
                    ? `border-2 ${info.borderColor} ${info.bgLight} opacity-100 cursor-default`
                    : hasTask
                      ? 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 hover:scale-105 cursor-pointer'
                      : 'border border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                  }
                  ${isSwitching ? 'animate-pulse ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {React.createElement(info.icon, {
                      className: `w-5 h-5 ${info.color}`
                    })}
                    <span className={`font-medium text-sm ${isExecuting ? 'text-white' : 'text-gray-300'}`}>
                      {info.label}
                    </span>
                  </div>
                  
                  {isExecuting && (
                    <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
                      <span className="text-xs text-white">実行中</span>
                    </div>
                  )}
                  
                  {hasTask ? (
                    <>
                      <p className={`text-xs truncate w-full ${isExecuting ? 'text-white/80' : 'text-gray-400'}`}>
                        {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                      </p>
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs ${isExecuting ? 'text-white/60' : 'text-gray-500'}`}>
                          残り{taskCount}件
                        </span>
                        {!isExecuting && <PlayCircle className="w-4 h-4 text-gray-500" />}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-600">タスクなし</p>
                  )}
                  
                  {/* PC版ヒント */}
                  {isDesktop && hasTask && !isExecuting && (
                    <div className="text-xs text-gray-600">
                      {index + 1}キー
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 成功エフェクト */}
      {isCompleting && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping">
              <Zap className="w-24 h-24 text-yellow-400 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}