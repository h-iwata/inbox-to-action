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
  toggleExecuting,
} from '../../store/slices/tasksSlice'
import { setMode, clearScrollToCategory } from '../../store/slices/uiSlice'
import { categoryIcons } from '../../config/icons'
import { CategoryCompletionBar } from '../../components/CategoryCompletionBar/CategoryCompletionBar'
import { SwipeableTaskCard } from './SwipeableTaskCard'
import { Flame, Trash2, RefreshCw, PenTool } from 'lucide-react'
import type { Category, Task } from '../../types'

export const ListMode: React.FC = () => {
  const dispatch = useDispatch()
  const topTasks = useSelector(selectTopTasksByCategory)
  const scrollToCategory = useSelector((state: RootState) => state.ui.scrollToCategory)

  // 実行中のカテゴリを特定
  const executingCategory = topTasks.find(task => task.isExecuting === true)?.category as Category | undefined

  // 削除確認モーダルの状態
  const [deleteConfirm, setDeleteConfirm] = useState<{
    taskId: string
    title: string
  } | null>(null)

  const categories: {
    id: Category
    label: string
    icon: React.ComponentType<{ className?: string }>
    gradient: string
    color: string
  }[] = [
    {
      id: 'work',
      ...categoryIcons.work,
      gradient: 'from-sky-500 to-sky-600',
      color: 'sky',
    },
    {
      id: 'life',
      ...categoryIcons.life,
      gradient: 'from-teal-500 to-teal-600',
      color: 'teal',
    },
    {
      id: 'study',
      ...categoryIcons.study,
      gradient: 'from-violet-500 to-violet-600',
      color: 'violet',
    },
    {
      id: 'hobby',
      ...categoryIcons.hobby,
      gradient: 'from-pink-500 to-pink-600',
      color: 'pink',
    },
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
            behavior: 'smooth',
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
    inbox: [] as Task[],
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
    const topTask = tasksSelector[category][0]

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
  const handleMoveToTop = (task: Task, category: Category, index: number) => {
    // すでに最上位（index=0）の場合は実行モードへ遷移
    if (index === 0) {
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

    // 先頭に移動
    dispatch(
      reorderTasksInCategory({
        taskId: task.id,
        newPosition: 1,
        category: category,
      })
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 統計情報 - グラデーションバー（最上部に配置） */}
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border-2 border-gray-700/60 p-5 backdrop-blur-md">
        <CategoryCompletionBar />
      </div>

      {categories.map(category => {
        const tasks = tasksSelector[category.id]
        const isExecuting = executingCategory === category.id
        const isEmpty = tasks.length === 0

        return (
          <div
            key={category.id}
            ref={el => {
              categoryRefs.current[category.id] = el
            }}
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
                  ) : tasks.length > 0 ? (
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
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${category.color}-500/10 mb-3`}
                  >
                    <category.icon className={`w-8 h-8 text-${category.color}-400/50`} />
                  </div>
                  <p className="text-gray-500 text-sm">タスクがありません</p>
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
                    {tasks.map((task, index) => (
                      <SwipeableTaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        category={category.id}
                        onSwipeLeft={taskId => dispatch(changeCategory({ taskId, newCategory: 'inbox' }))}
                        onSwipeRight={t => setDeleteConfirm({ taskId: t.id, title: t.title })}
                        onTap={handleMoveToTop}
                      />
                    ))}
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
                「{deleteConfirm.title}
                」を削除します。この操作は取り消せません。
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
