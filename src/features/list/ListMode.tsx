import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  deleteTask, 
  selectTasksByCategory, 
  selectTopTasksByCategory,
  changeCategory,
  reorderTasksInCategory,
  toggleExecuting
} from '../../store/slices/tasksSlice'
import { setMode, clearScrollToCategory } from '../../store/slices/uiSlice'
import { categoryIcons } from '../../config/icons'
import { CategoryCompletionBar } from '../../components/CategoryCompletionBar/CategoryCompletionBar'
import { Flame, Trash2, Inbox, Target, Play, RefreshCw, PenTool } from 'lucide-react'
import type { Category, Task } from '../../types'

interface SwipeState {
  taskId: string | null
  startX: number
  currentX: number
  direction: 'left' | 'right' | null
}

export const ListMode: React.FC = () => {
  const dispatch = useDispatch()
  const topTasks = useSelector(selectTopTasksByCategory)
  const scrollToCategory = useSelector((state: RootState) => state.ui.scrollToCategory)
  
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

  // カテゴリセクションへの参照を保持
  const categoryRefs = useRef<{ [key in Category]?: HTMLDivElement | null }>({})

  // スクロール処理
  useEffect(() => {
    if (scrollToCategory && categoryRefs.current[scrollToCategory]) {
      // 少し遅延を入れてDOMの描画完了を待つ
      setTimeout(() => {
        const element = categoryRefs.current[scrollToCategory]
        if (element) {
          // カテゴリヘッダーが画面上部から少し余裕を持って表示されるように調整
          const yOffset = -80 // ヘッダーの上に80pxの余白を確保
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
          
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          })
        }
        // スクロール後にクリア
        dispatch(clearScrollToCategory())
      }, 100)
    }
  }, [scrollToCategory, dispatch])

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
  const handleMove = (e: React.TouchEvent | React.MouseEvent, taskId: string) => {
    if (!swipeState.taskId || swipeState.taskId !== taskId) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - swipeState.startX
    
    // より小さい閾値でスワイプを検出
    if (Math.abs(deltaX) > 5) {
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

  // カテゴリヘッダーをタップして実行中カテゴリを切り替え
  const handleCategoryHeaderClick = (category: Category) => {
    // 該当カテゴリの最上位タスクを取得
    const topTask = tasksSelector[category].find(t => t.order === 1)
    
    if (topTask) {
      // バイブレーション（モバイルのみ）
      if (navigator.vibrate) {
        navigator.vibrate(15)
      }
      
      // 現在実行中でない場合は実行中に設定
      if (!topTask.isExecuting) {
        dispatch(toggleExecuting(topTask.id))
      }
    }
  }

  // タスクをクリックして最上位に移動または実行モードへ遷移
  const handleMoveToTop = (task: Task, category: Category) => {
    // すでに最上位（order=1）の場合は実行モードへ遷移
    if (task.order === 1) {
      // バイブレーション（モバイルのみ）
      if (navigator.vibrate) {
        navigator.vibrate(20)
      }
      
      // タスクが実行中でない場合は実行中に設定
      if (!task.isExecuting) {
        dispatch(toggleExecuting(task.id))
      }
      
      // 実行モードへ遷移
      dispatch(setMode('execute'))
      return
    }
    
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
    
    // スワイプ距離を計算（最大80px）
    let swipeOffset = 0
    if (swipeState.taskId === task.id && swipeState.currentX !== 0) {
      const rawOffset = swipeState.currentX - swipeState.startX
      swipeOffset = Math.max(-80, Math.min(80, rawOffset))
    }

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
        style={{ overflow: 'hidden' }}
      >
        {/* スワイプ背景 */}
        <div className={`absolute inset-0 flex items-center ${
          isSwipingLeft 
            ? 'bg-gradient-to-r from-violet-600 to-violet-500 justify-end pr-4' 
            : isSwipingRight
            ? 'bg-gradient-to-l from-red-600 to-red-500 justify-start pl-4'
            : 'hidden'
        } rounded-xl`}
        style={{
          opacity: Math.abs(swipeOffset) / 80,
          zIndex: 0
        }}>
          {isSwipingLeft ? (
            <div className="flex items-center gap-2 text-white">
              <span className="font-semibold text-sm">Inbox</span>
              <Inbox className="w-5 h-5" />
            </div>
          ) : isSwipingRight ? (
            <div className="flex items-center gap-2 text-white">
              <Trash2 className="w-5 h-5" />
              <span className="font-semibold text-sm">削除</span>
            </div>
          ) : null}
        </div>
        
        {/* タスクカード */}
        <div
          className={`relative rounded-xl p-4 border-2 backdrop-blur-sm shadow-lg transition-colors cursor-pointer ${
            task.order === 1 
              ? 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-400/60 shadow-orange-500/20 hover:from-orange-500/20 hover:to-yellow-500/20 hover:border-orange-400/80' 
              : swipeState.taskId === task.id && Math.abs(swipeOffset) > 10
              ? 'bg-gray-800/60 border-gray-700/50'
              : 'bg-gradient-to-r from-gray-800/80 to-gray-800/60 border-gray-700/50 hover:border-gray-600 hover:shadow-xl'
          }`}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeState.taskId === task.id ? 'none' : 'transform 0.2s ease-out',
            position: 'relative',
            zIndex: swipeState.taskId === task.id ? 10 : 1,
          }}
          onClick={() => {
            // スワイプ中はクリックを無視
            if (Math.abs(swipeOffset) < 10) {
              handleMoveToTop(task, category)
            }
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            handleTouchStart(e, task)
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            handleTouchStart(e, task)
          }}
          onTouchMove={(e) => {
            e.stopPropagation()
            handleMove(e, task.id)
          }}
          onMouseMove={(e) => {
            if (swipeState.taskId === task.id) {
              e.stopPropagation()
              handleMove(e, task.id)
            }
          }}
          onTouchEnd={(e) => {
            e.stopPropagation()
            handleEnd(task)
          }}
          onMouseUp={(e) => {
            e.stopPropagation()
            handleEnd(task)
          }}
          onMouseLeave={() => {
            // マウスが離れた場合もリセット
            if (swipeState.taskId === task.id) {
              handleEnd(task)
            }
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`font-medium break-words whitespace-pre-wrap ${task.order === 1 ? 'text-orange-100 text-lg' : 'text-gray-100'}`}>
                {task.title}
              </p>
              {task.order === 1 && (
                <div className="flex items-center gap-1 mt-1 opacity-70">
                  <Play className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-orange-400">タップで実行開始</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.order === 1 && (
                <motion.div 
                  className="bg-orange-400/20 p-1.5 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                >
                  <Target className="w-4 h-4 text-orange-400" />
                </motion.div>
              )}
              <div className={`text-sm font-semibold ${
                task.order === 1 ? 'text-orange-400' : 'text-gray-400'
              }`}>
                #{index + 1}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 統計情報 - グラデーションバー（最上部に配置） */}
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-5 backdrop-blur-md">
        <CategoryCompletionBar />
      </div>

      {categories.map((category) => {
        const tasks = tasksSelector[category.id]
        const isExecuting = executingCategory === category.id
        const isEmpty = tasks.length === 0

        return (
          <div 
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el }}
            className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all ${
              isExecuting ? 'ring-2 ring-orange-400/60 shadow-orange-500/30' : 'border-2 border-gray-700/60'
            } ${isEmpty ? 'opacity-60' : ''}`}
          >
            <div 
              className={`p-5 bg-gradient-to-r ${category.gradient} flex items-center justify-between backdrop-blur-sm cursor-pointer hover:brightness-110 transition-all`}
              onClick={() => handleCategoryHeaderClick(category.id)}
            >
              <div className="flex items-center gap-4">
                <category.icon className="w-10 h-10 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white">{category.label}</h3>
                  {isExecuting ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Flame className="w-4 h-4 text-orange-300 animate-pulse" />
                      <span className="text-xs font-semibold text-orange-200">実行中</span>
                    </div>
                  ) : tasks.some(t => t.order === 1) ? (
                    <div className="flex items-center gap-1.5 mt-1 opacity-60">
                      <RefreshCw className="w-3 h-3 text-white" />
                      <span className="text-xs text-white">タップで切り替え</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/25 px-3 py-1.5 rounded-full text-sm font-bold text-white backdrop-blur-sm">
                  {tasks.length}件
                </span>
              </div>
            </div>
            
            <div className={`p-5 min-h-[120px] ${isEmpty ? 'flex items-center justify-center' : ''}`}>
              {isEmpty ? (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${category.color}-500/10 mb-3`}>
                    <category.icon className={`w-8 h-8 text-${category.color}-400/50`} />
                  </div>
                  <p className="text-gray-500 text-sm">
                    タスクがありません
                  </p>
                  <button
                    onClick={() => dispatch(setMode('create'))}
                    className="inline-flex items-center gap-1 px-3 py-1 mt-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg transition-colors text-sm"
                  >
                    <PenTool className="w-3 h-3" />
                    <span>作成</span>
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {tasks.map((task, index) => renderTask(task, index, category.id))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          </div>
        )
      })}

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