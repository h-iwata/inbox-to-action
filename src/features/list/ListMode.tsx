import React, { useState, useRef, useEffect } from 'react'
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
import { useResponsive } from '../../hooks/useResponsive'
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
  const { isMobile } = useResponsive()
  
  // 実行中のカテゴリを特定
  const executingCategory = topTasks.find(task => task.isExecuting === true)?.category as Category | undefined

  // スワイプ用の状態（即座に左右移動）
  const [swipeState, setSwipeState] = useState<SwipeState>({
    taskId: null,
    startX: 0,
    currentX: 0,
    direction: null
  })
  
  // 削除確認モーダルの状態
  const [deleteConfirm, setDeleteConfirm] = useState<{ taskId: string, title: string } | null>(null)

  const categories: { id: Category; label: string; icon: any; gradient: string }[] = [
    { id: 'work', ...categoryIcons.work, gradient: 'from-sky-800 to-sky-900' },
    { id: 'life', ...categoryIcons.life, gradient: 'from-teal-800 to-teal-900' },
    { id: 'study', ...categoryIcons.study, gradient: 'from-violet-800 to-violet-900' },
    { id: 'hobby', ...categoryIcons.hobby, gradient: 'from-pink-800 to-pink-900' },
  ]

  // タッチ/マウス開始
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, task: Task) => {
    if ('touches' in e) {
      const touch = e.touches[0]
      const startX = touch.clientX
      
      // スワイプの準備
      setSwipeState({
        taskId: task.id,
        startX,
        currentX: startX,
        direction: null
      })
    }
  }

  // タッチ/マウス移動
  const handleMove = (e: TouchEvent | MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    
    // 通常の左右スワイプ
    if (swipeState.taskId) {
      const deltaX = clientX - swipeState.startX
      
      // 横方向の移動を検出
      if (Math.abs(deltaX) > 10) {
        setSwipeState(prev => ({
          ...prev,
          currentX: clientX,
          direction: deltaX > 0 ? 'right' : 'left'
        }))
      }
    }
  }

  // タッチ/マウス終了
  const handleEnd = (task?: Task) => {
    // スワイプ処理
    if (swipeState.taskId && swipeState.direction) {
      const swipeDistance = Math.abs(swipeState.currentX - swipeState.startX)
      
      if (swipeDistance > 60) {
        if (swipeState.direction === 'left') {
          // Inboxへ戻す
          dispatch(changeCategory({ taskId: swipeState.taskId, newCategory: 'inbox' as Category }))
        } else if (swipeState.direction === 'right' && task) {
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

  // グローバルイベントリスナー
  useEffect(() => {
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => handleMove(e)
    const handleGlobalEnd = () => handleEnd()

    if (swipeState.taskId) {
      if (isMobile) {
        window.addEventListener('touchmove', handleGlobalMove, { passive: false })
        window.addEventListener('touchend', handleGlobalEnd)
        window.addEventListener('touchcancel', handleGlobalEnd)
      } else {
        window.addEventListener('mousemove', handleGlobalMove)
        window.addEventListener('mouseup', handleGlobalEnd)
      }

      return () => {
        window.removeEventListener('touchmove', handleGlobalMove)
        window.removeEventListener('touchend', handleGlobalEnd)
        window.removeEventListener('touchcancel', handleGlobalEnd)
        window.removeEventListener('mousemove', handleGlobalMove)
        window.removeEventListener('mouseup', handleGlobalEnd)
      }
    }
  }, [swipeState.taskId])

  // カテゴリごとのタスクセレクター
  const tasksSelector: Record<Category, Task[]> = {
    work: useSelector(selectTasksByCategory('work')),
    life: useSelector(selectTasksByCategory('life')),
    study: useSelector(selectTasksByCategory('study')),
    hobby: useSelector(selectTasksByCategory('hobby')),
    inbox: []
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
        data-task-id={task.id}
        className="relative transition-all duration-200"
      >
        {/* スワイプ背景 */}
        {(isSwipingLeft || isSwipingRight) && (
          <div className={`absolute inset-y-0 rounded-lg flex items-center ${
            isSwipingLeft 
              ? 'bg-violet-600 right-0 pr-4' 
              : 'bg-red-600 left-0 pl-4'
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
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeOffset !== 0 ? 'transform 0.1s ease-out' : 'none'
          }}
          onTouchStart={(e) => handleTouchStart(e, task)}
          onTouchEnd={() => handleEnd(task)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <p className="text-gray-100 font-medium">{task.title}</p>
                {task.order === 1 && (
                  <span className="text-xs text-orange-400">最優先タスク</span>
                )}
              </div>
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
            <div className={`bg-gradient-to-r ${category.gradient} text-white px-6 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                {React.createElement(category.icon, {
                  className: "w-6 h-6 text-white"
                })}
                <h3 className="text-lg font-bold">{category.label}</h3>
                {isExecuting && (
                  <div className="flex items-center gap-1 bg-orange-500/30 px-2 py-0.5 rounded-full">
                    <Flame className="w-4 h-4 text-orange-300 animate-pulse" />
                    <span className="text-sm font-medium">実行中</span>
                  </div>
                )}
              </div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
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

      {/* 統計情報（簡素化） */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">今日の活動</span>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">作成:</span>
              <span className="text-blue-400 font-bold">{dailyStats.created}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">分類:</span>
              <span className="text-purple-400 font-bold">{dailyStats.classified}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">完了:</span>
              <span className="text-green-400 font-bold">{dailyStats.completed}</span>
            </div>
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