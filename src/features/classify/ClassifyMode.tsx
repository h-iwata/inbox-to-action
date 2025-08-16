import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { classifyTask, selectInboxTasks } from '../../store/slices/tasksSlice'
import type { Category } from '../../types'

export const ClassifyMode: React.FC = () => {
  const dispatch = useDispatch()
  const inboxTasks = useSelector(selectInboxTasks)
  const currentTask = inboxTasks[0]

  const handleClassify = (category: Category) => {
    if (currentTask) {
      dispatch(classifyTask({ id: currentTask.id, category }))
    }
  }

  const handleSkip = () => {
    if (currentTask && inboxTasks.length > 1) {
      // Skip機能は順序を変えないため、表示上のスキップのみ
      // 将来的にスキップ機能を実装する場合はここに処理を追加
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentTask) return
      
      // Tabキーはモード切り替えに使うのでスキップ
      if (e.key === 'Tab') return

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault()
          handleClassify('study')
          break
        case 'a':
        case 'arrowleft':
          e.preventDefault()
          handleClassify('work')
          break
        case 's':
        case 'arrowdown':
          e.preventDefault()
          handleClassify('hobby')
          break
        case 'd':
        case 'arrowright':
          e.preventDefault()
          handleClassify('life')
          break
        case ' ':
          e.preventDefault()
          handleSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentTask])

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">すべて分類完了！</h2>
          <p className="text-gray-400">新しいタスクを追加するか、一覧を確認してください</p>
        </div>
      </div>
    )
  }


  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* カテゴリ選択エリア（上部） */}
      <div className="flex-shrink-0 mb-4 md:mb-6">
        <div className="relative h-[280px] md:h-[320px]">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-4">
          {/* Top - Study */}
          <div className="col-start-2 row-start-1">
            <button
              onClick={() => handleClassify('study')}
              className="w-full h-full bg-gradient-to-br from-violet-800 to-violet-900 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
            >
              <div className="text-3xl md:text-5xl mb-2">📚</div>
              <div className="text-sm md:text-lg font-bold">学習</div>
              <div className="text-xs opacity-80 mt-1 mb-2 hidden md:block">W / ↑</div>
            </button>
          </div>

          {/* Left - Work */}
          <div className="col-start-1 row-start-2">
            <button
              onClick={() => handleClassify('work')}
              className="w-full h-full bg-gradient-to-br from-sky-800 to-sky-900 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
            >
              <div className="text-3xl md:text-5xl mb-2">🏢</div>
              <div className="text-sm md:text-lg font-bold">仕事</div>
              <div className="text-xs opacity-80 mt-1 mb-2 hidden md:block">A / ←</div>
            </button>
          </div>

          {/* Center - Current Task Display */}
          <div className="col-start-2 row-start-2 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">カテゴリを選択</div>
              <button
                onClick={handleSkip}
                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                スキップ (Space)
              </button>
            </div>
          </div>

          {/* Right - Life */}
          <div className="col-start-3 row-start-2">
            <button
              onClick={() => handleClassify('life')}
              className="w-full h-full bg-gradient-to-br from-teal-800 to-teal-900 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
            >
              <div className="text-3xl md:text-5xl mb-2">🏠</div>
              <div className="text-sm md:text-lg font-bold">生活</div>
              <div className="text-xs opacity-80 mt-1 mb-2 hidden md:block">D / →</div>
            </button>
          </div>

          {/* Bottom - Hobby */}
          <div className="col-start-2 row-start-3">
            <button
              onClick={() => handleClassify('hobby')}
              className="w-full h-full bg-gradient-to-br from-pink-800 to-pink-900 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
            >
              <div className="text-3xl md:text-5xl mb-2">🎮</div>
              <div className="text-sm md:text-lg font-bold">趣味</div>
              <div className="text-xs opacity-80 mt-1 mb-2 hidden md:block">S / ↓</div>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* タスクリストエリア（下部） */}
      <div className="flex-1 overflow-hidden">
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 h-full flex flex-col">
          {/* 現在のタスク */}
          <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-200">🎯 現在のタスク</h3>
              <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                {inboxTasks.indexOf(currentTask) + 1} / {inboxTasks.length}
              </span>
            </div>
            <p className="text-xl text-gray-100 font-medium">{currentTask.title}</p>
          </div>

          {/* 残りのタスクリスト */}
          {inboxTasks.length > 1 && (
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm text-gray-400 font-medium mb-3">次のタスク:</h4>
              <div className="space-y-2">
                {inboxTasks.slice(1, Math.min(5, inboxTasks.length)).map((task, index) => (
                  <div
                    key={task.id}
                    className="px-4 py-3 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <span className="text-sm text-gray-500 mr-2">{index + 2}.</span>
                    <span className="text-gray-300">{task.title}</span>
                  </div>
                ))}
                {inboxTasks.length > 5 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    他 {inboxTasks.length - 5} 件のタスク...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}