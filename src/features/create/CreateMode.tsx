import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTask, deleteTask, selectInboxTasks } from '../../store/slices/tasksSlice'
import { setMode } from '../../store/slices/uiSlice'
import { TaskCard } from '../../components/TaskCard/TaskCard'
import { categoryIcons } from '../../config/icons'
import { Send, Inbox, Layers } from 'lucide-react'

export const CreateMode: React.FC = () => {
  const dispatch = useDispatch()
  const tasks = useSelector(selectInboxTasks)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showClassifyPrompt, setShowClassifyPrompt] = useState(false)
  const tasksEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isSubmitting) {
      setIsSubmitting(true)
      dispatch(addTask(inputValue.trim()))
      setInputValue('')
      setTimeout(() => {
        setIsSubmitting(false)
        tasksEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        // タスク追加後もフォーカスを維持
        inputRef.current?.focus()
        // textareaの高さをリセット
        if (inputRef.current) {
          inputRef.current.style.height = 'auto'
        }
      }, 300)
    }
  }
  
  // textareaの高さを自動調整
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // 高さをリセットしてから、コンテンツに合わせて調整
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px' // 最大200px（約5行）
  }
  
  // Enterキーで送信（Shift+Enterで改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-focus input when component mounts or when all tasks are deleted
  useEffect(() => {
    if (tasks.length === 0) {
      inputRef.current?.focus()
    }
  }, [tasks.length])
  
  // タスクリストが表示された直後（最初のタスクが追加された時）にフォーカス
  useEffect(() => {
    if (tasks.length === 1) {
      // 少し遅延を入れてDOMの更新を待つ
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [tasks.length])

  const handleDelete = (id: string) => {
    dispatch(deleteTask(id))
  }

  const isEmpty = tasks.length === 0

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-240px)]">
      {isEmpty ? (
        // 初回入力時：中央に大きな入力ボックス
        <div className="flex-1 flex flex-col justify-center">
          {/* カテゴリヒント */}
          <div className="mb-8 flex justify-center gap-4 text-sm">
            <span className="px-3 py-1 bg-sky-900/40 text-sky-300 rounded-full flex items-center gap-1">
              {React.createElement(categoryIcons.work.icon, { className: "w-4 h-4" })}
              {categoryIcons.work.label}
            </span>
            <span className="px-3 py-1 bg-teal-900/40 text-teal-300 rounded-full flex items-center gap-1">
              {React.createElement(categoryIcons.life.icon, { className: "w-4 h-4" })}
              {categoryIcons.life.label}
            </span>
            <span className="px-3 py-1 bg-violet-900/40 text-violet-300 rounded-full flex items-center gap-1">
              {React.createElement(categoryIcons.study.icon, { className: "w-4 h-4" })}
              {categoryIcons.study.label}
            </span>
            <span className="px-3 py-1 bg-pink-900/40 text-pink-300 rounded-full flex items-center gap-1">
              {React.createElement(categoryIcons.hobby.icon, { className: "w-4 h-4" })}
              {categoryIcons.hobby.label}
            </span>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="relative max-w-2xl mx-auto">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="今日やりたいことは？"
                maxLength={100}
                rows={1}
                className={`w-full px-6 py-8 text-xl bg-gray-800/90 backdrop-blur-sm border-2 border-gray-600 rounded-2xl focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all placeholder-gray-400 text-gray-100 shadow-xl resize-none overflow-hidden leading-relaxed ${inputValue ? 'pr-20' : ''}`}
                style={{ minHeight: '96px' }}
                autoFocus
              />
              <div className="absolute top-3 right-4 text-sm text-gray-500">
                {inputValue.length}/100
              </div>
              {inputValue && (
                <button
                  type="submit"
                  className="absolute bottom-3 right-3 p-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </form>
          
          <div className="text-center mt-8">
            <p className="text-gray-500">タスクを入力して追加</p>
          </div>
        </div>
      ) : (
        // タスクがある時：AIチャット風レイアウト
        <>
          {/* Inboxヘッダー */}
          <div className="mb-4 px-2">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-gray-300">Inbox</span>
              <span className="text-sm bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full font-bold">{tasks.length}</span>
            </div>
          </div>
          
          {/* タスクリスト（スクロール可能） */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 px-2 pb-4 mb-2 min-h-0">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-slide-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <TaskCard
                  task={task}
                  variant="create"
                  onDelete={handleDelete}
                />
              </div>
            ))}
            <div ref={tasksEndRef} />
          </div>
          
          {/* 常に下部に固定された入力ボックス */}
          <div className="border-t border-gray-700 pt-4 pb-8 flex-shrink-0">
            {/* 分類への遷移メッセージ */}
            {showClassifyPrompt && tasks.length > 0 && (
              <div className="mb-3 text-center text-sm text-gray-400">
                作成したタスクを
                <button
                  onClick={() => dispatch(setMode('classify'))}
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-colors"
                >
                  <Layers className="w-3 h-3" />
                  <span>分類</span>
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowClassifyPrompt(false)}
                  onBlur={() => setShowClassifyPrompt(true)}
                  placeholder="新しいタスクを追加..."
                  maxLength={100}
                  rows={1}
                  className="w-full px-5 py-4 pr-16 text-base bg-gray-800/90 backdrop-blur-sm border-2 border-gray-600 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all placeholder-gray-400 text-gray-100 resize-none overflow-hidden leading-normal"
                  style={{ minHeight: '56px' }}
                />
                
                {/* 文字数カウンター */}
                <div className="absolute top-1 right-2 text-xs text-gray-500">
                  {inputValue.length}/100
                </div>
                
                {/* 送信ボタン */}
                {inputValue && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  )
}