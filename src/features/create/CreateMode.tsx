import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTask, deleteTask, selectInboxTasks } from '../../store/slices/tasksSlice'
import { TaskCard } from '../../components/TaskCard/TaskCard'
import { categoryIcons } from '../../config/icons'

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
      
      <form onSubmit={handleSubmit} className="mb-6">
        {isEmpty ? (
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="今日やりたいことは？ [仕事/生活/学習/趣味]"
              maxLength={100}
              className="w-full h-40 px-6 text-xl bg-gray-800/80 backdrop-blur-sm border-2 border-gray-700 rounded-2xl focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 resize-none pt-16 text-gray-100"
              autoFocus
            />
            <div className="absolute top-4 right-4 text-sm text-gray-500">
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
              className="w-full h-12 px-4 text-base bg-gray-800/80 backdrop-blur-sm border-2 border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 text-gray-100"
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <button
                type="submit"
                disabled={!inputValue.trim() || isSubmitting}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <p className="text-gray-500 text-lg">タスクを入力してEnterキーで追加</p>
        </div>
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