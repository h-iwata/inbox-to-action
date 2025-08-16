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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">すべて分類完了！</h2>
          <p className="text-gray-600">新しいタスクを追加するか、一覧を確認してください</p>
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
              className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
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
              className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
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
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                スキップ (Space)
              </button>
            </div>
          </div>

          {/* Right - Life */}
          <div className="col-start-3 row-start-2">
            <button
              onClick={() => handleClassify('life')}
              className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
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
              className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex flex-col items-center justify-center p-4"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
          {/* 現在のタスク */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">🎯 現在のタスク</h3>
              <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                {inboxTasks.indexOf(currentTask) + 1} / {inboxTasks.length}
              </span>
            </div>
            <p className="text-xl text-gray-900 font-medium">{currentTask.title}</p>
          </div>

          {/* 残りのタスクリスト */}
          {inboxTasks.length > 1 && (
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm text-gray-500 font-medium mb-3">次のタスク:</h4>
              <div className="space-y-2">
                {inboxTasks.slice(1, Math.min(5, inboxTasks.length)).map((task, index) => (
                  <div
                    key={task.id}
                    className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-sm text-gray-400 mr-2">{index + 2}.</span>
                    <span className="text-gray-700">{task.title}</span>
                  </div>
                ))}
                {inboxTasks.length > 5 && (
                  <div className="text-sm text-gray-400 text-center py-2">
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