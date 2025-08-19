import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { completeTask, selectTopTasksByCategory, toggleExecuting, selectAllTasks } from '../../store/slices/tasksSlice'
import { setMode, setModeWithScroll } from '../../store/slices/uiSlice'
import { useResponsive } from '../../hooks/useResponsive'
import { categoryIcons } from '../../config/icons'
import { CategoryCompletionBar } from '../../components/CategoryCompletionBar/CategoryCompletionBar'
import { FileText, Check, Sparkles, Zap, PlayCircle, Flame, BarChart3, PenTool } from 'lucide-react'
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
      <div className="max-w-5xl mx-auto h-[calc(100vh-240px)] overflow-y-auto">
        {/* 統計情報は常に表示 */}
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-3 backdrop-blur-md">
            <CategoryCompletionBar />
          </div>
        </div>
        
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-100 mb-2">実行するタスクがありません</h2>
            <p className="text-gray-400">
              タスクを
              <button
                onClick={() => dispatch(setMode('create'))}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-colors"
              >
                <PenTool className="w-3 h-3" />
                <span>作成</span>
              </button>
              してください
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 実行中タスクがない場合（ただしタスクは存在する）
  if (!executingTask && topTasks.length > 0) {
    return (
      <div className="max-w-5xl mx-auto h-[calc(100vh-240px)] overflow-y-auto">
        {/* 統計情報は常に表示 */}
        <div className="px-4 mb-4">
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-3 backdrop-blur-md">
            <CategoryCompletionBar />
          </div>
        </div>

        <div className="px-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-300 mb-2">実行するカテゴリを選択してください</h2>
            <p className="text-sm text-gray-500">タップして実行を開始</p>
          </div>
        
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {topTasks.map((task) => {
            const info = categoryInfo[task.category as keyof typeof categoryInfo]
            const taskCount = getTaskCountByCategory(task.category as Category)
            
            return (
              <button
                key={task.id}
                onClick={() => handleSwitchExecution(task.id)}
                className={`
                  relative p-5 rounded-2xl border-2 bg-gradient-to-br from-gray-900/90 to-gray-800/90
                  border-gray-700 hover:border-gray-600 shadow-lg
                  hover:scale-105 transition-all duration-300 text-left
                  ${switchingToTaskId === task.id ? 'animate-pulse ring-2 ring-blue-500' : ''}
                `}
              >
                {/* 残り件数バッジ（右上） */}
                <div className="absolute top-4 right-4">
                  <span className="bg-gray-700/50 px-2.5 py-1 rounded-full text-xs font-bold text-gray-300 backdrop-blur-sm">
                    {taskCount}件
                  </span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* カテゴリヘッダー */}
                  <div className="flex items-center gap-3">
                    {React.createElement(info.icon, {
                      className: `w-8 h-8 ${info.color}`
                    })}
                    <span className="font-bold text-lg text-gray-200">{info.label}</span>
                  </div>
                  
                  {/* タスクタイトル */}
                  <p className="text-gray-100 font-medium pr-12">{task.title}</p>
                  
                  {/* アクションヒント */}
                  <div className="flex items-center gap-2 mt-2">
                    <PlayCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-semibold">タップで実行開始</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        </div>
      </div>
    )
  }

  // この時点で executingTask が存在することが保証される
  if (!executingTask) {
    // フォールバック（通常はここに到達しないはず）
    return (
      <div className="max-w-5xl mx-auto h-[calc(100vh-240px)] overflow-y-auto">
        <div className="px-4 mb-3">
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-3 backdrop-blur-md">
            <CategoryCompletionBar />
          </div>
        </div>
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-100 mb-2">実行するタスクがありません</h2>
            <p className="text-gray-400">
              タスクを
              <button
                onClick={() => dispatch(setMode('create'))}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-colors"
              >
                <PenTool className="w-3 h-3" />
                <span>作成</span>
              </button>
              して分類してください
            </p>
          </div>
        </div>
      </div>
    )
  }

  const executingInfo = categoryInfo[executingTask.category as keyof typeof categoryInfo]
  const executingTaskCount = getTaskCountByCategory(executingTask.category as Category)
  const isCompleting = completingTaskId === executingTask.id

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-240px)] overflow-y-auto">
      {/* 統計情報 - グラデーションバー（最上部に配置） */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-3 backdrop-blur-md">
          <CategoryCompletionBar />
        </div>
      </div>

      {/* 実行中タスクエリア（メインフォーカス） */}
      <div className="flex items-center justify-center px-4 mb-5">
        <div className={`
          w-full max-w-2xl p-6 rounded-3xl
          bg-gradient-to-br ${executingInfo.gradient}
          transform transition-all duration-500
          ${isCompleting ? 'scale-110 rotate-2 opacity-0' : 'scale-100 hover:scale-[1.02]'}
          relative overflow-hidden
          shadow-2xl shadow-orange-500/30
          ring-2 ring-orange-400/60
        `}>
          {/* 光沢エフェクト */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50" />
          
          {/* 背景アニメーション */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse" />
          </div>
          
          {/* コンテンツ */}
          <div className="relative">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {React.createElement(executingInfo.icon, {
                  className: "w-12 h-12 text-white"
                })}
                <div>
                  <h3 className="text-xl font-bold text-white">{executingInfo.label}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Flame className="w-4 h-4 text-orange-300 animate-pulse" />
                    <span className="text-xs font-semibold text-orange-200">実行中</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-white/25 px-3 py-1.5 rounded-full text-sm font-bold text-white backdrop-blur-sm">
                  {executingTaskCount}件
                </span>
                <button
                  onClick={() => dispatch(setModeWithScroll({ 
                    mode: 'list', 
                    scrollToCategory: executingTask.category as Category 
                  }))}
                  className="text-xs text-white/70 hover:text-white/90 transition-colors flex items-center gap-1"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>一覧へ</span>
                </button>
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
                  : 'bg-white text-gray-900 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] shadow-lg hover:shadow-2xl'
                }
                relative overflow-hidden group
                ${!completingTaskId && 'ring-2 ring-white/30'}
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
          <p className="text-sm text-gray-400">実行中のカテゴリを切り替え</p>
        </div>
        
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {categoryTasks.map(({ category, task }, index) => {
            const info = categoryInfo[category as keyof typeof categoryInfo]
            const taskCount = getTaskCountByCategory(category)
            const isExecuting = task?.isExecuting === true
            const isSwitching = task && switchingToTaskId === task.id
            const hasTask = !!task
            
            return (
              <div
                key={category}
                onClick={() => task && !isExecuting && handleSwitchExecution(task.id)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all duration-300
                  ${isExecuting 
                    ? `border-orange-400/60 ${info.bgLight} ring-2 ring-orange-400/60 shadow-orange-500/30 cursor-default`
                    : hasTask
                      ? 'border-gray-700 bg-gradient-to-br from-gray-900/90 to-gray-800/90 hover:border-gray-600 hover:scale-105 cursor-pointer shadow-lg'
                      : 'border-gray-800 bg-gray-900/50 opacity-60 cursor-default'
                  }
                  ${isSwitching ? 'animate-pulse' : ''}
                `}
              >
                {/* 残り件数バッジ（右上） */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                    isExecuting 
                      ? 'bg-white/25 text-white' 
                      : hasTask
                        ? 'bg-gray-700/50 text-gray-300'
                        : 'bg-gray-800/50 text-gray-500'
                  }`}>
                    {taskCount}件
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {/* カテゴリアイコンとラベル */}
                  <div className="flex items-center gap-2">
                    {React.createElement(info.icon, {
                      className: `w-6 h-6 ${isExecuting ? 'text-white' : info.color}`
                    })}
                    <span className={`font-bold text-sm ${isExecuting ? 'text-white' : 'text-gray-200'}`}>
                      {info.label}
                    </span>
                    {isExecuting && (
                      <Flame className="w-4 h-4 text-orange-400 animate-pulse ml-auto" />
                    )}
                  </div>
                  
                  {hasTask ? (
                    <>
                      {/* タスクタイトル */}
                      <p className={`text-sm truncate ${isExecuting ? 'text-white/90 font-medium' : 'text-gray-400'}`}>
                        {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                      </p>
                      
                      {/* アクションヒント */}
                      <div className="flex items-center justify-center mt-1">
                        {!isExecuting && (
                          <div className="flex items-center gap-1">
                            <PlayCircle className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">タップで実行</span>
                            {/* PC版キーボードヒント */}
                            {isDesktop && (
                              <span className="text-xs text-gray-600 ml-2">
                                ({index + 1}キー)
                              </span>
                            )}
                          </div>
                        )}
                        {isExecuting && (
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-300 animate-pulse" />
                            <span className="text-xs text-orange-300 font-semibold">実行中</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <span className="text-xs text-gray-500">タスクなし</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dispatch(setMode('create'))
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg transition-colors text-xs"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>作成</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
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