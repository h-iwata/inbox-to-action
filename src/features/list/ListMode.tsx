import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  deleteTask, 
  selectTasksByCategory, 
  selectDailyStats,
  selectTopTasksByCategory,
  changeCategory,
  reorderTasksInCategory
} from '../../store/slices/tasksSlice'
import { categoryIcons } from '../../config/icons'
import { BarChart3, Flame, Trash2, Inbox, CheckCircle2, Trophy, Target } from 'lucide-react'
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

  const categories: { id: Category; label: string; icon: React.ComponentType<{ className?: string }>; gradient: string; color: string }[] = [
    { id: 'work', ...categoryIcons.work, gradient: 'from-sky-500 to-sky-600', color: 'sky' },
    { id: 'life', ...categoryIcons.life, gradient: 'from-teal-500 to-teal-600', color: 'teal' },
    { id: 'study', ...categoryIcons.study, gradient: 'from-violet-500 to-violet-600', color: 'violet' },
    { id: 'hobby', ...categoryIcons.hobby, gradient: 'from-pink-500 to-pink-600', color: 'pink' },
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

  // タスクをクリックして最上位に移動
  const handleMoveToTop = (task: Task, category: Category) => {
    // すでに最上位（order=1）の場合は何もしない
    if (task.order === 1) return
    
    // バイブレーション（モバイルのみ）
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
    
    // order=1の位置に移動
    dispatch(reorderTasksInCategory({
      taskId: task.id,
      newPosition: 1,
      category: category
    }))
  }

  const renderTask = (task: Task, index: number, category: Category) => {
    const isSwipingLeft = swipeState.taskId === task.id && swipeState.direction === 'left'
    const isSwipingRight = swipeState.taskId === task.id && swipeState.direction === 'right'
    
    // スワイプ距離を制限（最大80px）
    const rawSwipeOffset = swipeState.taskId === task.id
      ? swipeState.currentX - swipeState.startX 
      : 0
    const swipeOffset = Math.max(-80, Math.min(80, rawSwipeOffset))

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          layout: { duration: 0.2, ease: "easeInOut" },
          opacity: { duration: 0.15 },
          y: { duration: 0.15 }
        }}
        className="relative"
      >
        {/* スワイプ背景 */}
        {(isSwipingLeft || isSwipingRight) && (
          <div className={`absolute inset-y-0 flex items-center ${
            isSwipingLeft 
              ? 'bg-gradient-to-r from-violet-600 to-violet-500 right-0 pr-4 rounded-r-xl' 
              : 'bg-gradient-to-l from-red-600 to-red-500 left-0 pl-4 rounded-l-xl'
          }`}
          style={{
            width: `${Math.abs(swipeOffset)}px`,
            transition: 'width 0.1s ease-out'
          }}>
            {isSwipingLeft ? (
              <div className="flex items-center gap-2 text-white ml-auto">
                <span className="font-semibold text-sm">Inbox</span>
                <Inbox className="w-5 h-5" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white">
                <Trash2 className="w-5 h-5" />
                <span className="font-semibold text-sm">削除</span>
              </div>
            )}
          </div>
        )}
        
        {/* タスクカード */}
        <motion.div
          className={`relative bg-gradient-to-r rounded-xl p-4 border-2 backdrop-blur-sm shadow-lg ${
            task.order === 1 
              ? 'from-orange-500/10 to-yellow-500/10 border-orange-400/60 shadow-orange-500/20' 
              : 'from-gray-800/80 to-gray-800/60 border-gray-700/50 hover:border-gray-600 cursor-pointer hover:shadow-xl'
          }`}
          style={{
            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none',
          }}
          whileTap={task.order !== 1 ? { scale: 0.97 } : {}}
          whileHover={task.order !== 1 ? { scale: 1.02 } : {}}
          onClick={() => handleMoveToTop(task, category)}
          onTouchStart={(e) => handleTouchStart(e, task)}
          onMouseDown={(e) => handleTouchStart(e, task)}
          onTouchMove={(e) => handleMove(e)}
          onMouseMove={(e) => handleMove(e)}
          onTouchEnd={() => handleEnd(task)}
          onMouseUp={() => handleEnd(task)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`font-medium ${task.order === 1 ? 'text-orange-100 text-lg' : 'text-gray-100'}`}>
                {task.title}
              </p>
              {task.order === 1 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Trophy className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-orange-400 font-semibold">最優先タスク</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.order === 1 && (
                <div className="bg-orange-400/20 p-1.5 rounded-full">
                  <Target className="w-4 h-4 text-orange-400" />
                </div>
              )}
              <div className={`text-sm font-semibold ${
                task.order === 1 ? 'text-orange-400' : 'text-gray-400'
              }`}>
                #{index + 1}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {categories.map((category) => {
        const tasks = tasksSelector[category.id]
        const isExecuting = executingCategory === category.id
        const isEmpty = tasks.length === 0

        return (
          <motion.div 
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categories.indexOf(category) * 0.1 }}
            className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 overflow-hidden backdrop-blur-md transition-all ${
              isExecuting ? 'border-orange-400/60 shadow-orange-500/30' : 'border-gray-700/60'
            } ${isEmpty ? 'opacity-60' : ''}`}
          >
            <div className={`p-5 bg-gradient-to-r ${category.gradient} flex items-center justify-between backdrop-blur-sm`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white/20 rounded-lg backdrop-blur-sm`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{category.label}</h3>
                  {isExecuting && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Flame className="w-4 h-4 text-orange-300 animate-pulse" />
                      <span className="text-xs font-semibold text-orange-200">実行中</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/25 px-3 py-1.5 rounded-full text-sm font-bold text-white backdrop-blur-sm">
                  {tasks.length}件
                </span>
                {tasks.filter(t => t.order === 1).length > 0 && (
                  <div className="bg-orange-400/30 p-1.5 rounded-full">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-5 min-h-[120px] ${isEmpty ? 'flex items-center justify-center' : ''}`}>
              {isEmpty ? (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${category.color}-500/10 mb-3`}>
                    <category.icon className={`w-8 h-8 text-${category.color}-400/50`} />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">タスクがありません</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {tasks.map((task, index) => renderTask(task, index, category.id))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* 統計情報 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-5 backdrop-blur-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-100">今日の統計</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 text-center border border-green-500/20">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{dailyStats.completed}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">完了タスク</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-xl p-4 text-center border border-yellow-500/20">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">{dailyStats.created}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">作成タスク</p>
          </div>
        </div>
      </motion.div>

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-sm w-full border-2 border-gray-700 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-100">タスクを削除</h3>
              </div>
              <p className="text-gray-400 mb-6 text-sm break-words">
                「{deleteConfirm.title}」を削除します。この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-400 transition-all font-bold shadow-lg shadow-red-500/30"
                >
                  削除する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}