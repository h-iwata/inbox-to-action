import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTask, deleteTask, selectInboxTasks } from '../../store/slices/tasksSlice'
import { TaskCard } from '../../components/TaskCard/TaskCard'

export const CreateMode: React.FC = () => {
  const dispatch = useDispatch()
  const tasks = useSelector(selectInboxTasks)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isSubmitting) {
      setIsSubmitting(true)
      dispatch(addTask(inputValue.trim()))
      setInputValue('')
      setTimeout(() => setIsSubmitting(false), 300)
    }
  }

  const handleDelete = (id: string) => {
    dispatch(deleteTask(id))
  }

  const isEmpty = tasks.length === 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* カテゴリヒント */}
      <div className="mb-4 flex justify-center gap-4 text-sm">
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">🏢 仕事</span>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">🏠 生活</span>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">📚 学習</span>
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">🎮 趣味</span>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        {isEmpty ? (
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="今日やりたいことは？ [仕事/生活/学習/趣味]"
              maxLength={100}
              className="w-full h-40 px-6 text-xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400 resize-none pt-16"
              autoFocus
            />
            <div className="absolute top-4 right-4 text-sm text-gray-400">
              {inputValue.length}/100
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="新しいタスクを追加 [仕事/生活/学習/趣味]"
              maxLength={100}
              className="w-full h-12 px-4 text-base bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <button
                type="submit"
                disabled={!inputValue.trim() || isSubmitting}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                追加
              </button>
            </div>
          </div>
        )}
      </form>

      {!isEmpty && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
        </div>
      )}

      {isEmpty && (
        <div className="text-center mt-12">
          <p className="text-gray-400 text-lg">タスクを入力してEnterキーで追加</p>
        </div>
      )}

      <style jsx>{`
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
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}