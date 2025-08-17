import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  deleteTask, 
  selectTasksByCategory, 
  selectDailyStats,
  selectTopTasksByCategory,
  changeCategory
} from '../../store/slices/tasksSlice'
import { categoryIcons } from '../../config/icons'
import { BarChart3, Flame, Trash2, Inbox } from 'lucide-react'
import type { Category, Task } from '../../types'

interface SwipeState {
  taskId: string | null
  startX: number
  currentX: number
  direction: 'left' | 'right' | null
}

export const ListMode: React.FC = () => {
  const dispatch = useDispatch()
  const dailyStats = useSelector(selectDailyStats)
  const topTasks = useSelector(selectTopTasksByCategory)
  
  // 実行中のカテゴリを特定
  const executingCategory = topTasks.find(task => task.isExecuting === true)?.category as Category | undefined

  // スワイプ用の状態
  const [swipeState, setSwipeState] = useState<SwipeState>({
    taskId: null,
    startX: 0,
    currentX: 0,
    direction: null
  })
  
  // 削除確認モーダルの状態
  const [deleteConfirm, setDeleteConfirm] = useState<{ taskId: string, title: string } | null>(null)

  const categories: { id: Category; label: string; icon: React.ComponentType<{ className?: string }>; gradient: string }[] = [
    { id: 'work', ...categoryIcons.work, gradient: 'from-sky-800 to-sky-900' },
    { id: 'life', ...categoryIcons.life, gradient: 'from-teal-800 to-teal-900' },
    { id: 'study', ...categoryIcons.study, gradient: 'from-violet-800 to-violet-900' },
    { id: 'hobby', ...categoryIcons.hobby, gradient: 'from-pink-800 to-pink-900' },
  ]

  // カテゴリごとのタスクセレクター
  const workTasks = useSelector(selectTasksByCategory('work'))
  const lifeTasks = useSelector(selectTasksByCategory('life'))
  const studyTasks = useSelector(selectTasksByCategory('study'))
  const hobbyTasks = useSelector(selectTasksByCategory('hobby'))
  
  const tasksSelector = {
    work: workTasks,
    life: lifeTasks,
    study: studyTasks,
    hobby: hobbyTasks,
    inbox: [] as Task[]
  }

  // タッチ/マウス開始（スワイプ用）
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, task: Task) => {
    if ('touches' in e) {
      const touch = e.touches[0]
      setSwipeState({
        taskId: task.id,
        startX: touch.clientX,
        currentX: touch.clientX,
        direction: null
      })
    } else {
      setSwipeState({
        taskId: task.id,
        startX: e.clientX,
        currentX: e.clientX,
        direction: null
      })
    }
  }

  // タッチ/マウス移動
  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState.taskId) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - swipeState.startX
    
    if (Math.abs(deltaX) > 10) {
      setSwipeState(prev => ({
        ...prev,
        currentX: clientX,
        direction: deltaX > 0 ? 'right' : 'left'
      }))
    }
  }

  // タッチ/マウス終了
  const handleEnd = (task: Task) => {
    if (swipeState.taskId && swipeState.direction) {
      const swipeDistance = Math.abs(swipeState.currentX - swipeState.startX)
      
      if (swipeDistance > 60) {
        if (swipeState.direction === 'left') {
          // Inboxへ戻す
          dispatch(changeCategory({ taskId: swipeState.taskId, newCategory: 'inbox' as Category }))
        } else if (swipeState.direction === 'right') {
          // 削除確認モーダルを表示
          setDeleteConfirm({ taskId: swipeState.taskId, title: task.title })
        }
      }
    }
    
    // リセット
    setSwipeState({
      taskId: null,
      startX: 0,
      currentX: 0,
      direction: null
    })
  }
  
  // 削除確認後の処理
  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      dispatch(deleteTask(deleteConfirm.taskId))
      setDeleteConfirm(null)
    }
  }

  const renderTask = (task: Task, index: number) => {
    const isSwipingLeft = swipeState.taskId === task.id && swipeState.direction === 'left'
    const isSwipingRight = swipeState.taskId === task.id && swipeState.direction === 'right'
    
    // スワイプ距離を制限（最大80px）
    const rawSwipeOffset = swipeState.taskId === task.id
      ? swipeState.currentX - swipeState.startX 
      : 0
    const swipeOffset = Math.max(-80, Math.min(80, rawSwipeOffset))

    return (
      <div
        key={task.id}
        className="relative transition-all duration-200"
      >
        {/* スワイプ背景 */}
        {(isSwipingLeft || isSwipingRight) && (
          <div className={`absolute inset-y-0 flex items-center ${
            isSwipingLeft 
              ? 'bg-violet-600 right-0 pr-4 rounded-r-lg' 
              : 'bg-red-600 left-0 pl-4 rounded-l-lg'
          }`}
          style={{
            width: `${Math.abs(swipeOffset)}px`,
            transition: 'width 0.1s ease-out'
          }}>
            {isSwipingLeft ? (
              <div className="flex items-center gap-2 text-white ml-auto">
                <span className="font-medium text-sm">Inbox</span>
                <Inbox className="w-4 h-4" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white">
                <Trash2 className="w-4 h-4" />
                <span className="font-medium text-sm">削除</span>
              </div>
            )}
          </div>
        )}
        
        {/* タスクカード */}
        <div
          className={`relative bg-gray-800 rounded-lg p-4 border transition-all duration-200 ${
            task.order === 1 
              ? 'border-orange-500/50 bg-gradient-to-r from-gray-800 to-gray-800/90' 
              : 'border-gray-700'
          }`}
          style={{
            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
            transition: swipeOffset !== 0 ? 'transform 0.1s ease-out' : 'none'
          }}
          onTouchStart={(e) => handleTouchStart(e, task)}
          onMouseDown={(e) => handleTouchStart(e, task)}
          onTouchMove={(e) => handleMove(e)}
          onMouseMove={(e) => handleMove(e)}
          onTouchEnd={() => handleEnd(task)}
          onMouseUp={() => handleEnd(task)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-100 font-medium">{task.title}</p>
              {task.order === 1 && (
                <span className="text-xs text-orange-400">最優先タスク</span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              #{index + 1}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {categories.map((category) => {
        const tasks = tasksSelector[category.id]
        const isExecuting = executingCategory === category.id
        const isEmpty = tasks.length === 0

        return (
          <div 
            key={category.id} 
            className={`bg-gray-800 rounded-2xl shadow-lg border-2 overflow-hidden transition-all ${
              isExecuting ? 'border-orange-500/50' : 'border-gray-700'
            } ${isEmpty ? 'opacity-50' : ''}`}
          >
            <div className={`p-4 bg-gradient-to-r ${category.gradient} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <category.icon className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">{category.label}</h3>
                {isExecuting && (
                  <div className="flex items-center gap-1.5 bg-orange-500/20 px-2.5 py-1 rounded-full">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span className="text-xs font-semibold text-orange-400">実行中</span>
                  </div>
                )}
              </div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium text-white">
                {tasks.length}件
              </span>
            </div>
            
            <div className={`p-4 space-y-3 min-h-[100px] ${isEmpty ? 'flex items-center justify-center' : ''}`}>
              {isEmpty ? (
                <p className="text-gray-500 text-sm">タスクがありません</p>
              ) : (
                tasks.map((task, index) => renderTask(task, index))
              )}
            </div>
          </div>
        )
      })}

      {/* 統計情報 */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-gray-100">今日の統計</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{dailyStats.completed}</p>
            <p className="text-xs text-gray-400 mt-1">完了</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{dailyStats.created}</p>
            <p className="text-xs text-gray-400 mt-1">作成</p>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-100 mb-2">タスクを削除しますか？</h3>
            <p className="text-gray-400 mb-6 text-sm break-words">
              「{deleteConfirm.title}」を削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}