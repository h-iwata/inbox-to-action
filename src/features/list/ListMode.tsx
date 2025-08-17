import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  deleteTask, 
  selectTasksByCategory, 
  selectDailyStats,
  selectTopTasksByCategory,
  reorderTasksInCategory,
  changeCategory
} from '../../store/slices/tasksSlice'
import { categoryIcons } from '../../config/icons'
import { BarChart3, Flame, Trash2, Inbox, GripVertical } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'
import type { Category, Task } from '../../types'

interface DragState {
  taskId: string | null
  startY: number
  currentY: number
  startX: number
  currentX: number
  originalIndex: number
  category: Category | null
}

interface SwipeState {
  taskId: string | null
  startX: number
  currentX: number
  direction: 'left' | 'right' | null
}

type GestureMode = 'none' | 'vertical' | 'horizontal'

export const ListMode: React.FC = () => {
  const dispatch = useDispatch()
  const dailyStats = useSelector(selectDailyStats)
  const topTasks = useSelector(selectTopTasksByCategory)
  const { isMobile } = useResponsive()
  
  // 実行中のカテゴリを特定
  const executingCategory = topTasks.find(task => task.isExecuting === true)?.category as Category | undefined

  const [dragState, setDragState] = useState<DragState>({
    taskId: null,
    startY: 0,
    currentY: 0,
    startX: 0,
    currentX: 0,
    originalIndex: 0,
    category: null
  })

  const [swipeState, setSwipeState] = useState<SwipeState>({
    taskId: null,
    startX: 0,
    currentX: 0,
    direction: null
  })

  const [longPressTaskId, setLongPressTaskId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [gestureMode, setGestureMode] = useState<GestureMode>('none')
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const categories: { id: Category; label: string; icon: any; gradient: string }[] = [
    { id: 'work', ...categoryIcons.work, gradient: 'from-sky-800 to-sky-900' },
    { id: 'life', ...categoryIcons.life, gradient: 'from-teal-800 to-teal-900' },
    { id: 'study', ...categoryIcons.study, gradient: 'from-violet-800 to-violet-900' },
    { id: 'hobby', ...categoryIcons.hobby, gradient: 'from-pink-800 to-pink-900' },
  ]

  // 長押し開始
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, task: Task, index: number, category: Category) => {
    if ('touches' in e) {
      const touch = e.touches[0]
      const startX = touch.clientX
      const startY = touch.clientY
      
      longPressTimerRef.current = setTimeout(() => {
        setLongPressTaskId(task.id)
        setDragState({
          taskId: task.id,
          startY,
          currentY: startY,
          startX,
          currentX: startX,
          originalIndex: index,
          category
        })
        // バイブレーション（対応端末のみ）
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 500)
    }
  }

  // タッチ/マウス移動
  const handleMove = (e: TouchEvent | MouseEvent) => {
    if (!longPressTaskId) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const deltaX = clientX - dragState.startX
    const deltaY = clientY - dragState.startY
    
    // まだ方向が決まっていない場合
    if (gestureMode === 'none') {
      // 横方向の移動が大きい場合はスワイプモード
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        setGestureMode('horizontal')
        setSwipeState({
          taskId: dragState.taskId,
          startX: dragState.startX,
          currentX: clientX,
          direction: deltaX > 0 ? 'right' : 'left'
        })
      } 
      // 縦方向の移動が大きい場合はドラッグモード
      else if (Math.abs(deltaY) > 20) {
        setGestureMode('vertical')
        setIsDragging(true)
      }
    }
    
    // 横方向モードの場合
    if (gestureMode === 'horizontal') {
      setSwipeState(prev => ({
        ...prev,
        currentX: clientX,
        direction: deltaX > 0 ? 'right' : 'left'
      }))
    }
    
    // 縦方向モードの場合
    if (gestureMode === 'vertical') {
      setDragState(prev => ({
        ...prev,
        currentY: clientY
      }))
      
      // ドラッグ位置から対象インデックスを計算
      const draggedElement = document.querySelector(`[data-task-id="${dragState.taskId}"]`)
      if (draggedElement) {
        const rect = draggedElement.getBoundingClientRect()
        const itemHeight = rect.height
        const movement = clientY - dragState.startY
        const newIndex = Math.round(dragState.originalIndex + movement / itemHeight)
        setDragOverIndex(Math.max(0, newIndex))
      }
    }
  }

  // タッチ/マウス終了
  const handleEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    // スワイプ処理
    if (swipeState.taskId && swipeState.direction) {
      const swipeDistance = Math.abs(swipeState.currentX - swipeState.startX)
      
      if (swipeDistance > 60) {
        if (swipeState.direction === 'left') {
          // Inboxへ戻す
          dispatch(changeCategory({ taskId: swipeState.taskId, newCategory: 'inbox' as Category }))
        } else if (swipeState.direction === 'right') {
          // 削除
          if (confirm('タスクを削除しますか？')) {
            dispatch(deleteTask(swipeState.taskId))
          }
        }
      }
    }
    
    // ドラッグ処理
    if (isDragging && dragOverIndex !== null && dragState.taskId && dragState.category) {
      const tasks = tasksSelector[dragState.category]
      if (dragOverIndex !== dragState.originalIndex && dragOverIndex < tasks.length) {
        dispatch(reorderTasksInCategory({
          taskId: dragState.taskId,
          newPosition: dragOverIndex + 1,
          category: dragState.category
        }))
      }
    }

    // リセット
    setLongPressTaskId(null)
    setIsDragging(false)
    setDragOverIndex(null)
    setGestureMode('none')
    setSwipeState({
      taskId: null,
      startX: 0,
      currentX: 0,
      direction: null
    })
    setDragState({
      taskId: null,
      startY: 0,
      currentY: 0,
      startX: 0,
      currentX: 0,
      originalIndex: 0,
      category: null
    })
  }

  // グローバルイベントリスナー
  useEffect(() => {
    if (longPressTaskId) {
      const handleGlobalMove = (e: TouchEvent | MouseEvent) => handleMove(e)
      const handleGlobalEnd = () => handleEnd()

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
  }, [longPressTaskId, dragState, swipeState, isDragging, dragOverIndex])

  // カテゴリごとのタスクセレクター
  const tasksSelector: Record<Category, Task[]> = {
    work: useSelector(selectTasksByCategory('work')),
    life: useSelector(selectTasksByCategory('life')),
    study: useSelector(selectTasksByCategory('study')),
    hobby: useSelector(selectTasksByCategory('hobby')),
    inbox: []
  }

  const renderTask = (task: Task, index: number, category: Category, tasks: Task[]) => {
    const isLongPressed = longPressTaskId === task.id
    const isBeingDragged = isDragging && dragState.taskId === task.id
    const isSwipingLeft = swipeState.taskId === task.id && swipeState.direction === 'left'
    const isSwipingRight = swipeState.taskId === task.id && swipeState.direction === 'right'
    
    // スワイプ距離を制限（最大80px）
    const rawSwipeOffset = swipeState.taskId === task.id 
      ? swipeState.currentX - swipeState.startX 
      : 0
    const swipeOffset = Math.max(-80, Math.min(80, rawSwipeOffset))
    
    const dragOffset = isBeingDragged
      ? dragState.currentY - dragState.startY
      : 0

    return (
      <div
        key={task.id}
        data-task-id={task.id}
        className={`relative transition-all duration-300 ${
          isBeingDragged ? 'z-50' : ''
        } ${
          dragOverIndex === index && !isBeingDragged ? 'mb-16' : ''
        }`}
        style={{
          transform: isBeingDragged 
            ? `translateY(${dragOffset}px) scale(1.05)` 
            : isLongPressed && !isBeingDragged && !swipeState.direction
              ? 'scale(1.02)'
              : 'scale(1)',
          opacity: isBeingDragged ? 0.9 : 1,
        }}
      >
        {/* スワイプ背景 */}
        {(isSwipingLeft || isSwipingRight) && (
          <div className={`absolute inset-y-0 rounded-lg flex items-center ${
            isSwipingLeft 
              ? 'bg-violet-600 right-0 pr-4' 
              : 'bg-red-600 left-0 pl-4'
          }`}
          style={{
            width: `${Math.abs(swipeOffset)}px`
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
          className={`relative bg-gray-800 rounded-lg p-4 border transition-all ${
            isLongPressed 
              ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/50' 
              : task.order === 1 
                ? 'border-orange-500/50 bg-gradient-to-r from-gray-800 to-gray-800/90' 
                : 'border-gray-700'
          }`}
          style={{
            transform: `translateX(${swipeOffset}px)`,
          }}
          onTouchStart={(e) => handleLongPressStart(e, task, index, category)}
          onTouchEnd={() => {
            if (longPressTimerRef.current && !isLongPressed) {
              clearTimeout(longPressTimerRef.current)
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {isMobile && (
                <GripVertical className="w-4 h-4 text-gray-500" />
              )}
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
                tasks.map((task, index) => renderTask(task, index, category.id, tasks))
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
    </div>
  )
}